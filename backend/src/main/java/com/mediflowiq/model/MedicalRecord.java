package com.mediflowiq.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Phase 6 — Represents one event in a patient's medical history timeline.
 */
@Entity
@Table(name = "medical_records")
public class MedicalRecord {

    public enum VisitType { CONSULTATION, SURGERY, LAB_RESULT, FOLLOW_UP, EMERGENCY }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_account_id", nullable = false)
    private PatientAccount patientAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    @Column(name = "visit_date", nullable = false)
    private LocalDateTime visitDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "visit_type", nullable = false, length = 30)
    private VisitType visitType;

    @Column(length = 300)
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    public MedicalRecord() {}

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public Long getId()                                 { return id; }
    public void setId(Long id)                          { this.id = id; }

    public PatientAccount getPatientAccount()           { return patientAccount; }
    public void setPatientAccount(PatientAccount pa)    { this.patientAccount = pa; }

    public Doctor getDoctor()                           { return doctor; }
    public void setDoctor(Doctor d)                     { this.doctor = d; }

    public Hospital getHospital()                       { return hospital; }
    public void setHospital(Hospital h)                 { this.hospital = h; }

    public LocalDateTime getVisitDate()                 { return visitDate; }
    public void setVisitDate(LocalDateTime d)           { this.visitDate = d; }

    public VisitType getVisitType()                     { return visitType; }
    public void setVisitType(VisitType t)               { this.visitType = t; }

    public String getDiagnosis()                        { return diagnosis; }
    public void setDiagnosis(String diagnosis)          { this.diagnosis = diagnosis; }

    public String getNotes()                            { return notes; }
    public void setNotes(String notes)                  { this.notes = notes; }

    public String getAttachmentUrl()                    { return attachmentUrl; }
    public void setAttachmentUrl(String url)            { this.attachmentUrl = url; }
}
