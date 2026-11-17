package com.mediflowiq.controller;

import com.mediflowiq.model.*;
import com.mediflowiq.service.PatientPortalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Phase 6 — Patient portal data endpoints.
 * All routes require a valid patient JWT (patientId in path validated against token).
 *
 * GET /api/patient/{id}/dashboard
 * GET /api/patient/{id}/medical-history
 * GET /api/patient/{id}/conditions
 * GET /api/patient/{id}/prescriptions
 * GET /api/patient/{id}/appointments
 */
@RestController
@RequestMapping("/api/patient")
public class PatientPortalController {

    @Autowired private PatientPortalService patientPortalService;

    private boolean isAuthorized(Long patientId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        boolean isStaffOrDoctorOrAdmin = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("ROLE_DOCTOR") ||
                a.getAuthority().equals("ROLE_STAFF"));
        if (isStaffOrDoctorOrAdmin) {
            return true;
        }
        return ("patient:" + patientId).equals(auth.getName());
    }

    @GetMapping("/{id}/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard(@PathVariable Long id) {
        if (!isAuthorized(id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(patientPortalService.getDashboard(id));
    }

    @GetMapping("/{id}/medical-history")
    public ResponseEntity<List<MedicalRecord>> medicalHistory(@PathVariable Long id) {
        if (!isAuthorized(id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(patientPortalService.getMedicalHistory(id));
    }

    @GetMapping("/{id}/conditions")
    public ResponseEntity<List<Condition>> conditions(@PathVariable Long id) {
        if (!isAuthorized(id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(patientPortalService.getConditions(id));
    }

    @GetMapping("/{id}/prescriptions")
    public ResponseEntity<List<Prescription>> prescriptions(@PathVariable Long id) {
        if (!isAuthorized(id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(patientPortalService.getPrescriptions(id));
    }

    @GetMapping("/{id}/appointments")
    public ResponseEntity<List<Appointment>> appointments(@PathVariable Long id) {
        if (!isAuthorized(id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(patientPortalService.getMyAppointments(id));
    }
}
