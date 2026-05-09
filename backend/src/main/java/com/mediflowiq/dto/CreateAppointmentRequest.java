package com.mediflowiq.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

public class CreateAppointmentRequest {

    @NotNull
    private Long doctorId;

    @NotNull
    private String scheduledAt; // ISO datetime: "2026-06-14T10:30:00"

    private String appointmentType = "IN_PERSON";

    public Long getDoctorId()               { return doctorId; }
    public void setDoctorId(Long d)         { this.doctorId = d; }
    public String getScheduledAt()          { return scheduledAt; }
    public void setScheduledAt(String s)    { this.scheduledAt = s; }
    public String getAppointmentType()      { return appointmentType; }
    public void setAppointmentType(String t){ this.appointmentType = t; }
}
