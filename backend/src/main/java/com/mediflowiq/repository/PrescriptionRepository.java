package com.mediflowiq.repository;

import com.mediflowiq.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    @Query("SELECT p FROM Prescription p " +
           "LEFT JOIN FETCH p.doctor " +
           "LEFT JOIN FETCH p.hospital " +
           "LEFT JOIN FETCH p.medications " +
           "WHERE p.patientAccount.id = :patientId " +
           "ORDER BY p.prescribedDate DESC")
    List<Prescription> findByPatientAccountIdWithDetails(@Param("patientId") Long patientId);

    @Query("SELECT p FROM Prescription p " +
           "LEFT JOIN FETCH p.doctor " +
           "LEFT JOIN FETCH p.hospital " +
           "WHERE p.patientAccount.id = :patientId AND p.status = :status")
    List<Prescription> findByPatientAccountIdAndStatusWithDetails(
            @Param("patientId") Long patientId,
            @Param("status") Prescription.Status status);

    // Keep originals for any internal use
    List<Prescription> findByPatientAccountIdOrderByPrescribedDateDesc(Long patientAccountId);
    List<Prescription> findByPatientAccountIdAndStatus(Long patientAccountId, Prescription.Status status);
}

