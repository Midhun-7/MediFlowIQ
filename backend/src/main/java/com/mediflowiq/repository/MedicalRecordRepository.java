package com.mediflowiq.repository;

import com.mediflowiq.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    List<MedicalRecord> findByPatientAccountIdOrderByVisitDateDesc(Long patientAccountId);
}
