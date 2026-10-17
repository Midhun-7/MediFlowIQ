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
import java.util.Optional;

/**
 * Phase 6 — Doctor prescription writing service.
 * Also handles doctor discovery + queue position queries.
 */
@Service
public class DoctorService {

    @Autowired private DoctorRepository doctorRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private PatientAccountRepository patientRepo;
    @Autowired private HospitalRepository hospitalRepo;
    @Autowired private PrescriptionRepository prescriptionRepo;
    @Autowired private AppointmentRepository appointmentRepo;
    @Autowired @org.springframework.context.annotation.Lazy private AppointmentService appointmentService;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    /**
     * Resolves the Doctor entity associated with the authenticated UserDetails.
     * Looks up by app_user_id, then by username matching, or falls back to provided doctorId.
     */
    @Transactional
    public Long resolveDoctorId(String username, Long explicitDoctorId) {
        if (explicitDoctorId != null) {
            return explicitDoctorId;
        }
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }

        // 1. Direct AppUser lookup
        Optional<AppUser> userOpt = userRepo.findByUsername(username);
        if (userOpt.isPresent()) {
            AppUser user = userOpt.get();
            Optional<Doctor> doc = doctorRepo.findByAppUserId(user.getId());
            if (doc.isPresent()) {
                return doc.get().getId();
            }
        }

        // 2. Direct lookup via AppUser username query
        Optional<Doctor> byUsername = doctorRepo.findByAppUserUsername(username);
        if (byUsername.isPresent()) {
            return byUsername.get().getId();
        }

        // 3. Fallback: match doctor name or username substring (e.g. drsmith -> Sarah Smith, drkumar -> Rajesh Kumar)
        String clean = username.toLowerCase().replace("dr", "").replace(".", "").trim();
        List<Doctor> allDoctors = doctorRepo.findAll();
        for (Doctor d : allDoctors) {
            String docName = d.getName().toLowerCase();
            if (!clean.isEmpty() && (docName.contains(clean) || clean.contains(docName))) {
                if (userOpt.isPresent() && d.getAppUser() == null) {
                    d.setAppUser(userOpt.get());
                    doctorRepo.save(d);
                }
                return d.getId();
            }
        }

        // 4. Default to first doctor if available
        if (!allDoctors.isEmpty()) {
            return allDoctors.get(0).getId();
        }

        throw new IllegalArgumentException("No doctor profile found for account: " + username);
    }

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
        if (req.getValidUntil() != null && !req.getValidUntil().isBlank()) {
            prescription.setValidUntil(LocalDate.parse(req.getValidUntil().trim()));
        } else {
            prescription.setValidUntil(LocalDate.now().plusDays(30));
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

        // If this prescription is linked to an appointment, automatically complete it
        if (req.getAppointmentId() != null) {
            try {
                appointmentService.completeAppointment(req.getAppointmentId());
            } catch (Exception e) {
                // Log and continue if already completed
            }
        }

        return saved;
    }

    public List<PatientAccount> getAllPatients() {
        // Doctors can search patients to write prescriptions
        return patientRepo.findAll();
    }
}
