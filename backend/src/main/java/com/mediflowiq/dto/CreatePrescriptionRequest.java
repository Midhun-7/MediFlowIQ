package com.mediflowiq.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/** DTO for a doctor to write a new prescription. */
public class CreatePrescriptionRequest {

    @NotNull
    private Long patientAccountId;

    @NotNull
    private Long hospitalId;

    private String validUntil; // ISO: "2026-09-14"

    private String specialInstructions;

    @NotNull
    private List<MedicationItem> medications;

    public static class MedicationItem {
        private String medicationName;
        private String dosage;
        private String frequency;
        private Integer durationDays;
        private String instructions;

        public String getMedicationName()           { return medicationName; }
        public void setMedicationName(String n)     { this.medicationName = n; }
        public String getDosage()                   { return dosage; }
        public void setDosage(String d)             { this.dosage = d; }
        public String getFrequency()                { return frequency; }
        public void setFrequency(String f)          { this.frequency = f; }
        public Integer getDurationDays()            { return durationDays; }
        public void setDurationDays(Integer d)      { this.durationDays = d; }
        public String getInstructions()             { return instructions; }
        public void setInstructions(String i)       { this.instructions = i; }
    }

    public Long getPatientAccountId()               { return patientAccountId; }
    public void setPatientAccountId(Long id)        { this.patientAccountId = id; }
    public Long getHospitalId()                     { return hospitalId; }
    public void setHospitalId(Long id)              { this.hospitalId = id; }
    public String getValidUntil()                   { return validUntil; }
    public void setValidUntil(String v)             { this.validUntil = v; }
    public String getSpecialInstructions()          { return specialInstructions; }
    public void setSpecialInstructions(String si)   { this.specialInstructions = si; }
    public List<MedicationItem> getMedications()    { return medications; }
    public void setMedications(List<MedicationItem> m){ this.medications = m; }
}
