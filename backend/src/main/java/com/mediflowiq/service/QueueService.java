package com.mediflowiq.service;

import com.mediflowiq.dto.QueueEntryResponse;
import com.mediflowiq.dto.RegisterPatientRequest;
import com.mediflowiq.model.Patient;
import com.mediflowiq.model.PatientStatus;
import com.mediflowiq.model.Priority;
import com.mediflowiq.model.QueueEntry;
import com.mediflowiq.repository.PatientRepository;
import com.mediflowiq.repository.QueueEntryRepository;
import com.mediflowiq.model.SystemLoad;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class QueueService {

    private static final Logger log = LoggerFactory.getLogger(QueueService.class);
    private static final int AVG_SERVICE_TIME_MINUTES = 10;
    private final AtomicInteger tokenCounter = new AtomicInteger(1000);

    private final PatientRepository patientRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final HospitalService hospitalService;

    public QueueService(PatientRepository patientRepository,
                        QueueEntryRepository queueEntryRepository,
                        SimpMessagingTemplate messagingTemplate,
                        NotificationService notificationService,
                        @Lazy HospitalService hospitalService) {
        this.patientRepository = patientRepository;
        this.queueEntryRepository = queueEntryRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
        this.hospitalService = hospitalService;
    }

    @Transactional
    public QueueEntryResponse registerPatient(RegisterPatientRequest request) {
        String token = generateToken(request.getPriority());

        Patient patient = new Patient(
                request.getName(),
                request.getAge(),
                request.getPriority(),
                token,
                request.getSymptoms()
        );
        patient = patientRepository.save(patient);
        log.info("Registered patient: {} [Token: {}, Priority: {}]",
                patient.getName(), token, patient.getPriority());

        QueueEntry entry = new QueueEntry(patient, 0, 0);
        queueEntryRepository.save(entry);

        recalculateQueue();

        QueueEntry updatedEntry = queueEntryRepository.findByPatientId(patient.getId())
                .orElseThrow(() -> new RuntimeException("Queue entry not found after creation"));

        broadcastQueueUpdate();

        // Phase 5 — fire notification
        notificationService.patientRegistered(patient.getName(), token, patient.getPriority().name());

        return QueueEntryResponse.from(updatedEntry);
    }

    @Transactional(readOnly = true)
    public List<QueueEntryResponse> getActiveQueue() {
        return queueEntryRepository.findActiveQueueSortedByPriority()
                .stream()
                .map(QueueEntryResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public QueueEntryResponse updatePatientStatus(Long patientId, PatientStatus newStatus) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));

        String oldStatus = patient.getStatus().name();
        patient.setStatus(newStatus);
        patientRepository.save(patient);
        log.info("Patient {} status updated to {}", patient.getName(), newStatus);

        recalculateQueue();
        broadcastQueueUpdate();

        // Phase 5 — fire notification
        notificationService.statusChanged(patient.getName(), oldStatus, newStatus.name());

        QueueEntry entry = queueEntryRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Queue entry not found"));

        return QueueEntryResponse.from(entry);
    }

    @Transactional(readOnly = true)
    public QueueStatsResponse getStats() {
        long totalWaiting = patientRepository.countByStatus(PatientStatus.WAITING);
        long emergencies = patientRepository.findByStatus(PatientStatus.WAITING)
                .stream()
                .filter(p -> p.getPriority() == Priority.EMERGENCY)
                .count();

        List<QueueEntry> activeQueue = queueEntryRepository.findActiveQueueSortedByPriority();
        double avgWait = activeQueue.stream()
                .mapToInt(e -> e.getEstimatedWaitMinutes() != null ? e.getEstimatedWaitMinutes() : 0)
                .average()
                .orElse(0);

        SystemLoad load = calculateSystemLoad(totalWaiting, emergencies);

        // Phase 5 — sync hospital load counter
        hospitalService.updatePrimaryLoad((int) totalWaiting);

        // Phase 5 — fire high-load alert when crossing into HIGH/CRITICAL
        if (load == SystemLoad.HIGH || load == SystemLoad.CRITICAL) {
            notificationService.highLoadAlert(totalWaiting, emergencies);
        }

        return new QueueStatsResponse(totalWaiting, emergencies, (int) Math.round(avgWait), load);
    }

    private SystemLoad calculateSystemLoad(long totalWaiting, long emergencies) {
        if (emergencies > 3 || totalWaiting > 20) return SystemLoad.CRITICAL;
        if (emergencies > 1 || totalWaiting > 12) return SystemLoad.HIGH;
        if (totalWaiting > 5) return SystemLoad.MODERATE;
        return SystemLoad.LOW;
    }

    private void recalculateQueue() {
        List<QueueEntry> sorted = queueEntryRepository.findActiveQueueSortedByPriority();
        int baseWait = 0;
        
        for (int i = 0; i < sorted.size(); i++) {
            QueueEntry entry = sorted.get(i);
            entry.setPosition(i + 1);
            
            // Intelligence: Emergency patients have a faster "processing" time but contribute 
            // to longer waits for others.
            int serviceMultiplier = switch (entry.getPatient().getPriority()) {
                case EMERGENCY -> 5;  // 5 mins per emergency
                case HIGH_RISK -> 10; // 10 mins per high risk
                case NORMAL    -> 15; // 15 mins per normal
            };
            
            baseWait += serviceMultiplier;
            entry.setEstimatedWaitMinutes(baseWait);
            queueEntryRepository.save(entry);
        }
    }

    private void broadcastQueueUpdate() {
        List<QueueEntryResponse> queue = queueEntryRepository
                .findActiveQueueSortedByPriority()
                .stream()
                .map(QueueEntryResponse::from)
                .collect(Collectors.toList());
        messagingTemplate.convertAndSend("/topic/queue", queue);
        
        // Also broadcast stats update
        messagingTemplate.convertAndSend("/topic/stats", getStats());
        
        log.debug("Broadcast queue and stats update");
    }

    private String generateToken(Priority priority) {
        String prefix = switch (priority) {
            case EMERGENCY -> "E";
            case HIGH_RISK -> "H";
            case NORMAL    -> "N";
        };
        return prefix + tokenCounter.getAndIncrement();
    }

    public record QueueStatsResponse(long totalWaiting, long emergencies, int avgWaitMinutes, SystemLoad load) {}
}
