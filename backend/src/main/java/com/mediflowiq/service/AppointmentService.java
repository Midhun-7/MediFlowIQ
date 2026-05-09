package com.mediflowiq.service;

import com.mediflowiq.dto.CreateAppointmentRequest;
import com.mediflowiq.dto.VerifyPaymentRequest;
import com.mediflowiq.model.*;
import com.mediflowiq.repository.*;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;

/**
 * Phase 6 — Appointment booking with Razorpay payment.
 *
 * Flow:
 *  1. createAppointment()   → saves PENDING_PAYMENT appointment, creates Razorpay order
 *  2. verifyPayment()       → verifies HMAC-SHA256 signature, marks CONFIRMED, notifies via WS
 */
@Service
public class AppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    @Autowired(required = false)
    private PatientAccountRepository patientRepo;
    @Autowired private DoctorRepository doctorRepo;
    @Autowired private HospitalRepository hospitalRepo;
    @Autowired private AppointmentRepository appointmentRepo;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    /**
     * Creates an appointment in PENDING_PAYMENT state and a Razorpay order.
     * Returns { orderId, amount, currency, keyId, appointmentId } for the frontend.
     */
    @Transactional
    public Map<String, Object> createAppointment(Long patientAccountId,
                                                  CreateAppointmentRequest req) {
        PatientAccount patient = patientRepo.findById(patientAccountId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        Doctor doctor = doctorRepo.findById(req.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));

        int feePaise = doctor.getConsultationFee() != null ? doctor.getConsultationFee() * 100 : 50000;

        // Persist appointment first (PENDING_PAYMENT)
        Appointment appt = new Appointment();
        appt.setPatientAccount(patient);
        appt.setDoctor(doctor);
        appt.setHospital(doctor.getHospital());
        appt.setScheduledAt(LocalDateTime.parse(req.getScheduledAt()));
        appt.setAppointmentType(Appointment.AppointmentType.valueOf(req.getAppointmentType()));
        appt.setStatus(Appointment.Status.PENDING_PAYMENT);
        appt.setAmountPaise(feePaise);
        appt.setCurrency("INR");
        Appointment saved = appointmentRepo.save(appt);

        // Create Razorpay order
        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", feePaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "appt_" + saved.getId());
            orderRequest.put("payment_capture", 1);

            Order rzpOrder = client.orders.create(orderRequest);
            String orderId = rzpOrder.get("id");

            saved.setRazorpayOrderId(orderId);
            appointmentRepo.save(saved);

            return Map.of(
                    "appointmentId",  saved.getId(),
                    "orderId",        orderId,
                    "amount",         feePaise,
                    "currency",       "INR",
                    "keyId",          razorpayKeyId,
                    "doctorName",     doctor.getName(),
                    "hospitalName",   doctor.getHospital() != null ? doctor.getHospital().getName() : ""
            );
        } catch (RazorpayException e) {
            log.error("[Razorpay] Order creation failed: {}", e.getMessage());
            throw new RuntimeException("Payment gateway error. Please try again.");
        }
    }

    /**
     * Verifies the Razorpay signature (HMAC-SHA256).
     * orderId + "|" + paymentId signed with key secret must match the signature.
     */
    @Transactional
    public Map<String, Object> verifyPayment(Long appointmentId, VerifyPaymentRequest req) {
        Appointment appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        String expected = hmacSha256(
                req.getRazorpayOrderId() + "|" + req.getRazorpayPaymentId(),
                razorpayKeySecret
        );

        if (!expected.equals(req.getRazorpaySignature())) {
            throw new IllegalArgumentException("Payment verification failed — signature mismatch");
        }

        appt.setStatus(Appointment.Status.CONFIRMED);
        appt.setRazorpayPaymentId(req.getRazorpayPaymentId());
        appointmentRepo.save(appt);

        // Real-time notification to patient
        messagingTemplate.convertAndSend(
                "/topic/patient/" + appt.getPatientAccount().getId(),
                Map.of("type",    "APPOINTMENT_CONFIRMED",
                       "message", "Your appointment with Dr. " + appt.getDoctor().getName()
                                  + " is confirmed!",
                       "appointmentId", appt.getId())
        );

        log.info("[Payment] Appointment {} confirmed, paymentId={}", appointmentId, req.getRazorpayPaymentId());
        return Map.of("status", "CONFIRMED", "appointmentId", appt.getId());
    }

    // ── HMAC-SHA256 helper ────────────────────────────────────────────────────

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }
}
