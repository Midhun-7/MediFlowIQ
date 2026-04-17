package com.mediflowiq.repository;

import com.mediflowiq.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop50ByOrderByPerformedAtDesc();
    List<AuditLog> findByActorOrderByPerformedAtDesc(String actor);
}
