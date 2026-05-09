package com.mediflowiq.service;

import com.mediflowiq.dto.CreatePrescriptionRequest;
import com.mediflowiq.model.*;
import com.mediflowiq.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Phase 6 — Doctor prescription writing service.
 * Also handles doctor discovery + queue position queries.
 */
@Service
public class DoctorService {

    @Autowired private DoctorRepository doctorRepo;
    @Autowired private PatientAccountRepository patientRepo;
    @Autowired private HospitalRepository hospitalRepo;
    @Autowired private PrescriptionRepository prescriptionRepo;
    @Autowired private AppointmentRepository appointmentRepo;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    public List<Doctor> searchDoctors(String specialty, String city) {
        return doctorRepo.findAll().stream()
                .filter(d -> specialty == null || specialty.isBlank() ||
                             d.getSpecialty() != null &&
                             d.getSpecialty().toLowerCase().contains(specialty.toLowerCase()))
                .filter(d -> city == null || city.isBlank() ||
                             d.getHospital() != null &&
                             d.getHospital().getCity() != null &&
                             d.getHospital().getCity().toLowerCase().contains(city.toLowerCase()))
                .toList();
    }

    public Doctor getDoctor(Long doctorId) {
        return doctorRepo.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));
    }

    /** Current confirmed queue count for a doctor */
    public long getQueueCount(Long doctorId) {
        return appointmentRepo.countByDoctorIdAndStatus(doctorId, Appointment.Status.CONFIRMED);
    }

    @Transactional
    public Prescription writePrescription(Long doctorId, CreatePrescriptionRequest req) {
        Doctor doctor = getDoctor(doctorId);
        PatientAccount patient = patientRepo.findById(req.getPatientAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        Hospital hospital = hospitalRepo.findById(req.getHospitalId())
                .orElseThrow(() -> new IllegalArgumentException("Hospital not found"));

        Prescription prescription = new Prescription();
        prescription.setDoctor(doctor);
        prescription.setPatientAccount(patient);
        prescription.setHospital(hospital);
        prescription.setPrescribedDate(LocalDate.now());
        prescription.setStatus(Prescription.Status.ACTIVE);
        if (req.getValidUntil() != null) {
            prescription.setValidUntil(LocalDate.parse(req.getValidUntil()));
        }
        prescription.setSpecialInstructions(req.getSpecialInstructions());

        Prescription saved = prescriptionRepo.save(prescription);

        // Add medication items
        if (req.getMedications() != null) {
            req.getMedications().forEach(med -> {
                PrescriptionItem item = new PrescriptionItem(
                        saved,
                        med.getMedicationName(),
                        med.getDosage(),
                        med.getFrequency(),
                        med.getDurationDays(),
                        med.getInstructions()
                );
                saved.getMedications().add(item);
            });
            prescriptionRepo.save(saved);
        }

        // Notify patient via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/patient/" + patient.getId(),
                Map.of("type", "PRESCRIPTION_ADDED",
                       "message", "Dr. " + doctor.getName() + " added a new prescription for you.",
                       "prescriptionId", saved.getId())
        );

        return saved;
    }

    public List<PatientAccount> getAllPatients() {
        // Doctors can search patients to write prescriptions
        return patientRepo.findAll();
    }
}
