package com.mediflowiq.controller;

import com.mediflowiq.model.AppUser;
import com.mediflowiq.model.AuditLog;
import com.mediflowiq.repository.AuditLogRepository;
import com.mediflowiq.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin-only management endpoints.
 *
 * GET  /api/admin/users          — list all users
 * PATCH /api/admin/users/{id}/enable  — enable/disable a user
 * GET  /api/admin/audit-logs     — last 50 audit log entries
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // ── Users ──────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<?>> listUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(u -> Map.<String, Object>of(
                        "id",        u.getId(),
                        "username",  u.getUsername(),
                        "fullName",  u.getFullName(),
                        "role",      u.getRole().name(),
                        "enabled",   u.isEnabled(),
                        "createdAt", u.getCreatedAt().toString(),
                        "lastLogin", u.getLastLogin() != null ? u.getLastLogin().toString() : "Never"))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/users/{id}/enable")
    public ResponseEntity<?> toggleUser(@PathVariable Long id,
                                        @RequestBody Map<String, Boolean> body) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setEnabled(body.getOrDefault("enabled", true));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("username", user.getUsername(), "enabled", user.isEnabled()));
    }

    @PatchMapping("/users/{id}/password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        String newPw = body.get("password");
        if (newPw == null || newPw.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setPassword(passwordEncoder.encode(newPw));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password updated for " + user.getUsername()));
    }

    // ── Audit Logs ─────────────────────────────────────────────────────────

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> auditLogs() {
        return ResponseEntity.ok(auditLogRepository.findTop50ByOrderByPerformedAtDesc());
    }
}
