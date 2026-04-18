package com.mediflowiq.controller;

import com.mediflowiq.model.Hospital;
import com.mediflowiq.service.HospitalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Phase 5 — Multi-hospital REST controller.
 *
 * GET  /api/hospitals          — list all hospitals with load info
 * GET  /api/hospitals/active   — list active hospitals only
 * GET  /api/hospitals/recommend — load-balanced redirect recommendation
 */
@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    private final HospitalService hospitalService;

    public HospitalController(HospitalService hospitalService) {
        this.hospitalService = hospitalService;
    }

    @GetMapping
    public ResponseEntity<List<Hospital>> getAllHospitals() {
        return ResponseEntity.ok(hospitalService.getAllHospitals());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Hospital>> getActiveHospitals() {
        return ResponseEntity.ok(hospitalService.getActiveHospitals());
    }

    /**
     * Returns a JSON object with:
     *   { recommended: true,  hospital: { ... } }  — when primary is overloaded
     *   { recommended: false, hospital: null }       — when no redirect needed
     */
    @GetMapping("/recommend")
    public ResponseEntity<Map<String, Object>> getRecommendation() {
        Optional<Hospital> rec = hospitalService.getRedirectRecommendation();
        // Use HashMap instead of Map.of() because Map.of() does not allow null values
        Map<String, Object> result = new HashMap<>();
        result.put("recommended", rec.isPresent());
        result.put("hospital", rec.orElse(null));
        return ResponseEntity.ok(result);
    }
}
