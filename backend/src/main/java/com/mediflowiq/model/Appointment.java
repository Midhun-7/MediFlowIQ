package com.mediflowiq.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Phase 6 — An appointment booked by a patient with a doctor.
 * Payment is handled via Razorpay Orders API; the order and payment IDs
 * are stored for verification and audit purposes.
 */
@Entity
@Table(name = "appointments")
public class Appointment {

    public enum Status { PENDING_PAYMENT, CONFIRMED, CANCELLED, COMPLETED }
    public enum AppointmentType { IN_PERSON, TELEMEDICINE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_account_id", nullable = false)
    private PatientAccount patientAccount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "appointment_type", nullable = false, length = 20)
    private AppointmentType appointmentType = AppointmentType.IN_PERSON;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING_PAYMENT;

    /** Razorpay Order ID (e.g. order_xxxxxxxxxx) */
    @Column(name = "razorpay_order_id", length = 100)
    private String razorpayOrderId;

    /** Razorpay Payment ID after successful payment */
    @Column(name = "razorpay_payment_id", length = 100)
    private String razorpayPaymentId;

    /** Amount in paise (INR × 100) — e.g. 80000 for ₹800 */
    @Column(name = "amount_paise")
    private Integer amountPaise;

    @Column(name = "currency", length = 5)
    private String currency = "INR";

    @Column(name = "queue_position")
    private Integer queuePosition;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Appointment() {}

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public Long getId()                                         { return id; }
    public void setId(Long id)                                  { this.id = id; }

    public PatientAccount getPatientAccount()                   { return patientAccount; }
    public void setPatientAccount(PatientAccount pa)            { this.patientAccount = pa; }

    public Doctor getDoctor()                                   { return doctor; }
    public void setDoctor(Doctor d)                             { this.doctor = d; }

    public Hospital getHospital()                               { return hospital; }
    public void setHospital(Hospital h)                         { this.hospital = h; }

    public LocalDateTime getScheduledAt()                       { return scheduledAt; }
    public void setScheduledAt(LocalDateTime t)                 { this.scheduledAt = t; }

    public AppointmentType getAppointmentType()                 { return appointmentType; }
    public void setAppointmentType(AppointmentType t)           { this.appointmentType = t; }

    public Status getStatus()                                   { return status; }
    public void setStatus(Status status)                        { this.status = status; }

    public String getRazorpayOrderId()                          { return razorpayOrderId; }
    public void setRazorpayOrderId(String id)                   { this.razorpayOrderId = id; }

    public String getRazorpayPaymentId()                        { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String id)                 { this.razorpayPaymentId = id; }

    public Integer getAmountPaise()                             { return amountPaise; }
    public void setAmountPaise(Integer amount)                  { this.amountPaise = amount; }

    public String getCurrency()                                 { return currency; }
    public void setCurrency(String currency)                    { this.currency = currency; }

    public Integer getQueuePosition()                           { return queuePosition; }
    public void setQueuePosition(Integer pos)                   { this.queuePosition = pos; }

    public LocalDateTime getCreatedAt()                         { return createdAt; }
    public void setCreatedAt(LocalDateTime d)                   { this.createdAt = d; }
}
