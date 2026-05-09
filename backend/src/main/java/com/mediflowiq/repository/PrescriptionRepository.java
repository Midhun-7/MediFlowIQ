package com.mediflowiq.repository;

import com.mediflowiq.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientAccountIdOrderByPrescribedDateDesc(Long patientAccountId);
    List<Prescription> findByPatientAccountIdAndStatus(Long patientAccountId, Prescription.Status status);
}
