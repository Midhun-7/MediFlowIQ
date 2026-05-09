package com.mediflowiq.controller;

import com.mediflowiq.model.Doctor;
import com.mediflowiq.model.Hospital;
import com.mediflowiq.repository.HospitalRepository;
import com.mediflowiq.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Phase 6 — Doctor and hospital discovery.
 * Public endpoints — no auth required for browsing.
 *
 * GET /api/discovery/doctors            ?specialty=&city=
 * GET /api/discovery/doctors/{id}
 * GET /api/discovery/doctors/{id}/queue
 * GET /api/discovery/hospitals
 */
@RestController
@RequestMapping("/api/discovery")
public class DoctorDiscoveryController {

    @Autowired private DoctorService doctorService;
    @Autowired private HospitalRepository hospitalRepo;

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
    public ResponseEntity<Map<String, Object>> getDoctorQueue(@PathVariable Long id) {
        Doctor doc = doctorService.getDoctor(id);
        long count = doctorService.getQueueCount(id);
        int waitMin = (int) (count * 15); // approx 15 min per patient
        return ResponseEntity.ok(Map.of(
                "doctorId",         id,
                "doctorName",       doc.getName(),
                "queueCount",       count,
                "estimatedWaitMin", waitMin
        ));
    }

    @GetMapping("/hospitals")
    public ResponseEntity<List<Hospital>> getHospitals() {
        return ResponseEntity.ok(hospitalRepo.findAll());
    }
}
