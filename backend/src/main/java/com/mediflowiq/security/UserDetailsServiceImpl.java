package com.mediflowiq.security;

import com.mediflowiq.model.AppUser;
import com.mediflowiq.model.PatientAccount;
import com.mediflowiq.repository.PatientAccountRepository;
import com.mediflowiq.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Loads AppUser or PatientAccount from the database and wraps it as a Spring UserDetails object.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientAccountRepository patientAccountRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (username != null && username.startsWith("patient:")) {
            try {
                Long patientId = Long.parseLong(username.substring("patient:".length()));
                PatientAccount patient = patientAccountRepository.findById(patientId)
                        .orElseThrow(() -> new UsernameNotFoundException("Patient account not found: " + patientId));

                return User.builder()
                        .username(username)
                        .password(patient.getPassword())
                        .disabled(!patient.isEnabled())
                        .accountExpired(false)
                        .credentialsExpired(false)
                        .accountLocked(false)
                        .authorities(List.of(new SimpleGrantedAuthority("ROLE_PATIENT")))
                        .build();
            } catch (NumberFormatException e) {
                throw new UsernameNotFoundException("Invalid patient token subject: " + username);
            }
        }

        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .disabled(!user.isEnabled())
                .accountExpired(false)
                .credentialsExpired(false)
                .accountLocked(false)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .build();
    }
}
