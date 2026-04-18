package com.mediflowiq.controller;

import com.mediflowiq.dto.RegisterPatientRequest;
import com.mediflowiq.service.NotificationService;
import com.mediflowiq.service.QueueService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Phase 5 — Patient import from external hospital systems.
 *
 * Accepts a simplified HL7 FHIR-like JSON payload and registers the patient
 * into the MediFlowIQ queue, simulating real external hospital system integration.
 *
 * POST /api/import/patient  (ADMIN only)
 *
 * Expected body (HL7-lite):
 * {
 *   "resourceType": "Patient",
 *   "name": "Rahul Mehta",
 *   "age": 45,
 *   "priority": "HIGH_RISK",
 *   "symptoms": "Chest pain, shortness of breath",
 *   "sourceSystem": "Apollo Hospitals EMR",
 *   "externalId": "APL-2024-08932"
 * }
 */
@RestController
@RequestMapping("/api/import")
public class PatientImportController {

    private final QueueService queueService;
    private final NotificationService notificationService;

    public PatientImportController(QueueService queueService,
                                   NotificationService notificationService) {
        this.queueService = queueService;
        this.notificationService = notificationService;
    }

    @PostMapping("/patient")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> importPatient(
            @RequestBody Map<String, String> body) {

        // Validate source system
        String sourceSystem = body.getOrDefault("sourceSystem", "External System");
        String externalId   = body.getOrDefault("externalId", "N/A");
        String name         = body.getOrDefault("name", "Unknown");

        // Map HL7-lite fields to internal DTO
        RegisterPatientRequest request = new RegisterPatientRequest();
        request.setName(name);
        request.setAge(Integer.parseInt(body.getOrDefault("age", "0")));
        request.setPriority(
            com.mediflowiq.model.Priority.valueOf(
                body.getOrDefault("priority", "NORMAL").toUpperCase()
            )
        );
        request.setSymptoms(
            "[Imported from " + sourceSystem + " | ID: " + externalId + "] " +
            body.getOrDefault("symptoms", "")
        );

        var queueEntry = queueService.registerPatient(request);

        // Fire import-specific notification
        notificationService.patientImported(name, sourceSystem);

        return ResponseEntity.ok(Map.of(
            "status",      "imported",
            "queueEntry",  queueEntry,
            "externalId",  externalId,
            "sourceSystem", sourceSystem,
            "message",     "Patient successfully imported and added to queue as token " + queueEntry.getToken()
        ));
    }
}
