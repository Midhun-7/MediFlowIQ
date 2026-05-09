package com.mediflowiq.repository;

import com.mediflowiq.model.PatientAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PatientAccountRepository extends JpaRepository<PatientAccount, Long> {
    Optional<PatientAccount> findByEmail(String email);
    boolean existsByEmail(String email);
}
