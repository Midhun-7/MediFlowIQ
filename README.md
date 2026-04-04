# 🏥 MediFlowIQ

> **Centralized Hospital Coordination System** — Real-time queue management, ambulance tracking, and intelligent patient prioritization to reduce waiting times and improve emergency response.

[![Status: In Development](https://img.shields.io/badge/Status-In%20Development-yellow.svg)]()
[![Java](https://img.shields.io/badge/Backend-Java%20%2B%20Spring%20Boot-orange.svg)]()
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Phases](#development-phases)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🔍 Overview

**MediFlowIQ** is a centralized hospital coordination system designed to optimize patient flow and emergency response. It provides real-time queue management, ambulance tracking, and intelligent prioritization to reduce waiting times and improve operational efficiency.

The system is built using a **simulation-first approach**, using anonymized patient data and simulated GPS streams to replicate real-world hospital environments while respecting privacy constraints.

---

## ✨ Features

- 🎟️ **Token-Based Queue System** — Priority queues with Emergency > High-risk > Normal ordering
- 🚑 **Ambulance Tracking** — Real-time map visualization with simulated GPS and ETA display
- ⏱️ **Wait Time Estimation** — Dynamic estimated waiting time calculation per patient
- 📊 **Live Dashboard** — Admin controls, queue visualization, and map-based tracking
- 🔒 **Role-Based Access** — Admin, Doctor, and Staff roles via JWT authentication
- 🔗 **WebSocket Updates** — Live queue state and ambulance position via Socket.io
- 🔐 **Privacy by Design** — Fully anonymized/simulated patient data

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java + Spring Boot |
| **Frontend** | TypeScript + React + Tailwind CSS |
| **Real-Time** | WebSockets (Socket.io) |
| **Maps** | Leaflet.js / Google Maps API |
| **Database** | PostgreSQL |
| **Cache** | Redis _(optional)_ |
| **Auth** | JWT |
| **Testing** | Jest, React Testing Library, Playwright |
| **Linting** | ESLint + Prettier |

---

## 🚀 Getting Started

### Prerequisites

- **Java** >= 17
- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL** >= 14
- **Redis** _(optional)_
- **Maven** or **Gradle**

### Backend Setup (Spring Boot)

```bash
# Navigate to backend
cd backend

# Run with Maven
./mvnw spring-boot:run

# Or with Gradle
./gradlew bootRun
```

### Frontend Setup (React + TypeScript)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Environment Variables

```bash
# Copy example env file
cp .env.example .env
```

Key variables:
```env
DATABASE_URL=postgresql://localhost:5432/mediflowiq
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
GOOGLE_MAPS_API_KEY=your_api_key   # optional
```

---

## 📁 Project Structure

```
MediFlowIQ/
├── backend/                    # Java Spring Boot backend
│   ├── src/
│   │   ├── main/java/
│   │   │   ├── queue/          # Queue management service
│   │   │   ├── ambulance/      # Ambulance tracking service
│   │   │   ├── auth/           # JWT authentication
│   │   │   └── api/            # REST API controllers
│   │   └── resources/
│   │       └── application.yml
│   └── pom.xml
├── frontend/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page views
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API & WebSocket clients
│   │   └── types/              # TypeScript type definitions
│   ├── tailwind.config.ts
│   └── package.json
├── docs/                       # Project documentation
│   ├── ARCHITECTURE.md
│   └── API.md
├── .github/                    # GitHub Actions & PR templates
├── README.md
├── ARCHITECTURE.md
├── CONTRIBUTING.md
├── ROADMAP.md
└── LEARNINGS.md
```

---

## 🗺 Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Core Queue System — token generation, priority ordering, queue visualization | 🔄 In Progress |
| **Phase 2** | Ambulance Simulation — simulated GPS, map visualization, WebSocket updates | ⏳ Planned |
| **Phase 3** | Intelligence Layer — wait time prediction, queue optimization | ⏳ Planned |
| **Phase 4** | Security & Roles — JWT auth, role-based access control | ⏳ Planned |
| **Phase 5** | Real Integration — mobile GPS, external APIs _(optional)_ | 💡 Future |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, data flow, and component interaction |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development setup, coding standards, and git workflow |
| [ROADMAP.md](ROADMAP.md) | Feature roadmap and milestone planning |
| [LEARNINGS.md](LEARNINGS.md) | Challenges, failures, and lessons learned |

---

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests. We follow [Conventional Commits](https://www.conventionalcommits.org/) and the Airbnb JavaScript Style Guide.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">Built to improve real-world hospital coordination through simulation-driven development 🚑</p>
