package com.mediflowiq.repository;

import com.mediflowiq.model.Patient;
import com.mediflowiq.model.PatientStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    List<Patient> findByStatus(PatientStatus status);
    long countByStatus(PatientStatus status);
}
