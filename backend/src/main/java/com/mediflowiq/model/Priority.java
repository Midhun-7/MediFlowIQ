package com.mediflowiq.model;

public enum Priority {
    EMERGENCY,   // Immediately routed — life-threatening
    HIGH_RISK,   // Next in queue after emergencies
    NORMAL       // Standard FIFO ordering
}
