package com.mediflowiq.controller;

import com.mediflowiq.dto.PatientLoginRequest;
import com.mediflowiq.dto.PatientRegisterRequest;
import com.mediflowiq.model.PatientAccount;
import com.mediflowiq.service.PatientAuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Phase 6 — Patient self-service authentication.
 * POST /api/patient/auth/register
 * POST /api/patient/auth/login
 */
@RestController
@RequestMapping("/api/patient/auth")
public class PatientAuthController {

    @Autowired private PatientAuthService patientAuthService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody PatientRegisterRequest req) {
        PatientAccount account = patientAuthService.register(req);
        return ResponseEntity.ok(Map.of(
                "message",   "Registration successful",
                "patientId", account.getId(),
                "email",     account.getEmail()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody PatientLoginRequest req) {
        Map<String, Object> response = patientAuthService.login(req);
        return ResponseEntity.ok(response);
    }
}
