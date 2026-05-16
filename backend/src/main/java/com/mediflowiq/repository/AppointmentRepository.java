package com.mediflowiq.repository;

import com.mediflowiq.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /** Eagerly fetch doctor + hospital to avoid lazy-proxy serialization issues */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.doctor d " +
           "LEFT JOIN FETCH a.hospital h " +
           "WHERE a.patientAccount.id = :patientId " +
           "ORDER BY a.scheduledAt DESC")
    List<Appointment> findByPatientAccountIdWithDetails(@Param("patientId") Long patientId);

    List<Appointment> findByPatientAccountIdOrderByScheduledAtDesc(Long patientAccountId);
    List<Appointment> findByDoctorIdAndStatus(Long doctorId, Appointment.Status status);
    Optional<Appointment> findByRazorpayOrderId(String orderId);
    long countByDoctorIdAndStatus(Long doctorId, Appointment.Status status);
}

