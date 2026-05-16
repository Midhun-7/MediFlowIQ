package com.mediflowiq.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

/**
 * Phase 6 — Doctor profile with credentials and statistics visible to patients.
 */
@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 100)
    private String specialty;

    /** e.g. "MBBS, MD (Cardiology), FRCP" */
    @Column(length = 300)
    private String qualifications;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    /** In Indian Rupees (INR) */
    @Column(name = "consultation_fee")
    private Integer consultationFee;

    @Column(name = "total_patients_diagnosed")
    private Integer totalPatientsDiagnosed = 0;

    /** Applicable only when isSurgeon = true. Stored as percentage (e.g. 98.5) */
    @Column(name = "surgery_success_rate")
    private Double surgerySuccessRate;

    @Column(name = "is_surgeon")
    private boolean surgeon = false;

    @Column(name = "avg_rating")
    private Double avgRating = 0.0;

    @Column(name = "total_reviews")
    private Integer totalReviews = 0;

    @Column(length = 500)
    private String bio;

    @Column(name = "avatar_url")
    private String avatarUrl;

    /**
     * National Medical Commission Unique Identification Number.
     * Used to verify doctor identity at login — prevents unauthorized access.
     * Format: 7-digit number issued by NMC India.
     */
    @Column(name = "nmc_uid", length = 20, unique = true)
    private String nmcUid;

    @Column(name = "available_from", length = 10)
    private String availableFrom; // e.g. "09:00"

    @Column(name = "available_to", length = 10)
    private String availableTo;   // e.g. "17:00"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Hospital hospital;

    /** Link to the AppUser so this doctor can log in */
    @JsonIgnore   // never expose login credentials or Hibernate proxy to the patient API
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_user_id", unique = true)
    private AppUser appUser;

    public Doctor() {}

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public Long getId()                             { return id; }
    public void setId(Long id)                      { this.id = id; }

    public String getName()                         { return name; }
    public void setName(String name)                { this.name = name; }

    public String getSpecialty()                    { return specialty; }
    public void setSpecialty(String specialty)      { this.specialty = specialty; }

    public String getQualifications()               { return qualifications; }
    public void setQualifications(String q)         { this.qualifications = q; }

    public Integer getYearsOfExperience()           { return yearsOfExperience; }
    public void setYearsOfExperience(Integer y)     { this.yearsOfExperience = y; }

    public Integer getConsultationFee()             { return consultationFee; }
    public void setConsultationFee(Integer fee)     { this.consultationFee = fee; }

    public Integer getTotalPatientsDiagnosed()      { return totalPatientsDiagnosed; }
    public void setTotalPatientsDiagnosed(Integer t){ this.totalPatientsDiagnosed = t; }

    public Double getSurgerySuccessRate()           { return surgerySuccessRate; }
    public void setSurgerySuccessRate(Double r)     { this.surgerySuccessRate = r; }

    public boolean isSurgeon()                      { return surgeon; }
    public void setSurgeon(boolean surgeon)         { this.surgeon = surgeon; }

    public Double getAvgRating()                    { return avgRating; }
    public void setAvgRating(Double avgRating)      { this.avgRating = avgRating; }

    public Integer getTotalReviews()                { return totalReviews; }
    public void setTotalReviews(Integer totalReviews){ this.totalReviews = totalReviews; }

    public String getBio()                          { return bio; }
    public void setBio(String bio)                  { this.bio = bio; }

    public String getAvatarUrl()                    { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl)      { this.avatarUrl = avatarUrl; }

    public String getNmcUid()                       { return nmcUid; }
    public void setNmcUid(String nmcUid)            { this.nmcUid = nmcUid; }

    public String getAvailableFrom()                { return availableFrom; }
    public void setAvailableFrom(String t)          { this.availableFrom = t; }

    public String getAvailableTo()                  { return availableTo; }
    public void setAvailableTo(String t)            { this.availableTo = t; }

    public Hospital getHospital()                   { return hospital; }
    public void setHospital(Hospital hospital)      { this.hospital = hospital; }

    public AppUser getAppUser()                     { return appUser; }
    public void setAppUser(AppUser appUser)         { this.appUser = appUser; }
}
