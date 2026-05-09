package com.mediflowiq.repository;

import com.mediflowiq.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findByHospitalId(Long hospitalId);
    List<Doctor> findBySpecialtyContainingIgnoreCase(String specialty);
    Optional<Doctor> findByAppUserId(Long appUserId);

    @Query("SELECT d FROM Doctor d WHERE " +
           "(:specialty IS NULL OR LOWER(d.specialty) LIKE LOWER(CONCAT('%',:specialty,'%'))) AND " +
           "(:city IS NULL OR LOWER(d.hospital.city) LIKE LOWER(CONCAT('%',:city,'%')))")
    List<Doctor> searchDoctors(@Param("specialty") String specialty,
                               @Param("city") String city);
}
