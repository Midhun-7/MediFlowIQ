package com.mediflowiq.repository;

import com.mediflowiq.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findByHospitalId(Long hospitalId);
    List<Doctor> findBySpecialtyContainingIgnoreCase(String specialty);
    Optional<Doctor> findByAppUserId(Long appUserId);
}
