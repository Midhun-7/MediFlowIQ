# 🗺 MediFlowIQ — Roadmap

This roadmap tracks the development milestones and planned features across all phases of MediFlowIQ.

---

## Current Status

| Phase | Name | Status |
|-------|------|--------|
| Phase 1 | Core Queue System | ✅ **Complete** |
| Phase 2 | Ambulance Simulation | ✅ **Complete** |
| Phase 3 | Intelligence Layer | ✅ **Complete** |
| Phase 4 | Security & Roles | 🔄 **In Progress** |
| Phase 5 | Real Integration | 💡 Future |

---

## 📍 Phase 1 — Core Queue System _(100% Local)_

> **Goal:** A fully functional, local queue management system with no external dependencies.

### Features

- [ ] Patient registration form (basic UI)
- [ ] Token number generation (unique per patient)
- [ ] Priority assignment — `EMERGENCY`, `HIGH_RISK`, `NORMAL`
- [ ] Priority-based queue ordering
- [ ] Estimated waiting time calculation
- [ ] Live queue visualization on dashboard
- [ ] In-memory or PostgreSQL queue state

### Deliverable

A working local prototype where hospital staff can register patients and see a live, sorted queue.

---

## 📍 Phase 2 — Ambulance Simulation

> **Goal:** Real-time ambulance tracking on a map using simulated GPS data.

### Features

- [ ] Ambulance entity model (id, status, location, ETA)
- [ ] Simulated GPS movement (scheduled background job)
- [ ] Leaflet.js map with live ambulance markers
- [ ] ETA calculation from current coords to hospital
- [ ] WebSocket (Socket.io) broadcast for location updates
- [ ] Frontend map auto-updates without refresh

### Deliverable

An animated map showing one or more ambulances moving toward the hospital with live ETA display.

---

## 📍 Phase 3 — Intelligence Layer

> **Goal:** Add predictive capabilities to improve operational decision-making.

### Features

- [ ] Wait time prediction model (rule-based or ML)
- [ ] Queue optimization logic (dynamic reordering)
- [ ] Load indicators — alert when queue exceeds threshold
- [ ] Historical analytics view (avg wait time, peak hours)
- [ ] Basic reporting dashboard for admins

### Deliverable

A smarter queue system that provides staff with data-driven insights and predictions.

---

## 📍 Phase 4 — Security & Roles

> **Goal:** Secure the system with authentication and role-based access control.

### Features

- [ ] User registration and login (JWT-based)
- [ ] Role definitions: `ADMIN`, `DOCTOR`, `STAFF`
- [ ] Protected API routes per role
- [ ] Frontend route guards
- [ ] Session management (token refresh)
- [ ] Audit log for sensitive actions (optional)

### Deliverable

A fully secured application where each user type sees only what they are permitted to access.

---

## 💡 Phase 5 — Real Integration _(Optional)_

> **Goal:** Connect the system to real-world data sources.

### Features

- [ ] Mobile GPS input from ambulance driver's phone
- [ ] SMS/push notification system for queue updates
- [ ] External hospital API integration (if available)
- [ ] Multi-hospital support (load balancing between hospitals)
- [ ] Mobile app for ambulance drivers

---

## 🔮 Future Enhancements

These are longer-term ideas beyond the core 5 phases:

| Enhancement | Description |
|-------------|-------------|
| Multi-Hospital Load Balancing | Route ambulances and patients to least-loaded hospital |
| AI-Based Patient Prioritization | ML model to auto-triage patients based on symptoms |
| Mobile App | Dedicated app for ambulance drivers and field staff |
| Notification System | SMS and push alerts for queue status updates |
| Microservices Migration | Split into Queue, Tracking, and Auth microservices |

---

## 📅 Milestone Summary

```
Q2 2026  →  Phase 1 Complete (Core Queue MVP)
Q3 2026  →  Phase 2 Complete (Ambulance Simulation)
Q3 2026  →  Phase 3 Complete (Intelligence Layer)
Q4 2026  →  Phase 4 Complete (Security & Auth)
2027+    →  Phase 5 + Future (Real Integration & Scale)
```

---

_This roadmap is a living document and will be updated as the project evolves._
