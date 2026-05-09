package com.mediflowiq.repository;

import com.mediflowiq.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientAccountIdOrderByScheduledAtDesc(Long patientAccountId);
    List<Appointment> findByDoctorIdAndStatus(Long doctorId, Appointment.Status status);
    Optional<Appointment> findByRazorpayOrderId(String orderId);
    long countByDoctorIdAndStatus(Long doctorId, Appointment.Status status);
}
