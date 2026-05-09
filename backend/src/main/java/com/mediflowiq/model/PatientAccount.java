package com.mediflowiq.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Phase 6 — Patient Portal.
 * A login-able patient account. Separate from the queue {@link Patient} record
 * so existing queue functionality is not affected.
 */
@Entity
@Table(name = "patient_accounts",
       uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class PatientAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password; // BCrypt hash

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(length = 20)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.PATIENT;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    public PatientAccount() {}

    public PatientAccount(String email, String password, String fullName,
                          String phone, LocalDate dateOfBirth, String bloodGroup) {
        this.email       = email;
        this.password    = password;
        this.fullName    = fullName;
        this.phone       = phone;
        this.dateOfBirth = dateOfBirth;
        this.bloodGroup  = bloodGroup;
        this.role        = Role.PATIENT;
        this.enabled     = true;
        this.createdAt   = LocalDateTime.now();
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public Long getId()                         { return id; }
    public void setId(Long id)                  { this.id = id; }

    public String getEmail()                    { return email; }
    public void setEmail(String email)          { this.email = email; }

    public String getPassword()                 { return password; }
    public void setPassword(String password)    { this.password = password; }

    public String getFullName()                 { return fullName; }
    public void setFullName(String fullName)    { this.fullName = fullName; }

    public String getPhone()                    { return phone; }
    public void setPhone(String phone)          { this.phone = phone; }

    public LocalDate getDateOfBirth()                       { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth)       { this.dateOfBirth = dateOfBirth; }

    public String getBloodGroup()               { return bloodGroup; }
    public void setBloodGroup(String bg)        { this.bloodGroup = bg; }

    public Role getRole()                       { return role; }
    public void setRole(Role role)              { this.role = role; }

    public boolean isEnabled()                  { return enabled; }
    public void setEnabled(boolean enabled)     { this.enabled = enabled; }

    public LocalDateTime getCreatedAt()         { return createdAt; }
    public void setCreatedAt(LocalDateTime d)   { this.createdAt = d; }

    public LocalDateTime getLastLogin()         { return lastLogin; }
    public void setLastLogin(LocalDateTime d)   { this.lastLogin = d; }
}
