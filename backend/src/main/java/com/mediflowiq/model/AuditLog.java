package com.mediflowiq.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Audit log entry — records sensitive actions performed in the system.
 * Phase 4: Security & Roles
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String actor;    // username who performed the action

    @Column(nullable = false, length = 100)
    private String action;   // e.g. "PATIENT_STATUS_CHANGED", "USER_REGISTERED"

    @Column(length = 500)
    private String details;  // free-form context

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt = LocalDateTime.now();

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    public AuditLog() {}

    public AuditLog(String actor, String action, String details, String ipAddress) {
        this.actor       = actor;
        this.action      = action;
        this.details     = details;
        this.ipAddress   = ipAddress;
        this.performedAt = LocalDateTime.now();
    }

    public Long getId()               { return id; }
    public String getActor()          { return actor; }
    public void setActor(String a)    { this.actor = a; }
    public String getAction()         { return action; }
    public void setAction(String a)   { this.action = a; }
    public String getDetails()        { return details; }
    public void setDetails(String d)  { this.details = d; }
    public LocalDateTime getPerformedAt() { return performedAt; }
    public String getIpAddress()      { return ipAddress; }
    public void setIpAddress(String ip) { this.ipAddress = ip; }
}
