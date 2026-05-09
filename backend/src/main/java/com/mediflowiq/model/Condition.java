package com.mediflowiq.model;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * Phase 6 — A current or chronic medical condition linked to a patient.
 */
@Entity
@Table(name = "conditions")
public class Condition {

    public enum Severity { STABLE, MONITORING, CRITICAL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_account_id", nullable = false)
    private PatientAccount patientAccount;

    @Column(name = "condition_name", nullable = false, length = 200)
    private String conditionName;

    /** International Classification of Diseases code, e.g. "E11" */
    @Column(name = "icd_code", length = 20)
    private String icdCode;

    @Column(name = "diagnosed_date")
    private LocalDate diagnosedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Severity severity = Severity.STABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "treating_doctor_id")
    private Doctor treatingDoctor;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(length = 500)
    private String notes;

    public Condition() {}

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public Long getId()                                 { return id; }
    public void setId(Long id)                          { this.id = id; }

    public PatientAccount getPatientAccount()           { return patientAccount; }
    public void setPatientAccount(PatientAccount pa)    { this.patientAccount = pa; }

    public String getConditionName()                    { return conditionName; }
    public void setConditionName(String name)           { this.conditionName = name; }

    public String getIcdCode()                          { return icdCode; }
    public void setIcdCode(String code)                 { this.icdCode = code; }

    public LocalDate getDiagnosedDate()                 { return diagnosedDate; }
    public void setDiagnosedDate(LocalDate d)           { this.diagnosedDate = d; }

    public Severity getSeverity()                       { return severity; }
    public void setSeverity(Severity severity)          { this.severity = severity; }

    public Doctor getTreatingDoctor()                   { return treatingDoctor; }
    public void setTreatingDoctor(Doctor d)             { this.treatingDoctor = d; }

    public boolean isActive()                           { return active; }
    public void setActive(boolean active)               { this.active = active; }

    public String getNotes()                            { return notes; }
    public void setNotes(String notes)                  { this.notes = notes; }
}
