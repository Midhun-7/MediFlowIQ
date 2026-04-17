package com.mediflowiq.service;

import com.mediflowiq.dto.AuthResponse;
import com.mediflowiq.dto.LoginRequest;
import com.mediflowiq.dto.RegisterUserRequest;
import com.mediflowiq.model.AppUser;
import com.mediflowiq.model.AuditLog;
import com.mediflowiq.model.Role;
import com.mediflowiq.repository.AuditLogRepository;
import com.mediflowiq.repository.UserRepository;
import com.mediflowiq.security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Autowired private AuthenticationManager authManager;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuditLogRepository auditLogRepository;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    // ── Login ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(auth);

        // Update last login
        AppUser user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String accessToken  = jwtUtils.generateToken(auth);
        String refreshToken = jwtUtils.generateRefreshToken(request.getUsername());

        auditLogRepository.save(new AuditLog(
                request.getUsername(), "USER_LOGIN", "Login successful", ipAddress));

        log.info("[Auth] {} logged in from {}", request.getUsername(), ipAddress);

        return new AuthResponse(
                accessToken, refreshToken,
                user.getUsername(), user.getFullName(),
                user.getRole().name(),
                expirationMs / 1000);
    }

    // ── Register (admin only) ──────────────────────────────────────────────

    @Transactional
    public AppUser register(RegisterUserRequest request, String actorUsername, String ipAddress) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken: " + request.getUsername());
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + request.getRole());
        }

        AppUser user = new AppUser(
                request.getUsername(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(),
                role);

        userRepository.save(user);

        auditLogRepository.save(new AuditLog(
                actorUsername, "USER_REGISTERED",
                "Created user " + request.getUsername() + " with role " + role,
                ipAddress));

        log.info("[Auth] User '{}' registered by admin '{}'", request.getUsername(), actorUsername);
        return user;
    }

    // ── Token Refresh ──────────────────────────────────────────────────────

    public AuthResponse refresh(String refreshToken, String ipAddress) {
        if (!jwtUtils.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }
        String username = jwtUtils.getUsernameFromToken(refreshToken);
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String newAccess  = jwtUtils.generateTokenFromUsername(username);
        String newRefresh = jwtUtils.generateRefreshToken(username);

        log.debug("[Auth] Token refreshed for {}", username);

        return new AuthResponse(
                newAccess, newRefresh,
                user.getUsername(), user.getFullName(),
                user.getRole().name(),
                expirationMs / 1000);
    }
}
