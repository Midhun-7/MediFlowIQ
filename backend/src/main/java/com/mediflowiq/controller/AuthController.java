package com.mediflowiq.controller;

import com.mediflowiq.dto.AuthResponse;
import com.mediflowiq.dto.LoginRequest;
import com.mediflowiq.dto.RegisterUserRequest;
import com.mediflowiq.model.AppUser;
import com.mediflowiq.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Public + admin authentication endpoints.
 *
 * POST /api/auth/login         — public, returns JWT pair
 * POST /api/auth/register      — ADMIN only, creates a new user
 * POST /api/auth/refresh        — public (valid refresh token required)
 * GET  /api/auth/me             — any authenticated user — returns profile
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    // ── Login ──────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest http) {

        AuthResponse response = authService.login(request, http.getRemoteAddr());
        return ResponseEntity.ok(response);
    }

    // ── Register (admin only) ──────────────────────────────────────────────

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterUserRequest request,
            @AuthenticationPrincipal UserDetails actor,
            HttpServletRequest http) {

        AppUser created = authService.register(request, actor.getUsername(), http.getRemoteAddr());
        return ResponseEntity.ok(Map.of(
                "message", "User created successfully",
                "username", created.getUsername(),
                "role", created.getRole().name()));
    }

    // ── Refresh ────────────────────────────────────────────────────────────

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestBody Map<String, String> body,
            HttpServletRequest http) {

        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(authService.refresh(refreshToken, http.getRemoteAddr()));
    }

    // ── Me ─────────────────────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of(
                "username",    userDetails.getUsername(),
                "authorities", userDetails.getAuthorities()));
    }
}
