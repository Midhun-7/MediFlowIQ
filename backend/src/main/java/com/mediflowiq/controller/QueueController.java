package com.mediflowiq.controller;

import com.mediflowiq.dto.QueueEntryResponse;
import com.mediflowiq.dto.RegisterPatientRequest;
import com.mediflowiq.model.PatientStatus;
import com.mediflowiq.service.QueueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/queue")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    @PostMapping("/register")
    public ResponseEntity<QueueEntryResponse> registerPatient(
            @Valid @RequestBody RegisterPatientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(queueService.registerPatient(request));
    }

    @GetMapping
    public ResponseEntity<List<QueueEntryResponse>> getQueue() {
        return ResponseEntity.ok(queueService.getActiveQueue());
    }

    @PatchMapping("/{patientId}/status")
    public ResponseEntity<QueueEntryResponse> updateStatus(
            @PathVariable Long patientId,
            @RequestBody Map<String, String> body) {
        PatientStatus newStatus = PatientStatus.valueOf(body.get("status").toUpperCase());
        return ResponseEntity.ok(queueService.updatePatientStatus(patientId, newStatus));
    }

    @GetMapping("/stats")
    public ResponseEntity<QueueService.QueueStatsResponse> getStats() {
        return ResponseEntity.ok(queueService.getStats());
    }
}
