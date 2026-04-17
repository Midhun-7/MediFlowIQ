package com.mediflowiq.config;

import com.mediflowiq.model.AppUser;
import com.mediflowiq.model.Role;
import com.mediflowiq.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds default users on application startup when no users exist.
 *
 * Default credentials (for development):
 *   admin   / Admin@123   → ADMIN
 *   drsmith / Doctor@123  → DOCTOR
 *   nurse1  / Staff@123   → STAFF
 *
 * Change these in production!
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("[Init] Users already exist — skipping seed");
            return;
        }

        userRepository.save(new AppUser(
                "admin",
                passwordEncoder.encode("Admin@123"),
                "System Administrator",
                Role.ADMIN));

        userRepository.save(new AppUser(
                "drsmith",
                passwordEncoder.encode("Doctor@123"),
                "Dr. Sarah Smith",
                Role.DOCTOR));

        userRepository.save(new AppUser(
                "nurse1",
                passwordEncoder.encode("Staff@123"),
                "Nurse Priya R.",
                Role.STAFF));

        log.info("[Init] ✅ Seeded 3 default users (admin, drsmith, nurse1)");
    }
}
