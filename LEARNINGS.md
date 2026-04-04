# 📝 MediFlowIQ — Learnings

> A living document to track challenges, failures, lessons learned, and technical decisions made throughout the development of MediFlowIQ.

---

## How to Use This Document

This file is updated regularly as development progresses. Each entry should follow this format:

```
### [Phase X] Short Title
**Date:** YYYY-MM-DD
**Category:** Architecture | Bug | Performance | Design | Tooling
**What happened:** ...
**What we tried:** ...
**What worked:** ...
**Takeaway:** ...
```

---

## Phase 1 — Core Queue System

_Entries will be added as development begins._

---

## Phase 2 — Ambulance Simulation

_Entries will be added when work on this phase begins._

---

## Phase 3 — Intelligence Layer

_Entries will be added when work on this phase begins._

---

## Phase 4 — Security & Roles

_Entries will be added when work on this phase begins._

---

## 🗂 Technical Decisions Log

A record of key architectural and tech decisions and the reasoning behind them.

| Decision | Options Considered | Choice Made | Reason |
|----------|--------------------|-------------|--------|
| Architecture | Microservices vs Modular Monolith | Modular Monolith | Faster to build and debug in early stages; easy migration path to microservices later |
| Real-Time Protocol | Polling vs WebSockets | WebSockets (Socket.io) | Required for true real-time updates without unnecessary HTTP overhead |
| Backend Language | Python/Node vs Java | Java (Spring Boot) | Better typing, strong OOP support, enterprise-grade ecosystem |
| Map Library | Google Maps vs Leaflet.js | Leaflet.js (Phase 1) | Open source, no API key needed in early phase; Google Maps can be added later |
| Database | MySQL vs PostgreSQL | PostgreSQL | Better JSON support, more advanced query planner, widely used in healthcare systems |
| GPS Phase 1 | Real GPS vs Simulation | Simulation | Avoids privacy issues, allows testing without hardware |

---

## 🐛 Known Issues & Pain Points

| Issue | Phase | Status | Notes |
|-------|-------|--------|-------|
| _None yet_ | — | — | — |

---

## 💡 Ideas Parking Lot

Ideas that came up during development but weren't implemented yet:

- Use a red-black tree or min-heap for O(log n) priority queue operations instead of sorted list
- Consider STOMP protocol over raw WebSockets for better Spring Boot integration
- Explore using H2 in-memory DB for unit tests instead of requiring PostgreSQL locally
- Dockerize early to avoid "works on my machine" issues

---

_Last updated: 2026-04-03_
