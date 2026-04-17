package com.mediflowiq.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_users",
       uniqueConstraints = { @UniqueConstraint(columnNames = "username") })
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;   // BCrypt hash

    @Column(nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    public AppUser() {}

    public AppUser(String username, String password, String fullName, Role role) {
        this.username  = username;
        this.password  = password;
        this.fullName  = fullName;
        this.role      = role;
        this.enabled   = true;
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters / Setters ──────────────────────────────────────────────────

    public Long getId()                     { return id; }
    public void setId(Long id)              { this.id = id; }

    public String getUsername()             { return username; }
    public void setUsername(String u)       { this.username = u; }

    public String getPassword()             { return password; }
    public void setPassword(String p)       { this.password = p; }

    public String getFullName()             { return fullName; }
    public void setFullName(String fn)      { this.fullName = fn; }

    public Role getRole()                   { return role; }
    public void setRole(Role r)             { this.role = r; }

    public boolean isEnabled()              { return enabled; }
    public void setEnabled(boolean e)       { this.enabled = e; }

    public LocalDateTime getCreatedAt()     { return createdAt; }
    public void setCreatedAt(LocalDateTime d) { this.createdAt = d; }

    public LocalDateTime getLastLogin()     { return lastLogin; }
    public void setLastLogin(LocalDateTime d) { this.lastLogin = d; }
}
