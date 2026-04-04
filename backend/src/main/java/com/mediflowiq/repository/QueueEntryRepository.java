package com.mediflowiq.repository;

import com.mediflowiq.model.QueueEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueueEntryRepository extends JpaRepository<QueueEntry, Long> {

    @Query("SELECT q FROM QueueEntry q WHERE q.patient.status = 'WAITING' " +
           "ORDER BY CASE q.patient.priority " +
           "WHEN 'EMERGENCY' THEN 0 WHEN 'HIGH_RISK' THEN 1 ELSE 2 END, q.createdAt ASC")
    List<QueueEntry> findActiveQueueSortedByPriority();

    Optional<QueueEntry> findByPatientId(Long patientId);

    long count();
}
