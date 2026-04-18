package com.mediflowiq.service;

import com.mediflowiq.model.Hospital;
import com.mediflowiq.repository.HospitalRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Phase 5 — Multi-hospital service.
 *
 * Seeds 4 hospitals in Bengaluru and provides load-balancing recommendations.
 * The "primary" hospital is Bengaluru City Hospital (id=1), matching the
 * ambulance simulation target coordinates.
 */
@Service
public class HospitalService {

    private static final Logger log = LoggerFactory.getLogger(HospitalService.class);

    /** Load percentage above which a hospital is considered overloaded */
    private static final int OVERLOAD_THRESHOLD_PERCENT = 80;

    private final HospitalRepository hospitalRepository;

    public HospitalService(HospitalRepository hospitalRepository) {
        this.hospitalRepository = hospitalRepository;
    }

    // ── Seed hospitals on startup ────────────────────────────────────────────

    @PostConstruct
    @Transactional
    public void seedHospitals() {
        if (hospitalRepository.count() > 0) return;

        hospitalRepository.saveAll(List.of(
            new Hospital(
                "Bengaluru City Hospital",
                "Bengaluru",
                "KH Road, Shivajinagar, Bengaluru 560001",
                12.9716, 77.5946,
                30,
                "+91-80-2286-5270"
            ),
            new Hospital(
                "Jayadeva Institute of Cardiovascular Sciences",
                "Bengaluru",
                "Bannerghatta Road, Jayanagar 9th Block, Bengaluru 560069",
                12.9016, 77.5996,
                25,
                "+91-80-2657-8888"
            ),
            new Hospital(
                "Bowring & Lady Curzon Hospital",
                "Bengaluru",
                "Shivaji Nagar, Bengaluru 560001",
                12.9780, 77.6070,
                40,
                "+91-80-2286-5701"
            ),
            new Hospital(
                "Victoria Hospital",
                "Bengaluru",
                "Fort Rd, Krishna Rajendra Market, Bengaluru 560002",
                12.9584, 77.5703,
                35,
                "+91-80-2670-1150"
            )
        ));

        log.info("[Hospital] Seeded 4 Bengaluru hospitals.");
    }

    // ── Query helpers ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Hospital> getActiveHospitals() {
        return hospitalRepository.findByActiveTrue();
    }

    /**
     * Updates the live queue load for the primary hospital (id=1).
     * Called from QueueService after every queue change.
     */
    @Transactional
    public void updatePrimaryLoad(int queueSize) {
        hospitalRepository.findById(1L).ifPresent(h -> {
            h.setCurrentLoad(queueSize);
            hospitalRepository.save(h);
        });
    }

    /**
     * Returns loan-balancing recommendation: the active hospital with the
     * lowest load, if the primary hospital is above the overload threshold.
     *
     * Returns empty if no action needed.
     */
    @Transactional(readOnly = true)
    public Optional<Hospital> getRedirectRecommendation() {
        Hospital primary = hospitalRepository.findById(1L).orElse(null);
        if (primary == null) return Optional.empty();

        // Only recommend if primary is overloaded
        if (primary.getLoadPercent() < OVERLOAD_THRESHOLD_PERCENT) {
            return Optional.empty();
        }

        // Find active alternatives ordered by ascending load
        return hospitalRepository.findByActiveTrueOrderByCurrentLoadAsc()
                .stream()
                .filter(h -> !h.getId().equals(1L))  // exclude primary
                .findFirst();
    }
}
