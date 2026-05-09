package com.mediflowiq.repository;

import com.mediflowiq.model.Condition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConditionRepository extends JpaRepository<Condition, Long> {
    List<Condition> findByPatientAccountIdAndActiveTrue(Long patientAccountId);
    List<Condition> findByPatientAccountId(Long patientAccountId);
}
