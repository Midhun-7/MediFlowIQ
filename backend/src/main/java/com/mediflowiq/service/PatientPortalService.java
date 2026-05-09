package com.mediflowiq.service;

import com.mediflowiq.model.*;
import com.mediflowiq.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Phase 6 — Patient portal data service.
 * Provides medical history, conditions, and prescriptions for a patient.
 */
@Service
public class PatientPortalService {

    @Autowired private PatientAccountRepository patientRepo;
    @Autowired private MedicalRecordRepository medicalRecordRepo;
    @Autowired private ConditionRepository conditionRepo;
    @Autowired private PrescriptionRepository prescriptionRepo;
    @Autowired private AppointmentRepository appointmentRepo;

    public PatientAccount getPatient(Long patientId) {
        return patientRepo.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
    }

    public Map<String, Object> getDashboard(Long patientId) {
        PatientAccount patient = getPatient(patientId);
        List<Condition> activeConditions = conditionRepo.findByPatientAccountIdAndActiveTrue(patientId);
        List<Prescription> activePrescriptions = prescriptionRepo
                .findByPatientAccountIdAndStatus(patientId, Prescription.Status.ACTIVE);
        List<Appointment> upcomingAppointments = appointmentRepo
                .findByPatientAccountIdOrderByScheduledAtDesc(patientId)
                .stream()
                .filter(a -> a.getStatus() == Appointment.Status.CONFIRMED)
                .limit(3)
                .toList();
        List<MedicalRecord> recentHistory = medicalRecordRepo
                .findByPatientAccountIdOrderByVisitDateDesc(patientId)
                .stream().limit(5).toList();

        return Map.of(
                "patient",              patient,
                "activeConditions",     activeConditions,
                "activeMedications",    activePrescriptions.stream()
                        .mapToLong(p -> p.getMedications().size()).sum(),
                "upcomingAppointments", upcomingAppointments,
                "recentHistory",        recentHistory
        );
    }

    public List<MedicalRecord> getMedicalHistory(Long patientId) {
        return medicalRecordRepo.findByPatientAccountIdOrderByVisitDateDesc(patientId);
    }

    public List<Condition> getConditions(Long patientId) {
        return conditionRepo.findByPatientAccountIdAndActiveTrue(patientId);
    }

    public List<Prescription> getPrescriptions(Long patientId) {
        return prescriptionRepo.findByPatientAccountIdOrderByPrescribedDateDesc(patientId);
    }

    public List<Appointment> getMyAppointments(Long patientId) {
        return appointmentRepo.findByPatientAccountIdOrderByScheduledAtDesc(patientId);
    }
}
