package com.mediflowiq.repository;

import com.mediflowiq.model.PatientAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PatientAccountRepository extends JpaRepository<PatientAccount, Long> {
    Optional<PatientAccount> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT p FROM PatientAccount p WHERE LOWER(p.email) = LOWER(:identifier) OR LOWER(p.email) LIKE LOWER(CONCAT(:identifier, '@%'))")
    List<PatientAccount> findByIdentifier(@Param("identifier") String identifier);
}
