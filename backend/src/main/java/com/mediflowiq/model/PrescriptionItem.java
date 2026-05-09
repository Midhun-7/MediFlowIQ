package com.mediflowiq.model;

import jakarta.persistence.*;

/**
 * Phase 6 — A single medication entry within a {@link Prescription}.
 */
@Entity
@Table(name = "prescription_items")
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(name = "medication_name", nullable = false, length = 200)
    private String medicationName;

    @Column(length = 100)
    private String dosage; // e.g. "500mg"

    @Column(length = 100)
    private String frequency; // e.g. "Twice daily"

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(length = 300)
    private String instructions; // e.g. "Take after meals"

    public PrescriptionItem() {}

    public PrescriptionItem(Prescription prescription, String medicationName,
                             String dosage, String frequency, Integer durationDays,
                             String instructions) {
        this.prescription    = prescription;
        this.medicationName  = medicationName;
        this.dosage          = dosage;
        this.frequency       = frequency;
        this.durationDays    = durationDays;
        this.instructions    = instructions;
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public Long getId()                                 { return id; }
    public void setId(Long id)                          { this.id = id; }

    public Prescription getPrescription()               { return prescription; }
    public void setPrescription(Prescription p)         { this.prescription = p; }

    public String getMedicationName()                   { return medicationName; }
    public void setMedicationName(String name)          { this.medicationName = name; }

    public String getDosage()                           { return dosage; }
    public void setDosage(String dosage)                { this.dosage = dosage; }

    public String getFrequency()                        { return frequency; }
    public void setFrequency(String frequency)          { this.frequency = frequency; }

    public Integer getDurationDays()                    { return durationDays; }
    public void setDurationDays(Integer d)              { this.durationDays = d; }

    public String getInstructions()                     { return instructions; }
    public void setInstructions(String instructions)    { this.instructions = instructions; }
}
