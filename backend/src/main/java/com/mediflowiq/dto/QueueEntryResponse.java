package com.mediflowiq.dto;

import com.mediflowiq.model.Priority;
import com.mediflowiq.model.PatientStatus;
import com.mediflowiq.model.QueueEntry;

import java.time.LocalDateTime;

public class QueueEntryResponse {

    private Long id;
    private Long patientId;
    private String patientName;
    private Integer patientAge;
    private String token;
    private Priority priority;
    private PatientStatus status;
    private Integer position;
    private Integer estimatedWaitMinutes;
    private String symptoms;
    private LocalDateTime registeredAt;

    public QueueEntryResponse() {}

    public static QueueEntryResponse from(QueueEntry entry) {
        QueueEntryResponse r = new QueueEntryResponse();
        r.id = entry.getId();
        r.patientId = entry.getPatient().getId();
        r.patientName = entry.getPatient().getName();
        r.patientAge = entry.getPatient().getAge();
        r.token = entry.getPatient().getToken();
        r.priority = entry.getPatient().getPriority();
        r.status = entry.getPatient().getStatus();
        r.position = entry.getPosition();
        r.estimatedWaitMinutes = entry.getEstimatedWaitMinutes();
        r.symptoms = entry.getPatient().getSymptoms();
        r.registeredAt = entry.getPatient().getRegisteredAt();
        return r;
    }

    public Long getId() { return id; }
    public Long getPatientId() { return patientId; }
    public String getPatientName() { return patientName; }
    public Integer getPatientAge() { return patientAge; }
    public String getToken() { return token; }
    public Priority getPriority() { return priority; }
    public PatientStatus getStatus() { return status; }
    public Integer getPosition() { return position; }
    public Integer getEstimatedWaitMinutes() { return estimatedWaitMinutes; }
    public String getSymptoms() { return symptoms; }
    public LocalDateTime getRegisteredAt() { return registeredAt; }
}
