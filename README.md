# THEKEDAR

**College Resource Booking & Permission Management System**

An institutional control system engineered for transparent, accountable, and verifiable campus resource allocation.

---

## Architecture Overview

- **Web Application (`apps/web`):** Next.js 14/15 (App Router), TypeScript, Tailwind CSS, Radix UI primitives, Better Auth.
- **Backend API (`backend/`):** Python 3.12, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2, Web3.py, ReportLab & Cryptography.
- **Database:** Neon PostgreSQL (operational truth, booking concurrency locks, version history, immutable audit logs).
- **Blockchain Layer (`contracts/`):** Solidity smart contract (`DocumentRegistry.sol`) on Ethereum Sepolia for tamper-evident document hash and revocation references.

---

## Directory Structure

```text
├── apps/
│   └── web/            # Next.js App Router frontend
├── backend/
│   ├── app/            # FastAPI core application
│   │   ├── api/        # Unified API router
│   │   ├── auth/       # JWT/JWKS token bridge & RBAC
│   │   ├── resources/  # Department & resource management
│   │   ├── bookings/   # Concurrency-safe booking engine
│   │   ├── approvals/  # Department-wise approval workflows
│   │   ├── documents/  # PDF letter generation & digital signatures
│   │   ├── blockchain/ # Web3.py Sepolia transaction integration
│   │   ├── database/   # SQLAlchemy models & session
│   │   └── tests/      # Pytest suites
│   ├── migrations/     # Alembic schema migrations
│   └── pyproject.toml
├── contracts/
│   ├── contracts/      # Solidity contracts (DocumentRegistry.sol)
│   ├── test/           # Hardhat test suites
│   ├── scripts/        # Deployment & verification scripts
│   └── hardhat.config.ts
├── docs/               # PRD, DESIGN, TECHSTACK specifications
├── TODO.md             # Sequentially ordered atomic tasks
└── package.json        # Root monorepo workspace
```

---

## Getting Started

Refer to [TODO.md](file:///d:/SHUBHAM/VIT_ACADEMICS/TY/BLOCKCHAIN/CP/TODO.md) for the active implementation roadmap and verification steps.
<img width="467" height="290" alt="image" src="https://github.com/user-attachments/assets/a8d02ef0-52aa-47b9-a589-8f823e1bf59e" />
<img width="466" height="210" alt="image" src="https://github.com/user-attachments/assets/9281ac0b-28b1-4eb7-89c1-e549d47a7eb8" />
<img width="466" height="240" alt="image" src="https://github.com/user-attachments/assets/2361cafb-54cb-4986-bcf7-ee8b101e457d" />
<img width="459" height="184" alt="image" src="https://github.com/user-attachments/assets/7425605b-ae25-435e-86d7-812418aa555f" />

