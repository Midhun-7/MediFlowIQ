package com.mediflowiq.model;

public enum AmbulanceStatus {
    AVAILABLE,    // Parked at base, ready for dispatch
    DISPATCHED,   // En-route to emergency site
    ON_SCENE,     // At emergency location
    RETURNING     // Returning to hospital / base
}
