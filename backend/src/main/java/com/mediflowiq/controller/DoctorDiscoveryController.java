package com.mediflowiq.controller;

import com.mediflowiq.model.Appointment;
import com.mediflowiq.model.Doctor;
import com.mediflowiq.model.Hospital;
import com.mediflowiq.repository.AppointmentRepository;
import com.mediflowiq.repository.HospitalRepository;
import com.mediflowiq.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Phase 6 — Doctor and hospital discovery.
 * Public endpoints — no auth required for browsing.
 *
 * GET /api/discovery/doctors            ?specialty=&city=
 * GET /api/discovery/doctors/{id}
 * GET /api/discovery/doctors/{id}/queue ?date=YYYY-MM-DD
 * GET /api/discovery/hospitals
 */
@RestController
@RequestMapping("/api/discovery")
public class DoctorDiscoveryController {

    @Autowired private DoctorService doctorService;
    @Autowired private HospitalRepository hospitalRepo;
    @Autowired private AppointmentRepository appointmentRepo;

    @GetMapping("/doctors")
    public ResponseEntity<List<Doctor>> searchDoctors(
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String city) {
        return ResponseEntity.ok(doctorService.searchDoctors(specialty, city));
    }

    @GetMapping("/doctors/{id}")
    public ResponseEntity<Doctor> getDoctor(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctor(id));
    }

    @GetMapping("/doctors/{id}/queue")
    public ResponseEntity<Map<String, Object>> getDoctorQueue(
            @PathVariable Long id,
            @RequestParam(required = false) String date) {
        Doctor doc = doctorService.getDoctor(id);

        LocalDate targetDate = LocalDate.now();
        if (date != null && !date.isBlank()) {
            try {
                targetDate = LocalDate.parse(date.trim());
            } catch (Exception ignored) {}
        }

        LocalDateTime startOfDay = targetDate.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        List<Appointment> dayAppts = appointmentRepo.findTodayByDoctorId(id, startOfDay, endOfDay);

        List<Integer> completedTokens = dayAppts.stream()
                .filter(a -> a.getStatus() == Appointment.Status.COMPLETED && a.getQueuePosition() != null)
                .map(Appointment::getQueuePosition)
                .sorted()
                .toList();

        List<Appointment> waiting = dayAppts.stream()
                .filter(a -> a.getStatus() == Appointment.Status.CONFIRMED && a.getQueuePosition() != null)
                .sorted(Comparator.comparingInt(Appointment::getQueuePosition))
                .toList();

        Integer nowServingToken = waiting.isEmpty() ? null : waiting.get(0).getQueuePosition();
        String nowServingPatient = waiting.isEmpty() ? null
                : (waiting.get(0).getPatientAccount() != null ? waiting.get(0).getPatientAccount().getFullName() : null);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("doctorId", id);
        resp.put("doctorName", doc.getName());
        resp.put("date", targetDate.toString());
        resp.put("currentlyServingToken", nowServingToken);
        resp.put("currentlyServingPatient", nowServingPatient);
        resp.put("totalWaiting", waiting.size());
        resp.put("totalAttended", completedTokens.size());
        resp.put("completedTokens", completedTokens);
        resp.put("waitingTokens", waiting.stream().map(Appointment::getQueuePosition).toList());
        resp.put("queueCount", waiting.size());
        resp.put("estimatedWaitMin", waiting.size() * 15);

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/hospitals")
    public ResponseEntity<List<Hospital>> getHospitals() {
        return ResponseEntity.ok(hospitalRepo.findAll());
    }
}
