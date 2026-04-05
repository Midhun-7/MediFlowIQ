package com.mediflowiq.service;

import com.mediflowiq.dto.AmbulanceResponse;
import com.mediflowiq.model.Ambulance;
import com.mediflowiq.model.AmbulanceStatus;
import com.mediflowiq.repository.AmbulanceRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Service
public class AmbulanceService {

    private static final Logger log = LoggerFactory.getLogger(AmbulanceService.class);

    // ── Hospital coordinates (Bengaluru City Hospital) ─────────────
    private static final double HOSPITAL_LAT = 12.9716;
    private static final double HOSPITAL_LNG = 77.5946;

    // Movement step per tick (~3 sec tick, ~40 km/h → ~33m per tick)
    private static final double STEP = 0.0003;

    // Speed in km/h for rough ETA
    private static final double SPEED_KMH = 40.0;

    private final AmbulanceRepository ambulanceRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final Random random = new Random();

    public AmbulanceService(AmbulanceRepository ambulanceRepository,
                            SimpMessagingTemplate messagingTemplate) {
        this.ambulanceRepository = ambulanceRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // ── Seed 3 ambulances on startup ────────────────────────────────
    @PostConstruct
    @Transactional
    public void seedAmbulances() {
        if (ambulanceRepository.count() > 0) return; // idempotent

        // Ambulance 1 — DISPATCHED (en-route to call, moving toward hospital)
        Ambulance a1 = new Ambulance("AMB-01", "Ravi Kumar", 12.9850, 77.5600);
        a1.setStatus(AmbulanceStatus.DISPATCHED);
        a1.setTargetLat(HOSPITAL_LAT);
        a1.setTargetLng(HOSPITAL_LNG);
        a1.setEtaMinutes(estimateEta(a1.getLat(), a1.getLng()));

        // Ambulance 2 — DISPATCHED from south
        Ambulance a2 = new Ambulance("AMB-02", "Priya Singh", 12.9550, 77.6200);
        a2.setStatus(AmbulanceStatus.DISPATCHED);
        a2.setTargetLat(HOSPITAL_LAT);
        a2.setTargetLng(HOSPITAL_LNG);
        a2.setEtaMinutes(estimateEta(a2.getLat(), a2.getLng()));

        // Ambulance 3 — AVAILABLE (parked at base near hospital)
        Ambulance a3 = new Ambulance("AMB-03", "Arjun Nair", 12.9730, 77.5960);
        a3.setStatus(AmbulanceStatus.AVAILABLE);
        a3.setTargetLat(HOSPITAL_LAT);
        a3.setTargetLng(HOSPITAL_LNG);

        ambulanceRepository.saveAll(List.of(a1, a2, a3));
        log.info("[Ambulance] Seeded 3 ambulances.");
    }

    // ── Scheduled GPS simulation tick (every 3 seconds) ────────────
    @Scheduled(fixedRate = 3000)
    @Transactional
    public void simulateMovement() {
        List<Ambulance> ambulances = ambulanceRepository.findAll();

        for (Ambulance amb : ambulances) {
            if (amb.getStatus() == AmbulanceStatus.DISPATCHED ||
                amb.getStatus() == AmbulanceStatus.RETURNING) {

                double dLat = amb.getTargetLat() - amb.getLat();
                double dLng = amb.getTargetLng() - amb.getLng();
                double dist = Math.sqrt(dLat * dLat + dLng * dLng);

                if (dist < STEP * 1.5) {
                    // Arrived at target
                    amb.setLat(amb.getTargetLat());
                    amb.setLng(amb.getTargetLng());
                    amb.setEtaMinutes(0);

                    if (amb.getStatus() == AmbulanceStatus.DISPATCHED) {
                        // Simulate: arrive at hospital, become available
                        amb.setStatus(AmbulanceStatus.AVAILABLE);
                        log.info("[Ambulance] {} arrived at hospital — now AVAILABLE", amb.getCallSign());

                        // After a short delay, redispatch with a random new scene location
                        redispatch(amb);
                    } else {
                        amb.setStatus(AmbulanceStatus.AVAILABLE);
                    }
                } else {
                    // Move one step toward target
                    double ratio = STEP / dist;
                    amb.setLat(amb.getLat() + dLat * ratio);
                    amb.setLng(amb.getLng() + dLng * ratio);
                    amb.setEtaMinutes(estimateEta(amb.getLat(), amb.getLng()));
                }

                ambulanceRepository.save(amb);
            }
        }

        broadcastUpdate();
    }

    /** Redispatches an ambulance to a random scene, then it will route back to hospital */
    private void redispatch(Ambulance amb) {
        // Random scene ~1-3 km from hospital
        double sceneLat = HOSPITAL_LAT + (random.nextDouble() - 0.5) * 0.04;
        double sceneLng = HOSPITAL_LNG + (random.nextDouble() - 0.5) * 0.04;

        amb.setLat(sceneLat);
        amb.setLng(sceneLng);
        amb.setTargetLat(HOSPITAL_LAT);
        amb.setTargetLng(HOSPITAL_LNG);
        amb.setStatus(AmbulanceStatus.DISPATCHED);
        amb.setEtaMinutes(estimateEta(sceneLat, sceneLng));
        log.info("[Ambulance] {} redispatched from ({}, {})", amb.getCallSign(), sceneLat, sceneLng);
    }

    // ── REST helpers ────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<AmbulanceResponse> getAllAmbulances() {
        return ambulanceRepository.findAll()
                .stream()
                .map(AmbulanceResponse::from)
                .toList();
    }

    @Transactional
    public AmbulanceResponse updateStatus(Long id, AmbulanceStatus newStatus) {
        Ambulance amb = ambulanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ambulance not found: " + id));
        amb.setStatus(newStatus);
        ambulanceRepository.save(amb);
        broadcastUpdate();
        return AmbulanceResponse.from(amb);
    }

    // ── Internals ───────────────────────────────────────────────────
    private void broadcastUpdate() {
        List<AmbulanceResponse> payload = ambulanceRepository.findAll()
                .stream()
                .map(AmbulanceResponse::from)
                .toList();
        messagingTemplate.convertAndSend("/topic/ambulance", payload);
    }

    /** Rough ETA estimate: distance in degrees → km → minutes at SPEED_KMH */
    private int estimateEta(double lat, double lng) {
        double dLat = HOSPITAL_LAT - lat;
        double dLng = HOSPITAL_LNG - lng;
        // Approximate: 1 degree ≈ 111 km
        double distKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111.0;
        return (int) Math.ceil((distKm / SPEED_KMH) * 60);
    }
}
