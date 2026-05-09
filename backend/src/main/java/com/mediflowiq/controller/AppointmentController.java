package com.mediflowiq.controller;

import com.mediflowiq.dto.CreateAppointmentRequest;
import com.mediflowiq.dto.VerifyPaymentRequest;
import com.mediflowiq.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Phase 6 — Appointment booking and Razorpay payment.
 *
 * POST /api/appointments                        — create appointment + Razorpay order
 * POST /api/appointments/{id}/verify-payment    — verify signature, confirm booking
 */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired private AppointmentService appointmentService;

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
}
