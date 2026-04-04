# 🤝 Contributing to MediFlowIQ

Thank you for your interest in contributing to MediFlowIQ! This guide covers development setup, coding standards, and the git workflow to follow.

---

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Naming Conventions](#naming-conventions)
- [Git Workflow](#git-workflow)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

---

## 🛠 Development Setup

### Prerequisites

Make sure the following are installed:

| Tool | Version | Purpose |
|------|---------|---------|
| Java JDK | >= 17 | Backend runtime |
| Maven / Gradle | Latest | Build tool |
| Node.js | >= 18.x | Frontend runtime |
| npm | >= 9.x | Package manager |
| PostgreSQL | >= 14 | Primary database |
| Redis | Latest | Queue cache (optional) |
| Git | Latest | Version control |

### Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-org/mediflowiq.git
cd mediflowiq

# 2. Backend - Spring Boot
cd backend
./mvnw spring-boot:run        # Maven
# or
./gradlew bootRun             # Gradle

# 3. Frontend - React + TypeScript
cd ../frontend
npm install
npm run dev
```

### Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your local values:

```env
DATABASE_URL=postgresql://localhost:5432/mediflowiq
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_secure_secret
GOOGLE_MAPS_API_KEY=optional
```

---

## 📐 Coding Standards

### JavaScript / TypeScript

- Follow the **Airbnb JavaScript Style Guide**
- **TypeScript strict mode** must be enabled (`"strict": true` in `tsconfig.json`)
- All new code must be typed — avoid `any`

### Java (Spring Boot)

- Follow standard Java conventions (Oracle Java Code Conventions)
- Use meaningful method and class names
- Keep controllers thin — business logic belongs in services

### Linting & Formatting

Before committing, always run:

```bash
# Frontend
npm run lint        # ESLint check
npm run format      # Prettier format
```

ESLint and Prettier configs are pre-configured. Do not disable rules without team discussion.

---

## 🏷 Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Variables / Functions | `camelCase` | `patientQueue`, `getWaitTime()` |
| React Components / Classes | `PascalCase` | `QueueBoard`, `AmbulanceMap` |
| Database fields | `snake_case` | `patient_id`, `estimated_wait` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_QUEUE_SIZE` |
| REST endpoints | `kebab-case` | `/api/queue-entries` |
| Java packages | `lowercase` | `com.mediflowiq.queue` |

---

## 🌿 Git Workflow

### Branch Strategy

```
main          → Production-ready code
develop       → Integration branch (merge PRs here)
feature/*     → New features
fix/*         → Bug fixes
docs/*        → Documentation changes
refactor/*    → Code improvements
chore/*       → Maintenance tasks
```

**Always branch off `develop`:**

```bash
git checkout develop
git pull origin develop
git checkout -b feature/queue-priority-sort
```

### Commit Convention (Conventional Commits)

Format: `type(scope): short description`

| Type | When to Use | Example |
|------|------------|---------|
| `feat` | New feature | `feat(queue): add priority-based token sorting` |
| `fix` | Bug fix | `fix(auth): correct JWT expiry handling` |
| `docs` | Documentation | `docs: update ARCHITECTURE.md` |
| `refactor` | Code improvement | `refactor(ambulance): simplify GPS simulator` |
| `test` | Adding/fixing tests | `test(queue): add unit tests for wait time calc` |
| `chore` | Maintenance | `chore: update npm dependencies` |

```bash
# ✅ Good commit messages
git commit -m "feat(queue): implement token generation with priority ordering"
git commit -m "fix(websocket): reconnect logic on connection drop"
git commit -m "docs: add API endpoint documentation"

# ❌ Bad commit messages
git commit -m "fixed stuff"
git commit -m "wip"
git commit -m "updates"
```

---

## 🧪 Testing

### Backend (Java)

```bash
cd backend
./mvnw test
```

### Frontend (Jest + React Testing Library)

```bash
cd frontend
npm run test          # Unit & integration tests
npm run test:watch    # Watch mode
```

### End-to-End (Playwright)

```bash
cd frontend
npm run test:e2e
```

### Test Coverage Requirements

- Aim for **>70% coverage** on core business logic
- All new services/components must include unit tests
- E2E tests required for critical user flows (patient registration, queue update)

---

## 🔍 Pull Request Process

1. **Create a branch** from `develop` following the naming convention
2. **Write your code** following the standards above
3. **Add tests** for new functionality
4. **Run linting** — PRs will fail CI if lint errors exist
5. **Open a PR** to `develop` with:
   - Clear title (follows commit convention format)
   - Description of what changed and why
   - Screenshots/recordings for UI changes
6. **Request a review** — at least 1 approval required
7. **Squash and merge** once approved

---

## ❓ Questions?

Open a [GitHub Discussion](https://github.com/your-org/mediflowiq/discussions) or reach out to the maintainers.
