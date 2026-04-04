# 🏗 MediFlowIQ — Architecture

## Overview

MediFlowIQ follows a **Modular Monolith** architecture in its initial phase, designed for fast iteration and debugging. The system is architected to smoothly transition into microservices as it scales.

---

## Architecture Pattern

```
Phase 1 (Current):   Modular Monolith
Phase 2+ (Future):   Microservices (Queue Service | Tracking Service | Auth Service)
```

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│         React + TypeScript + Tailwind CSS                   │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │  Queue Board │  │  Ambulance Map │  │  Admin Panel   │  │
│  └──────┬───────┘  └───────┬────────┘  └───────┬────────┘  │
└─────────┼──────────────────┼───────────────────┼───────────┘
          │   REST API        │   WebSocket        │
          ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│                   Java + Spring Boot                        │
│  ┌──────────────────┐  ┌───────────────────────────────┐   │
│  │  Queue Service   │  │   Ambulance Tracking Service  │   │
│  │ - Token gen      │  │ - Simulated GPS stream        │   │
│  │ - Priority sort  │  │ - ETA calculation             │   │
│  │ - Wait time calc │  │ - WS broadcast                │   │
│  └────────┬─────────┘  └────────────┬──────────────────┘   │
│           │                         │                       │
│  ┌────────▼─────────────────────────▼──────────────────┐   │
│  │                  API Layer                           │   │
│  │  REST Controllers + WebSocket (Socket.io)            │   │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                                 │
│  ┌────────────────────────▼─────────────────────────────┐  │
│  │                Security Layer                         │  │
│  │   JWT Auth + Role-Based Access (Admin/Doctor/Staff)   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          │                          │
          ▼                          ▼
   ┌─────────────┐           ┌──────────────┐
   │ PostgreSQL  │           │    Redis      │
   │ (Patients,  │           │ (Queue State) │
   │  Queues,    │           │  (optional)   │
   │  Roles)     │           └──────────────┘
   └─────────────┘
```

---

## Core Components

### 1. 🎟 Queue Management Service

**Responsibility:** Manages the entire patient token lifecycle.

| Feature | Details |
|---------|---------|
| Token Generation | Unique token per patient visit |
| Priority System | `EMERGENCY` > `HIGH_RISK` > `NORMAL` |
| Wait Time | Calculated based on queue depth and avg service time |
| State | Stored in PostgreSQL; optionally cached in Redis |

**Priority Enum:**
```java
public enum Priority {
    EMERGENCY,   // Immediately routed to available doctor
    HIGH_RISK,   // Next in queue after emergencies
    NORMAL       // Standard FIFO ordering
}
```

---

### 2. 🚑 Ambulance Tracking Service

**Responsibility:** Tracks ambulance location and pushes live updates to the frontend.

| Feature | Details |
|---------|---------|
| Phase 1 – GPS | Simulated GPS coordinates via a scheduled job |
| Phase 5 – GPS | Real mobile phone GPS input |
| ETA | Calculated from current position to hospital |
| Protocol | WebSocket (Socket.io) broadcast per ambulance |

---

### 3. 🔗 API Layer

**Technology:** Spring Boot REST Controllers + Spring WebSocket

| Endpoint Type | Technology | Purpose |
|---------------|-----------|---------|
| REST | Spring MVC | CRUD operations, queue management |
| WebSocket | Spring WebSocket / Socket.io | Live queue + ambulance updates |

---

### 4. 📊 Frontend Dashboard

**Technology:** React + TypeScript + Tailwind CSS

| View | Description |
|------|-------------|
| Queue Board | Live token list sorted by priority |
| Ambulance Map | Leaflet.js map with ambulance markers + ETA |
| Admin Panel | Queue controls, user management |

---

### 5. 🔒 Security Layer

**Technology:** Spring Security + JWT

| Role | Permissions |
|------|------------|
| `ADMIN` | Full system access, user management |
| `DOCTOR` | View queue, update patient status |
| `STAFF` | Register patients, manage tokens |

---

## Data Flow

### Patient Joins Queue

```
Staff registers patient
    → POST /api/queue/register
    → QueueService assigns token + priority
    → Saved to PostgreSQL
    → WebSocket broadcasts updated queue to all connected clients
    → Frontend Queue Board updates in real-time
```

### Ambulance Location Update (Phase 1 - Simulated)

```
Scheduler runs every N seconds
    → Generates next GPS coordinate along a simulated route
    → AmbulanceService updates location + recalculates ETA
    → WebSocket broadcasts to /topic/ambulance/{id}
    → Frontend Map updates ambulance marker position
```

---

## Database Schema (High Level)

```sql
-- Patients
patients (id, name, age, priority, token, status, registered_at)

-- Queue
queue_entries (id, patient_id, position, estimated_wait_minutes, created_at)

-- Ambulances
ambulances (id, license_plate, driver_name, status, lat, lng, eta_minutes)

-- Users (Staff/Doctors/Admins)
users (id, email, password_hash, role, created_at)
```

---

## Future: Microservices Decomposition

```
Queue Service        → Port 8081
Ambulance Service    → Port 8082
Auth Service         → Port 8083
API Gateway          → Port 8080 (routes to above)
```

---

## Design Principles

- **Simulation First** — No real patient data; all data is synthetic/anonymized
- **Real-Time First** — WebSockets preferred over polling
- **Privacy by Design** — No PII stored; GDPR/HIPAA-aware patterns
- **Modular** — Each service can be extracted with minimal refactoring
