package com.mediflowiq.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ambulances")
public class Ambulance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String callSign;   // e.g. "AMB-01"

    @Column(nullable = false)
    private String driverName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AmbulanceStatus status = AmbulanceStatus.AVAILABLE;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    // Destination coordinates (hospital or scene)
    @Column(name = "target_lat")
    private double targetLat;

    @Column(name = "target_lng")
    private double targetLng;

    @Column(name = "eta_minutes")
    private int etaMinutes;

    /** When true, real GPS coordinates are being pushed by the driver — skip simulation */
    @Column(name = "gps_live", nullable = false)
    private boolean gpsLive = false;

    public Ambulance() {}

    public Ambulance(String callSign, String driverName, double lat, double lng) {
        this.callSign = callSign;
        this.driverName = driverName;
        this.lat = lat;
        this.lng = lng;
        this.status = AmbulanceStatus.AVAILABLE;
        this.etaMinutes = 0;
    }

    // ── Getters / Setters ──────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCallSign() { return callSign; }
    public void setCallSign(String callSign) { this.callSign = callSign; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public AmbulanceStatus getStatus() { return status; }
    public void setStatus(AmbulanceStatus status) { this.status = status; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public double getTargetLat() { return targetLat; }
    public void setTargetLat(double targetLat) { this.targetLat = targetLat; }

    public double getTargetLng() { return targetLng; }
    public void setTargetLng(double targetLng) { this.targetLng = targetLng; }

    public int getEtaMinutes() { return etaMinutes; }
    public void setEtaMinutes(int etaMinutes) { this.etaMinutes = etaMinutes; }

    public boolean isGpsLive() { return gpsLive; }
    public void setGpsLive(boolean gpsLive) { this.gpsLive = gpsLive; }
}
