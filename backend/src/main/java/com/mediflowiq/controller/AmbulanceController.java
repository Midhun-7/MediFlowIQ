package com.mediflowiq.controller;

import com.mediflowiq.dto.AmbulanceResponse;
import com.mediflowiq.model.AmbulanceStatus;
import com.mediflowiq.service.AmbulanceService;
import com.mediflowiq.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ambulances")
public class AmbulanceController {

    private final AmbulanceService ambulanceService;
    private final NotificationService notificationService;

    public AmbulanceController(AmbulanceService ambulanceService,
                               NotificationService notificationService) {
        this.ambulanceService = ambulanceService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<AmbulanceResponse>> getAllAmbulances() {
        return ResponseEntity.ok(ambulanceService.getAllAmbulances());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AmbulanceResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        AmbulanceStatus status = AmbulanceStatus.valueOf(body.get("status").toUpperCase());
        return ResponseEntity.ok(ambulanceService.updateStatus(id, status));
    }

    /**
     * Phase 5 — real GPS from driver's mobile browser / app.
     * No JWT required (allowed via SecurityConfig for /api/ambulances/{id}/location).
     *
     * Body: { "lat": 12.97, "lng": 77.59 }
     */
    @PostMapping("/{id}/location")
    public ResponseEntity<AmbulanceResponse> updateLocation(
            @PathVariable Long id,
            @RequestBody Map<String, Double> body) {
        double lat = body.get("lat");
        double lng = body.get("lng");
        return ResponseEntity.ok(ambulanceService.updateLocation(id, lat, lng));
    }
}
