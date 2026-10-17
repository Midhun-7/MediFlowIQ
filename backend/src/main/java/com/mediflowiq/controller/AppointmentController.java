package com.mediflowiq.controller;

import com.mediflowiq.dto.CreateAppointmentRequest;
import com.mediflowiq.dto.VerifyPaymentRequest;
import com.mediflowiq.model.Appointment;
import com.mediflowiq.repository.DoctorRepository;
import com.mediflowiq.service.AppointmentService;
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
 * Phase 6 — Appointment booking and Razorpay payment.
 *
 * POST  /api/appointments                        — create appointment + Razorpay order
 * POST  /api/appointments/{id}/verify-payment    — verify signature, confirm booking
 * PATCH /api/appointments/{id}/complete          — mark appointment COMPLETED (DOCTOR/ADMIN)
 * GET   /api/appointments?doctorId=&today=       — list appointments for a doctor
 */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired private AppointmentService appointmentService;
    @Autowired private DoctorService doctorService;
    @Autowired private DoctorRepository doctorRepo;

    /**
     * Creates an appointment and returns Razorpay order details.
     * patientAccountId is passed as a request param (validated against JWT in production).
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createAppointment(
            @RequestParam Long patientAccountId,
            @Valid @RequestBody CreateAppointmentRequest req) {
        return ResponseEntity.ok(appointmentService.createAppointment(patientAccountId, req));
    }

    /**
     * Called by frontend after Razorpay checkout success.
     * Verifies HMAC-SHA256 signature server-side before confirming.
     */
    @PostMapping("/{id}/verify-payment")
    public ResponseEntity<Map<String, Object>> verifyPayment(
            @PathVariable Long id,
            @Valid @RequestBody VerifyPaymentRequest req) {
        return ResponseEntity.ok(appointmentService.verifyPayment(id, req));
    }

    /**
     * Marks an appointment as COMPLETED and pushes a WS notification to the patient.
     * Accessible only by DOCTOR or ADMIN roles.
     */
    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> completeAppointment(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.completeAppointment(id));
    }

    /**
     * Returns appointments for a given doctor.
     * Resolves the doctorId from the JWT when not supplied (self-service mode),
     * or uses the explicitly passed doctorId param.
     *
     * Query params:
     *   doctorId — optional; if omitted, resolved from the authenticated doctor's JWT
     *   today    — if "true", only return appointments scheduled for today
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Appointment>> getDoctorAppointments(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(defaultValue = "false") boolean today,
            @RequestParam(defaultValue = "false") boolean allDoctors,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (allDoctors || (doctorId != null && doctorId <= 0)) {
            return ResponseEntity.ok(appointmentService.getDoctorAppointments(null, today));
        }

        String username = userDetails != null ? userDetails.getUsername() : null;
        long resolvedDoctorId = doctorService.resolveDoctorId(username, doctorId);
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(resolvedDoctorId, today));
    }
}
