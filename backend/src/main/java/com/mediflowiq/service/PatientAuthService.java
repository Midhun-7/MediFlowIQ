package com.mediflowiq.service;

import com.mediflowiq.dto.PatientLoginRequest;
import com.mediflowiq.dto.PatientRegisterRequest;
import com.mediflowiq.model.PatientAccount;
import com.mediflowiq.repository.PatientAccountRepository;
import com.mediflowiq.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;

/**
 * Phase 6 — Patient authentication: register + login returning JWT.
 * Patient accounts are separate from AppUser (staff) accounts.
 */
@Service
public class PatientAuthService {

    @Autowired private PatientAccountRepository patientRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtils jwtUtils;

    public PatientAccount register(PatientRegisterRequest req) {
        if (patientRepo.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        PatientAccount account = new PatientAccount(
                req.getEmail(),
                passwordEncoder.encode(req.getPassword()),
                req.getFullName(),
                req.getPhone(),
                req.getDateOfBirth() != null ? LocalDate.parse(req.getDateOfBirth()) : null,
                req.getBloodGroup()
        );
        return patientRepo.save(account);
    }

    /** Returns a Map with { token, patientId, fullName } */
    public Map<String, Object> login(PatientLoginRequest req) {
        PatientAccount account = patientRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!account.isEnabled()) {
            throw new IllegalArgumentException("Account is disabled");
        }
        if (!passwordEncoder.matches(req.getPassword(), account.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Reuse existing JwtUtils — subject is the patient email
        String token = jwtUtils.generateTokenFromUsername("patient:" + account.getId());
        return Map.of(
                "token",     token,
                "patientId", account.getId(),
                "fullName",  account.getFullName(),
                "email",     account.getEmail(),
                "role",      "PATIENT"
        );
    }
}
