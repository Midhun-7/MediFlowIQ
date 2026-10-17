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

    @Query("SELECT a FROM Appointment a WHERE a.patientAccount.id = :patientId ORDER BY a.scheduledAt DESC")
    List<Appointment> findByPatientAccountIdOrderByScheduledAtDesc(@Param("patientId") Long patientId);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.status = :status")
    List<Appointment> findByDoctorIdAndStatus(@Param("doctorId") Long doctorId, @Param("status") Appointment.Status status);

    Optional<Appointment> findByRazorpayOrderId(String orderId);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.status = :status")
    long countByDoctorIdAndStatus(@Param("doctorId") Long doctorId, @Param("status") Appointment.Status status);

    /** All appointments for a given doctor, ordered by scheduled time */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.doctor d " +
           "LEFT JOIN FETCH a.patientAccount pa " +
           "LEFT JOIN FETCH a.hospital h " +
           "WHERE a.doctor.id = :doctorId " +
           "ORDER BY a.scheduledAt ASC")
    List<Appointment> findByDoctorIdOrderByScheduledAtAsc(@Param("doctorId") Long doctorId);

    /** Appointments for a doctor within a date range (used for today's filter) */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.doctor d " +
           "LEFT JOIN FETCH a.patientAccount pa " +
           "LEFT JOIN FETCH a.hospital h " +
           "WHERE a.doctor.id = :doctorId " +
           "AND a.scheduledAt >= :startOfDay " +
           "AND a.scheduledAt < :endOfDay " +
           "ORDER BY a.scheduledAt ASC")
    List<Appointment> findTodayByDoctorId(
            @Param("doctorId") Long doctorId,
            @Param("startOfDay") java.time.LocalDateTime startOfDay,
            @Param("endOfDay") java.time.LocalDateTime endOfDay);

    /** Appointments across all doctors for today */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.doctor d " +
           "LEFT JOIN FETCH a.patientAccount pa " +
           "LEFT JOIN FETCH a.hospital h " +
           "WHERE a.scheduledAt >= :startOfDay " +
           "AND a.scheduledAt < :endOfDay " +
           "ORDER BY a.scheduledAt ASC")
    List<Appointment> findAllTodayWithDetails(
            @Param("startOfDay") java.time.LocalDateTime startOfDay,
            @Param("endOfDay") java.time.LocalDateTime endOfDay);

    /** All appointments across all doctors, ordered by scheduled time */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.doctor d " +
           "LEFT JOIN FETCH a.patientAccount pa " +
           "LEFT JOIN FETCH a.hospital h " +
           "ORDER BY a.scheduledAt ASC")
    List<Appointment> findAllWithDetails();
}

