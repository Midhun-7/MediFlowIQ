package com.mediflowiq.dto;

import com.mediflowiq.model.Ambulance;
import com.mediflowiq.model.AmbulanceStatus;

public class AmbulanceResponse {

    private Long id;
    private String callSign;
    private String driverName;
    private AmbulanceStatus status;
    private double lat;
    private double lng;
    private double targetLat;
    private double targetLng;
    private int etaMinutes;

    public AmbulanceResponse() {}

    public static AmbulanceResponse from(Ambulance a) {
        AmbulanceResponse dto = new AmbulanceResponse();
        dto.id = a.getId();
        dto.callSign = a.getCallSign();
        dto.driverName = a.getDriverName();
        dto.status = a.getStatus();
        dto.lat = a.getLat();
        dto.lng = a.getLng();
        dto.targetLat = a.getTargetLat();
        dto.targetLng = a.getTargetLng();
        dto.etaMinutes = a.getEtaMinutes();
        return dto;
    }

    // ── Getters ────────────────────────────────────────────────────
    public Long getId() { return id; }
    public String getCallSign() { return callSign; }
    public String getDriverName() { return driverName; }
    public AmbulanceStatus getStatus() { return status; }
    public double getLat() { return lat; }
    public double getLng() { return lng; }
    public double getTargetLat() { return targetLat; }
    public double getTargetLng() { return targetLng; }
    public int getEtaMinutes() { return etaMinutes; }
}
