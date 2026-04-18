package com.mediflowiq.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * Phase 5 — In-app notification service.
 *
 * Maintains a rolling window of the last 50 system events and broadcasts them
 * via WebSocket to /topic/notifications. No database persistence required.
 *
 * Event types:
 *   PATIENT_REGISTERED   — new patient added to queue
 *   STATUS_CHANGED       — patient status updated
 *   AMBULANCE_ARRIVED    — ambulance reached hospital
 *   AMBULANCE_LIVE_GPS   — driver started sharing real GPS
 *   HIGH_LOAD_ALERT      — queue exceeded HIGH threshold
 *   PATIENT_IMPORTED     — patient imported from external system
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final int MAX_HISTORY = 50;

    private final SimpMessagingTemplate messagingTemplate;
    private final Deque<Notification> history = new ArrayDeque<>();

    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // ── Public API ──────────────────────────────────────────────────────────

    public void patientRegistered(String patientName, String token, String priority) {
        emit(new Notification(
            EventType.PATIENT_REGISTERED,
            "Patient Registered",
            patientName + " added to queue [" + token + "] — Priority: " + priority,
            priority
        ));
    }

    public void statusChanged(String patientName, String oldStatus, String newStatus) {
        emit(new Notification(
            EventType.STATUS_CHANGED,
            "Status Updated",
            patientName + " → " + oldStatus + " → " + newStatus,
            "INFO"
        ));
    }

    public void ambulanceArrived(String callSign) {
        emit(new Notification(
            EventType.AMBULANCE_ARRIVED,
            "Ambulance Arrived",
            callSign + " has arrived at the hospital and is AVAILABLE",
            "INFO"
        ));
    }

    public void ambulanceLiveGps(String callSign) {
        emit(new Notification(
            EventType.AMBULANCE_LIVE_GPS,
            "Live GPS Active",
            callSign + " — driver is sharing real-time GPS location",
            "INFO"
        ));
    }

    public void highLoadAlert(long queueSize, long emergencies) {
        emit(new Notification(
            EventType.HIGH_LOAD_ALERT,
            "⚠️ High Load Alert",
            "Queue has " + queueSize + " patients (" + emergencies + " emergencies) — consider diverting",
            "HIGH"
        ));
    }

    public void patientImported(String patientName, String source) {
        emit(new Notification(
            EventType.PATIENT_IMPORTED,
            "Patient Imported",
            patientName + " imported from external system: " + source,
            "INFO"
        ));
    }

    public List<Notification> getHistory() {
        return new ArrayList<>(history);
    }

    // ── Internals ───────────────────────────────────────────────────────────

    private synchronized void emit(Notification n) {
        if (history.size() >= MAX_HISTORY) {
            history.pollFirst();   // remove oldest
        }
        history.addLast(n);
        messagingTemplate.convertAndSend("/topic/notifications", n);
        log.info("[Notification] {} — {}", n.type(), n.message());
    }

    // ── Event type enum ─────────────────────────────────────────────────────

    public enum EventType {
        PATIENT_REGISTERED,
        STATUS_CHANGED,
        AMBULANCE_ARRIVED,
        AMBULANCE_LIVE_GPS,
        HIGH_LOAD_ALERT,
        PATIENT_IMPORTED
    }

    // ── Notification record (serialised to JSON via WebSocket) ──────────────

    public record Notification(
        EventType type,
        String title,
        String message,
        String severity,             // EMERGENCY / HIGH / INFO
        String timestamp
    ) {
        public Notification(EventType type, String title, String message, String severity) {
            this(type, title, message, severity, Instant.now().toString());
        }
    }
}
