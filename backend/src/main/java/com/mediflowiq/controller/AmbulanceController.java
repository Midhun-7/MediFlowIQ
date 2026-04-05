package com.mediflowiq.controller;

import com.mediflowiq.dto.AmbulanceResponse;
import com.mediflowiq.model.AmbulanceStatus;
import com.mediflowiq.service.AmbulanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ambulances")
public class AmbulanceController {

    private final AmbulanceService ambulanceService;

    public AmbulanceController(AmbulanceService ambulanceService) {
        this.ambulanceService = ambulanceService;
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
}
