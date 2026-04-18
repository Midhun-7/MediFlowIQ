package com.mediflowiq.model;

import jakarta.persistence.*;

/**
 * Phase 5 — Multi-hospital support entity.
 * Tracks hospital metadata and current capacity for load-balancing recommendations.
 */
@Entity
@Table(name = "hospitals")
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    /** Maximum patient capacity before flagging overload */
    @Column(name = "max_capacity", nullable = false)
    private int maxCapacity;

    /** Current queue size (updated periodically by HospitalService) */
    @Column(name = "current_load", nullable = false)
    private int currentLoad = 0;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /** Phone contact for the hospital */
    @Column(name = "phone")
    private String phone;

    public Hospital() {}

    public Hospital(String name, String city, String address, double lat, double lng,
                    int maxCapacity, String phone) {
        this.name = name;
        this.city = city;
        this.address = address;
        this.lat = lat;
        this.lng = lng;
        this.maxCapacity = maxCapacity;
        this.phone = phone;
        this.active = true;
        this.currentLoad = 0;
    }

    // ── Getters / Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public int getMaxCapacity() { return maxCapacity; }
    public void setMaxCapacity(int maxCapacity) { this.maxCapacity = maxCapacity; }

    public int getCurrentLoad() { return currentLoad; }
    public void setCurrentLoad(int currentLoad) { this.currentLoad = currentLoad; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    /** Percentage of capacity currently used (0–100) */
    public int getLoadPercent() {
        if (maxCapacity == 0) return 0;
        return (int) Math.min(100, Math.round((currentLoad * 100.0) / maxCapacity));
    }
}
