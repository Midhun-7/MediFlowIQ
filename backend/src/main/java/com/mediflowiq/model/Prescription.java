package com.mediflowiq.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Phase 6 — A prescription written by a doctor for a patient.
 * Contains one or more {@link PrescriptionItem} medication entries.
 */
@Entity
@Table(name = "prescriptions")
public class Prescription {

    public enum Status { ACTIVE, COMPLETED, EXPIRED }

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

    @Column(name = "prescribed_date", nullable = false)
    private LocalDate prescribedDate;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PrescriptionItem> medications = new ArrayList<>();

    public Prescription() {}

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public Long getId()                                     { return id; }
    public void setId(Long id)                              { this.id = id; }

    public PatientAccount getPatientAccount()               { return patientAccount; }
    public void setPatientAccount(PatientAccount pa)        { this.patientAccount = pa; }

    public Doctor getDoctor()                               { return doctor; }
    public void setDoctor(Doctor d)                         { this.doctor = d; }

    public Hospital getHospital()                           { return hospital; }
    public void setHospital(Hospital h)                     { this.hospital = h; }

    public LocalDate getPrescribedDate()                    { return prescribedDate; }
    public void setPrescribedDate(LocalDate d)              { this.prescribedDate = d; }

    public LocalDate getValidUntil()                        { return validUntil; }
    public void setValidUntil(LocalDate d)                  { this.validUntil = d; }

    public Status getStatus()                               { return status; }
    public void setStatus(Status status)                    { this.status = status; }

    public String getSpecialInstructions()                  { return specialInstructions; }
    public void setSpecialInstructions(String si)           { this.specialInstructions = si; }

    public List<PrescriptionItem> getMedications()          { return medications; }
    public void setMedications(List<PrescriptionItem> m)    { this.medications = m; }
}
