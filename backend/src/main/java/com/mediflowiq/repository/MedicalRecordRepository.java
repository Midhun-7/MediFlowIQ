package com.mediflowiq.repository;

import com.mediflowiq.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    @Query("SELECT r FROM MedicalRecord r " +
           "LEFT JOIN FETCH r.doctor " +
           "LEFT JOIN FETCH r.hospital " +
           "WHERE r.patientAccount.id = :patientId " +
           "ORDER BY r.visitDate DESC")
    List<MedicalRecord> findByPatientAccountIdWithDetails(@Param("patientId") Long patientId);

    // Keep original for backward compatibility
    List<MedicalRecord> findByPatientAccountIdOrderByVisitDateDesc(Long patientAccountId);
}

