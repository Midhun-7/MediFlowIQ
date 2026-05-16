package com.mediflowiq.config;

import com.mediflowiq.model.*;
import com.mediflowiq.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Seeds default data on application startup when no users exist.
 *
 * Staff accounts:
 *   admin   / Admin@123   → ADMIN
 *   drsmith / Doctor@123  → DOCTOR  (linked to Dr. Sarah Smith profile)
 *   drkumar / Doctor@123  → DOCTOR  (linked to Dr. Rajesh Kumar profile)
 *   drsurgeon / Doctor@123 → DOCTOR (linked to Dr. Priya Nair - surgeon profile)
 *   nurse1  / Staff@123   → STAFF
 *
 * Patient accounts:
 *   midhun@example.com  / Patient@123
 *   arjun@example.com   / Patient@123
 *   lakshmi@example.com / Patient@123
 *
 * Change all passwords in production!
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired private UserRepository           userRepository;
    @Autowired private PatientAccountRepository patientAccountRepository;
    @Autowired private HospitalRepository       hospitalRepository;
    @Autowired private DoctorRepository         doctorRepository;
    @Autowired private MedicalRecordRepository  medicalRecordRepository;
    @Autowired private ConditionRepository      conditionRepository;
    @Autowired private PrescriptionRepository   prescriptionRepository;
    @Autowired private AppointmentRepository    appointmentRepository;
    @Autowired private PasswordEncoder          passwordEncoder;

    @Override
    public void run(String... args) {
        boolean hasUsers     = userRepository.count() > 0;
        boolean hasHospitals = hospitalRepository.count() > 0;
        boolean hasDoctors   = doctorRepository.count() > 0;
        boolean hasPatients  = patientAccountRepository.count() > 0;

        if (hasUsers && hasHospitals && hasDoctors && hasPatients) {
            log.info("[Init] All seed data already present — skipping");
            return;
        }

        log.info("[Init] Partial or empty DB — seeding missing data (users={}, hospitals={}, doctors={}, patients={})",
                hasUsers, hasHospitals, hasDoctors, hasPatients);

        // ── Staff AppUsers ──────────────────────────────────────────────────
        AppUser admin, drSmithUser, drKumarUser, drSurgeonUser, drNeuroUser;

        if (!hasUsers) {
            admin = userRepository.save(new AppUser(
                    "admin", passwordEncoder.encode("Admin@123"), "System Administrator", Role.ADMIN));
            drSmithUser  = userRepository.save(new AppUser(
                    "drsmith",   passwordEncoder.encode("Doctor@123"), "Dr. Sarah Smith",  Role.DOCTOR));
            drKumarUser  = userRepository.save(new AppUser(
                    "drkumar",   passwordEncoder.encode("Doctor@123"), "Dr. Rajesh Kumar", Role.DOCTOR));
            drSurgeonUser = userRepository.save(new AppUser(
                    "drsurgeon", passwordEncoder.encode("Doctor@123"), "Dr. Priya Nair",   Role.DOCTOR));
            drNeuroUser  = userRepository.save(new AppUser(
                    "drneuro",   passwordEncoder.encode("Doctor@123"), "Dr. Arun Menon",   Role.DOCTOR));
            userRepository.save(new AppUser(
                    "nurse1", passwordEncoder.encode("Staff@123"), "Nurse Divya R.", Role.STAFF));
            log.info("[Init] ✅ Seeded staff users");
        } else {
            // Look up existing users so doctor profiles can reference them
            admin        = userRepository.findByUsername("admin").orElse(null);
            drSmithUser  = userRepository.findByUsername("drsmith").orElse(null);
            drKumarUser  = userRepository.findByUsername("drkumar").orElse(null);
            drSurgeonUser = userRepository.findByUsername("drsurgeon").orElse(null);
            drNeuroUser  = userRepository.findByUsername("drneuro").orElse(null);
            log.info("[Init] Staff users already exist — looked up existing accounts");
        }

        // ── Hospitals + Doctors ─────────────────────────────────────────────
        Hospital h1, h2, h3;
        Doctor drSmith, drKumar, drNair, drMenon;

        if (!hasHospitals) {
            h1 = hospitalRepository.save(new Hospital(
                    "City General Hospital", "Kochi",
                    "MG Road, Ernakulam, Kochi - 682011", 9.9312, 76.2673, 120, "+91-484-2351234"));
            h1.setCurrentLoad(45); h1 = hospitalRepository.save(h1);

            h2 = hospitalRepository.save(new Hospital(
                    "Apollo Speciality Hospital", "Thrissur",
                    "Koorkenchery, Thrissur - 680007", 10.5276, 76.2144, 80, "+91-487-2335555"));
            h2.setCurrentLoad(62); h2 = hospitalRepository.save(h2);

            h3 = hospitalRepository.save(new Hospital(
                    "KIMS Health", "Thiruvananthapuram",
                    "Anayara PO, Thiruvananthapuram - 695029", 8.5241, 76.9366, 200, "+91-471-2443333"));
            h3.setCurrentLoad(130); h3 = hospitalRepository.save(h3);
            log.info("[Init] ✅ Seeded 3 hospitals");
        } else {
            var hospitals = hospitalRepository.findAll();
            h1 = hospitals.stream().filter(h -> h.getName().contains("City General")).findFirst().orElse(hospitals.get(0));
            h2 = hospitals.stream().filter(h -> h.getName().contains("Apollo")).findFirst().orElse(hospitals.get(0));
            h3 = hospitals.stream().filter(h -> h.getName().contains("KIMS")).findFirst().orElse(hospitals.get(0));
            log.info("[Init] Hospitals already exist — looked up existing records");
        }

        if (!hasDoctors) {
            drSmith = new Doctor();
            drSmith.setName("Dr. Sarah Smith"); drSmith.setSpecialty("Cardiology");
            drSmith.setQualifications("MBBS, MD (Cardiology), FRCP"); drSmith.setYearsOfExperience(12);
            drSmith.setConsultationFee(800); drSmith.setTotalPatientsDiagnosed(3241);
            drSmith.setSurgeon(false); drSmith.setAvgRating(4.8); drSmith.setTotalReviews(542);
            drSmith.setBio("Senior Cardiologist with 12 years of experience in interventional cardiology.");
            drSmith.setAvailableFrom("09:00"); drSmith.setAvailableTo("17:00");
            drSmith.setHospital(h1); drSmith.setAppUser(drSmithUser); drSmith.setNmcUid("NMC1001234");
            drSmith = doctorRepository.save(drSmith);

            drKumar = new Doctor();
            drKumar.setName("Dr. Rajesh Kumar"); drKumar.setSpecialty("General Medicine");
            drKumar.setQualifications("MBBS, MD (Internal Medicine)"); drKumar.setYearsOfExperience(8);
            drKumar.setConsultationFee(500); drKumar.setTotalPatientsDiagnosed(5812);
            drKumar.setSurgeon(false); drKumar.setAvgRating(4.6); drKumar.setTotalReviews(1023);
            drKumar.setBio("Experienced general physician specializing in diabetes and hypertension management.");
            drKumar.setAvailableFrom("10:00"); drKumar.setAvailableTo("18:00");
            drKumar.setHospital(h1); drKumar.setAppUser(drKumarUser); drKumar.setNmcUid("NMC1005678");
            drKumar = doctorRepository.save(drKumar);

            drNair = new Doctor();
            drNair.setName("Dr. Priya Nair"); drNair.setSpecialty("Orthopaedic Surgery");
            drNair.setQualifications("MBBS, MS (Orthopaedics), FRCS"); drNair.setYearsOfExperience(15);
            drNair.setConsultationFee(1000); drNair.setTotalPatientsDiagnosed(2847);
            drNair.setSurgeon(true); drNair.setSurgerySuccessRate(98.2);
            drNair.setAvgRating(4.9); drNair.setTotalReviews(318);
            drNair.setBio("Leading orthopaedic surgeon specializing in joint replacement and sports injuries.");
            drNair.setAvailableFrom("08:00"); drNair.setAvailableTo("15:00");
            drNair.setHospital(h2); drNair.setAppUser(drSurgeonUser); drNair.setNmcUid("NMC2009012");
            drNair = doctorRepository.save(drNair);

            drMenon = new Doctor();
            drMenon.setName("Dr. Arun Menon"); drMenon.setSpecialty("Neurology");
            drMenon.setQualifications("MBBS, DM (Neurology), PhD"); drMenon.setYearsOfExperience(18);
            drMenon.setConsultationFee(1200); drMenon.setTotalPatientsDiagnosed(1956);
            drMenon.setSurgeon(true); drMenon.setSurgerySuccessRate(96.5);
            drMenon.setAvgRating(4.7); drMenon.setTotalReviews(204);
            drMenon.setBio("Neurologist and neurosurgeon with expertise in epilepsy and brain tumour management.");
            drMenon.setAvailableFrom("09:00"); drMenon.setAvailableTo("16:00");
            drMenon.setHospital(h3); drMenon.setAppUser(drNeuroUser); drMenon.setNmcUid("NMC3003456");
            drMenon = doctorRepository.save(drMenon);

            log.info("[Init] ✅ Seeded 4 doctor profiles");
        } else {
            var doctors = doctorRepository.findAll();
            drSmith = doctors.stream().filter(d -> d.getName().contains("Sarah")).findFirst().orElse(doctors.get(0));
            drKumar = doctors.stream().filter(d -> d.getName().contains("Rajesh")).findFirst().orElse(doctors.get(0));
            drNair  = doctors.stream().filter(d -> d.getName().contains("Priya")).findFirst().orElse(doctors.get(0));
            drMenon = doctors.stream().filter(d -> d.getName().contains("Arun")).findFirst().orElse(doctors.get(0));
            log.info("[Init] Doctors already exist — looked up existing records");
        }

        // ── Patient Accounts ────────────────────────────────────────────────
        PatientAccount p1, p2, p3;

        if (!hasPatients) {
            p1 = patientAccountRepository.save(new PatientAccount(
                    "midhun@example.com", passwordEncoder.encode("Patient@123"),
                    "Midhun Kumar", "+91-9876543210", LocalDate.of(1990, 5, 14), "B+"));
            p2 = patientAccountRepository.save(new PatientAccount(
                    "arjun@example.com",  passwordEncoder.encode("Patient@123"),
                    "Arjun Menon", "+91-9876543211", LocalDate.of(1985, 11, 3), "O+"));
            p3 = patientAccountRepository.save(new PatientAccount(
                    "lakshmi@example.com", passwordEncoder.encode("Patient@123"),
                    "Lakshmi Nair", "+91-9876543212", LocalDate.of(1972, 7, 22), "A+"));
            log.info("[Init] ✅ Seeded 3 patient accounts");
        } else {
            var patients = patientAccountRepository.findAll();
            p1 = patients.stream().filter(p -> p.getEmail().contains("midhun")).findFirst().orElse(patients.get(0));
            p2 = patients.stream().filter(p -> p.getEmail().contains("arjun")).findFirst().orElse(patients.get(0));
            p3 = patients.stream().filter(p -> p.getEmail().contains("lakshmi")).findFirst().orElse(patients.get(0));
            log.info("[Init] Patient accounts already exist — looked up existing records");
        }

        // ── Conditions ──────────────────────────────────────────────────────
        if (conditionRepository.count() == 0) {
            Condition c1 = new Condition();
            c1.setPatientAccount(p1); c1.setConditionName("Type 2 Diabetes Mellitus"); c1.setIcdCode("E11");
            c1.setDiagnosedDate(LocalDate.of(2021, 3, 10)); c1.setSeverity(Condition.Severity.STABLE);
            c1.setTreatingDoctor(drKumar); c1.setNotes("Well-controlled with medication. HbA1c 6.8%");
            conditionRepository.save(c1);

            Condition c2 = new Condition();
            c2.setPatientAccount(p1); c2.setConditionName("Hypertension"); c2.setIcdCode("I10");
            c2.setDiagnosedDate(LocalDate.of(2022, 8, 5)); c2.setSeverity(Condition.Severity.MONITORING);
            c2.setTreatingDoctor(drSmith); c2.setNotes("BP averaging 140/90. Medication adjusted last month.");
            conditionRepository.save(c2);

            Condition c3 = new Condition();
            c3.setPatientAccount(p2); c3.setConditionName("Lumbar Disc Herniation"); c3.setIcdCode("M51.1");
            c3.setDiagnosedDate(LocalDate.of(2023, 1, 20)); c3.setSeverity(Condition.Severity.MONITORING);
            c3.setTreatingDoctor(drNair); c3.setNotes("Post-surgery recovery. Physical therapy ongoing.");
            conditionRepository.save(c3);
            log.info("[Init] ✅ Seeded 3 conditions");
        }

        // ── Medical Records ─────────────────────────────────────────────────
        if (medicalRecordRepository.count() == 0) {
            MedicalRecord mr1 = new MedicalRecord();
            mr1.setPatientAccount(p1); mr1.setDoctor(drKumar); mr1.setHospital(h1);
            mr1.setVisitDate(LocalDateTime.of(2024, 11, 5, 10, 30)); mr1.setVisitType(MedicalRecord.VisitType.CONSULTATION);
            mr1.setDiagnosis("Type 2 Diabetes — routine follow-up");
            mr1.setNotes("HbA1c improved to 6.8%. Continue current medication. Next review in 3 months.");
            medicalRecordRepository.save(mr1);

            MedicalRecord mr2 = new MedicalRecord();
            mr2.setPatientAccount(p1); mr2.setDoctor(drSmith); mr2.setHospital(h1);
            mr2.setVisitDate(LocalDateTime.of(2024, 9, 12, 14, 0)); mr2.setVisitType(MedicalRecord.VisitType.CONSULTATION);
            mr2.setDiagnosis("Hypertension assessment — ECG normal");
            mr2.setNotes("ECG within normal limits. BP 142/88. Amlodipine dose increased to 10mg.");
            medicalRecordRepository.save(mr2);

            MedicalRecord mr3 = new MedicalRecord();
            mr3.setPatientAccount(p1); mr3.setDoctor(drKumar); mr3.setHospital(h1);
            mr3.setVisitDate(LocalDateTime.of(2024, 6, 20, 9, 0)); mr3.setVisitType(MedicalRecord.VisitType.LAB_RESULT);
            mr3.setDiagnosis("Complete Blood Count — within normal range");
            mr3.setNotes("CBC, lipid panel, kidney function all within acceptable range.");
            medicalRecordRepository.save(mr3);

            MedicalRecord mr4 = new MedicalRecord();
            mr4.setPatientAccount(p2); mr4.setDoctor(drNair); mr4.setHospital(h2);
            mr4.setVisitDate(LocalDateTime.of(2024, 3, 15, 8, 0)); mr4.setVisitType(MedicalRecord.VisitType.SURGERY);
            mr4.setDiagnosis("L4-L5 Microdiscectomy — successful");
            mr4.setNotes("Surgery performed under GA. Duration 1.5 hrs. Patient stable post-op. Discharged day 3.");
            medicalRecordRepository.save(mr4);

            MedicalRecord mr5 = new MedicalRecord();
            mr5.setPatientAccount(p2); mr5.setDoctor(drNair); mr5.setHospital(h2);
            mr5.setVisitDate(LocalDateTime.of(2024, 4, 10, 11, 0)); mr5.setVisitType(MedicalRecord.VisitType.FOLLOW_UP);
            mr5.setDiagnosis("Post-surgery follow-up — healing well");
            mr5.setNotes("Wound healed. Nerve pain resolved. Physiotherapy recommended for 6 weeks.");
            medicalRecordRepository.save(mr5);

            MedicalRecord mr6 = new MedicalRecord();
            mr6.setPatientAccount(p3); mr6.setDoctor(drMenon); mr6.setHospital(h3);
            mr6.setVisitDate(LocalDateTime.of(2024, 8, 22, 15, 30)); mr6.setVisitType(MedicalRecord.VisitType.CONSULTATION);
            mr6.setDiagnosis("Migraine with aura — new case assessment");
            mr6.setNotes("MRI brain normal. Diagnosis of episodic migraine with aura. Topiramate started.");
            medicalRecordRepository.save(mr6);
            log.info("[Init] ✅ Seeded 6 medical records");
        }

        // ── Prescriptions ───────────────────────────────────────────────────
        if (prescriptionRepository.count() == 0) {
            Prescription rx1 = new Prescription();
            rx1.setPatientAccount(p1); rx1.setDoctor(drKumar); rx1.setHospital(h1);
            rx1.setPrescribedDate(LocalDate.of(2024, 11, 5)); rx1.setValidUntil(LocalDate.of(2025, 2, 5));
            rx1.setStatus(Prescription.Status.ACTIVE);
            rx1.setSpecialInstructions("Take Metformin after meals. Monitor blood sugar daily. Avoid sugary drinks.");
            rx1 = prescriptionRepository.save(rx1);
            rx1.getMedications().add(new PrescriptionItem(rx1, "Metformin 500mg",  "500mg", "Twice daily",           90, "Take after meals"));
            rx1.getMedications().add(new PrescriptionItem(rx1, "Glimepiride 1mg",  "1mg",   "Once daily (morning)",  90, "Take before breakfast"));
            prescriptionRepository.save(rx1);

            Prescription rx2 = new Prescription();
            rx2.setPatientAccount(p1); rx2.setDoctor(drSmith); rx2.setHospital(h1);
            rx2.setPrescribedDate(LocalDate.of(2024, 9, 12)); rx2.setValidUntil(LocalDate.of(2025, 3, 12));
            rx2.setStatus(Prescription.Status.ACTIVE);
            rx2.setSpecialInstructions("Check BP every morning. Avoid salty food. Report if BP exceeds 160/100.");
            rx2 = prescriptionRepository.save(rx2);
            rx2.getMedications().add(new PrescriptionItem(rx2, "Amlodipine 10mg",  "10mg", "Once daily",  180, "Take at bedtime"));
            rx2.getMedications().add(new PrescriptionItem(rx2, "Telmisartan 40mg", "40mg", "Once daily",  180, "Take in the morning"));
            prescriptionRepository.save(rx2);

            Prescription rx3 = new Prescription();
            rx3.setPatientAccount(p2); rx3.setDoctor(drNair); rx3.setHospital(h2);
            rx3.setPrescribedDate(LocalDate.of(2024, 4, 10)); rx3.setValidUntil(LocalDate.of(2024, 7, 10));
            rx3.setStatus(Prescription.Status.COMPLETED);
            rx3.setSpecialInstructions("Post-surgery analgesics. Do not drive while on Tramadol.");
            rx3 = prescriptionRepository.save(rx3);
            rx3.getMedications().add(new PrescriptionItem(rx3, "Tramadol 50mg",          "50mg",   "Three times daily",           30, "Take only if pain > 5/10"));
            rx3.getMedications().add(new PrescriptionItem(rx3, "Omeprazole 20mg",         "20mg",   "Once daily",                  30, "Take 30 min before meals"));
            rx3.getMedications().add(new PrescriptionItem(rx3, "Methylcobalamin 500mcg",  "500mcg", "Twice daily",                 90, "Nerve support supplement"));
            prescriptionRepository.save(rx3);

            Prescription rx4 = new Prescription();
            rx4.setPatientAccount(p3); rx4.setDoctor(drMenon); rx4.setHospital(h3);
            rx4.setPrescribedDate(LocalDate.of(2024, 8, 22)); rx4.setValidUntil(LocalDate.of(2025, 2, 22));
            rx4.setStatus(Prescription.Status.ACTIVE);
            rx4.setSpecialInstructions("Topiramate should be taken with water. Avoid skipping doses. Keep headache diary.");
            rx4 = prescriptionRepository.save(rx4);
            rx4.getMedications().add(new PrescriptionItem(rx4, "Topiramate 25mg",   "25mg",  "Once daily (night)",         180, "Increase to 50mg after 2 weeks"));
            rx4.getMedications().add(new PrescriptionItem(rx4, "Sumatriptan 50mg",  "50mg",  "As needed for acute attack",  10, "Max 2 tablets per day"));
            prescriptionRepository.save(rx4);
            log.info("[Init] ✅ Seeded 4 prescriptions with medication items");
        }

        // ── Sample Appointments ─────────────────────────────────────────────
        if (appointmentRepository.count() == 0) {
            Appointment appt1 = new Appointment();
            appt1.setPatientAccount(p1); appt1.setDoctor(drSmith); appt1.setHospital(h1);
            appt1.setScheduledAt(LocalDateTime.now().plusDays(7).withHour(10).withMinute(30).withSecond(0));
            appt1.setAppointmentType(Appointment.AppointmentType.IN_PERSON);
            appt1.setStatus(Appointment.Status.CONFIRMED);
            appt1.setRazorpayOrderId("order_demo_001"); appt1.setRazorpayPaymentId("pay_demo_001");
            appt1.setAmountPaise(80000); appt1.setCurrency("INR"); appt1.setQueuePosition(3);
            appointmentRepository.save(appt1);

            Appointment appt2 = new Appointment();
            appt2.setPatientAccount(p2); appt2.setDoctor(drNair); appt2.setHospital(h2);
            appt2.setScheduledAt(LocalDateTime.now().plusDays(14).withHour(9).withMinute(0).withSecond(0));
            appt2.setAppointmentType(Appointment.AppointmentType.IN_PERSON);
            appt2.setStatus(Appointment.Status.CONFIRMED);
            appt2.setRazorpayOrderId("order_demo_002"); appt2.setRazorpayPaymentId("pay_demo_002");
            appt2.setAmountPaise(100000); appt2.setCurrency("INR"); appt2.setQueuePosition(1);
            appointmentRepository.save(appt2);
            log.info("[Init] ✅ Seeded 2 sample appointments");
        }

        log.info("[Init] ═══════════════════════════════════════════════════");
        log.info("[Init]   Seed complete!");
        log.info("[Init]   Patient logins: midhun@example.com / Patient@123");
        log.info("[Init]   Doctor logins:  drsmith / Doctor@123 (NMC: NMC1001234)");
        log.info("[Init] ═══════════════════════════════════════════════════");
    }
}
