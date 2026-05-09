package com.mediflowiq.controller;

import com.mediflowiq.dto.CreatePrescriptionRequest;
import com.mediflowiq.model.PatientAccount;
import com.mediflowiq.model.Prescription;
import com.mediflowiq.repository.DoctorRepository;
import com.mediflowiq.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Phase 6 — Doctor-side prescription writing.
 * Requires DOCTOR role.
 *
 * GET  /api/doctor/patients         — search patients to write Rx for
 * POST /api/doctor/prescriptions    — write a new prescription
 */
@RestController
@RequestMapping("/api/doctor")
public class DoctorPrescriptionController {

    @Autowired private DoctorService doctorService;
    @Autowired private DoctorRepository doctorRepo;

    @GetMapping("/patients")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<PatientAccount>> getPatients() {
        return ResponseEntity.ok(doctorService.getAllPatients());
    }

    @PostMapping("/prescriptions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> writePrescription(
            @Valid @RequestBody CreatePrescriptionRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        // Resolve doctor from logged-in AppUser
        Long doctorId = doctorRepo.findByAppUserId(
                        Long.parseLong(userDetails.getUsername().replaceAll("[^0-9]", "")))
                .map(d -> d.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No doctor profile found for this account. Contact admin."));

        Prescription prescription = doctorService.writePrescription(doctorId, req);
        return ResponseEntity.ok(Map.of(
                "message",        "Prescription saved",
                "prescriptionId", prescription.getId(),
                "patientId",      prescription.getPatientAccount().getId()
        ));
    }
}
