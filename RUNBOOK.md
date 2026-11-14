# THEKEDAR: Local-First Operations & Runbook

**Institutional Resource Booking and Permission Management System**  
*Release Version 1.0.0 — Local-First Windows Architecture*

---

## 1. System Overview

THEKEDAR is an institutional control system designed for college campuses to eliminate paper-based facility approvals, prevent double bookings through transactional database locking, issue tamper-evident RSA-PSS signed digital permission letters, and register cryptographic audit proofs to the Ethereum Sepolia testnet.

### Core Architectural Separation
1. **Primary Authority**: The local relational SQLite database (`backend/data/thekedar.db`) holds canonical authorization state (`events`, `department_requests`, `bookings`, `permission_letters`, `audit_logs`).
2. **Notary Proof**: The Ethereum Sepolia smart contract (`DocumentRegistry.sol`) holds immutable, timestamped SHA-256 document digests. A database approval is immediate; blockchain confirmation completes via Web3.py.
3. **Local Authentication**: FastAPI-managed authentication issuing signed, expiring HS256 JWT access tokens with PBKDF2 password hashing. No external Neon or Better Auth dependencies required.

---

## 2. Component Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, Lucide | Club portal, Authority approval queue, Public verification tool, Admin console (`http://localhost:3000`) |
| **Backend API** | FastAPI, Python 3.12, Pydantic v2 | Concurrency booking engine, multi-department workflow, PDF generation, local JWT auth (`http://127.0.0.1:8000`) |
| **Database** | SQLite, SQLAlchemy 2.0, Alembic | Local relational state (`backend/data/thekedar.db`) with `PRAGMA foreign_keys=ON` |
| **Document Engine** | ReportLab, Cryptography (RSA-PSS 2048) | Deterministic PDF generation and asymmetric digital signing |
| **Blockchain** | Solidity 0.8.24, Hardhat, Web3.py | Sepolia `DocumentRegistry` smart contract (Chain ID: `11155111`) |
| **Authentication** | FastAPI Local Auth, PBKDF2-HMAC-SHA256, HS256 JWT | Local auth client in Next.js communicating directly with FastAPI |

---

## 3. Environment Variables Reference

### Backend (`backend/.env`)

```env
# Application Environment
ENVIRONMENT=development
PROJECT_NAME="THEKEDAR"
VERSION="1.0.0"

# Networking & CORS
API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]

# Database (Local SQLite)
DATABASE_URL=sqlite:///backend/data/thekedar.db

# FastAPI-Managed Local Authentication
JWT_SECRET_KEY=local-dev-jwt-signing-secret-key-32-chars-minimum
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Ethereum Sepolia Blockchain
SEPOLIA_RPC_URL=https://rpc.sepolia.org
BLOCKCHAIN_CHAIN_ID=11155111
DOCUMENT_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
SIGNER_PRIVATE_KEY=

# Document Storage
STORAGE_DIR=storage/documents
```

### Frontend (`apps/web/.env.local` or `.env`)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 4. Local Database Setup & Initialization

### Step 1: Run Alembic Migrations
Initializes the SQLite schema in `backend/data/thekedar.db`:
```powershell
$env:PYTHONPATH="."
.venv\Scripts\alembic -c backend\alembic.ini upgrade head
```

### Step 2: Seed Local Reference Data
Seeds demo departments, venues, resources, and demo accounts:
```powershell
$env:PYTHONPATH="."
.venv\Scripts\python -m backend.app.database.seed
```
*Note: Seeding is idempotent and safe to re-run. The root administrator account is created with `password_hash=None` so it cannot be accessed via a default hardcoded password.*

### Step 3: Database Reset Procedure (If Needed)
To reset the local database from scratch:
```powershell
Remove-Item -Force backend\data\thekedar.db
$env:PYTHONPATH="."
.venv\Scripts\alembic -c backend\alembic.ini upgrade head
.venv\Scripts\python -m backend.app.database.seed
```

---

## 5. Starting the Local Application

Open two separate Windows PowerShell windows at the repository root `d:\SHUBHAM\VIT_ACADEMICS\TY\BLOCKCHAIN\CP`:

### Terminal 1 — Backend (FastAPI)
```powershell
$env:PYTHONPATH="."
.venv\Scripts\uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

### Terminal 2 — Frontend (Next.js)
```powershell
npm run dev --workspace=apps/web
```
- Web Application: `http://localhost:3000`
- Club Dashboard: `http://localhost:3000/club/dashboard`
- Authority Queue: `http://localhost:3000/authority/dashboard`
- Document Verification: `http://localhost:3000/verify`

---

## 6. Running Local Test Suites

All backend tests can be run using pytest in PowerShell:
```powershell
$env:PYTHONPATH="."
.venv\Scripts\python -m pytest backend/app/tests/
```

To run individual focused suites:
```powershell
# E2E Complete Workflow
.venv\Scripts\python -m pytest backend/app/tests/test_e2e_local.py

# Local Authentication & RBAC
.venv\Scripts\python -m pytest backend/app/tests/test_local_auth.py

# Blockchain Service & Transaction Handling
.venv\Scripts\python -m pytest backend/app/tests/test_blockchain.py

# Double-Booking Concurrency & Row Locking
.venv\Scripts\python -m pytest backend/app/tests/test_concurrency.py

# PDF Letter Generation & Tamper Detection
.venv\Scripts\python -m pytest backend/app/tests/test_documents.py
```

Frontend TypeScript type checking:
```powershell
npx tsc --noEmit --project apps/web/tsconfig.json
```

---

## 7. Verification Audit Pipeline

Any institutional permission letter can be verified offline or online using the public `/verify` portal:

```
[Uploaded PDF Letter or SHA-256 Hash]
        │
        ▼
1. RSA-PSS Digital Signature Check  ──► Validated via 2048-bit institutional public key
        │
        ▼
2. SHA-256 Database Hash Match      ──► Checked against SQLite permission_letters table
        │
        ▼
3. Authority Approval Status        ──► Validates status == 'VALID'
        │
        ▼
4. Supersession & Version Check     ──► Ensures letter was not superseded by newer v2/v3
        │
        ▼
5. Sepolia On-Chain Confirmation    ──► Queries DocumentRegistry.isDocumentRegistered(hash)
```

---

## 8. Verification & Acceptance Checklist

- [x] **Local SQLite Foundation**: Database at `backend/data/thekedar.db`, foreign keys enforced.
- [x] **FastAPI-Managed Auth**: Registration, login, JWT token issuance, PBKDF2 hashing, role enforcement.
- [x] **Zero Better Auth/Neon Dependency**: Removed remote JWKS network calls and Neon PostgreSQL dependencies.
- [x] **Real Frontend Integration**: Dashboards connected to backend APIs via `apps/web/lib/api.ts`.
- [x] **Conflict Prevention**: Double-booking conflict detection verified under test conditions.
- [x] **Digital Signatures & Tamper Detection**: RSA-PSS 2048-bit signing and 1-byte alteration rejection verified.
- [x] **Sepolia Blockchain Service**: Raw transaction dispatch with clear `FAILED`/`PENDING` reporting; zero fake transaction hashes.
- [x] **Regression Tests**: All 25 backend tests passing; TypeScript compiles with 0 errors.

