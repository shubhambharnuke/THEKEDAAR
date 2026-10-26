# THEKEDAR: Production Operations & Deployment Runbook

**Institutional Resource Booking and Permission Management System**  
*Release Version 1.0.0 Production Standard*

---

## 1. System Overview

THEKEDAR is an institutional control system designed for college campuses to eliminate paper-based facility approvals, prevent double bookings through row-level database locking, issue tamper-evident RSA-PSS signed digital permission letters, and register cryptographic audit proofs to the Ethereum Sepolia testnet.

### Core Architectural Separation
1. **Primary Authority**: The relational PostgreSQL database (`events`, `department_requests`, `permission_letters`) holds canonical authorization state.
2. **Notary Proof**: The Ethereum Sepolia smart contract (`DocumentRegistry.sol`) holds immutable, timestamped SHA-256 document digests. A database approval is immediate; blockchain confirmation completes asynchronously.

---

## 2. Component Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, Lucide | Club portal, Authority approval queue, Public verification tool, Admin console |
| **Backend API** | FastAPI, Python 3.12, Pydantic v2 | Concurrency booking engine, multi-department workflow, PDF generation |
| **Database** | Neon PostgreSQL, SQLAlchemy 2.0, Alembic | Relational state with pessimistic row locks (`with_for_update`) |
| **Document Engine** | ReportLab, Cryptography (RSA-PSS 2048) | Deterministic PDF generation and asymmetric digital signing |
| **Blockchain** | Solidity 0.8.24, Hardhat, Web3.py | Sepolia `DocumentRegistry` smart contract and on-chain hash verification |
| **Authentication** | Better Auth, RS256 JWKS bridge | Unified token verification across Next.js and FastAPI |

---

## 3. Environment Variables Reference

### Backend (`backend/.env` or Render Web Service)

```env
# Application Environment
ENVIRONMENT=production
PROJECT_NAME="THEKEDAR"
VERSION="1.0.0"

# Networking & CORS
API_BASE_URL=https://api.thekedar.campus.edu
NEXT_PUBLIC_APP_URL=https://thekedar.campus.edu
CORS_ALLOWED_ORIGINS=["https://thekedar.campus.edu"]

# Database (Neon PostgreSQL Pooled Connection)
DATABASE_URL=postgresql+psycopg2://<user>:<password>@<neon-pooler-host>/thekedar?sslmode=require

# Better Auth & JWT Bridge
BETTER_AUTH_SECRET=<minimum-32-characters-secret>
BETTER_AUTH_JWKS_URL=https://thekedar.campus.edu/api/auth/jwks
JWT_ALGORITHM=RS256

# Ethereum Sepolia Blockchain
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<api-key>
BLOCKCHAIN_CHAIN_ID=11155111
DOCUMENT_REGISTRY_ADDRESS=0x<deployed-contract-address>
SIGNER_PRIVATE_KEY=<authority-funded-private-key-without-0x>

# Document Storage
STORAGE_DIR=storage/documents
```

### Frontend (`apps/web/.env.production` or Vercel)

```env
NEXT_PUBLIC_APP_URL=https://thekedar.campus.edu
NEXT_PUBLIC_API_URL=https://api.thekedar.campus.edu
BETTER_AUTH_SECRET=<matches-backend-secret>
```

---

## 4. Database Setup & Migrations

### 1. Run Alembic Migrations
To upgrade the schema to latest version:
```bash
python backend/scripts/run_migrations.py
# Or directly via alembic:
cd backend && alembic upgrade head
```

### 2. Seed Master Production Data
Initializes departments, standard venues/labs, and the root institutional administrator:
```bash
python backend/app/database/seed_production.py
```

---

## 5. Smart Contract Deployment to Sepolia

### 1. Compile Contracts
```bash
npm run compile:contracts
```

### 2. Execute Deployment Script
Ensure deployer wallet has Sepolia testnet ETH:
```bash
npx hardhat run contracts/scripts/deploy.ts --network sepolia
```
The script automatically exports the deployed address and ABI to:
- `backend/app/blockchain/artifacts/DocumentRegistry.json`
- `apps/web/lib/contracts/DocumentRegistry.json`

### 3. Verify Contract on Etherscan
```bash
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS>
```

---

## 6. Local Development & Service Execution

### Run Backend
```bash
$env:PYTHONPATH="."
backend\.venv\Scripts\uvicorn backend.app.main:app --reload --port 8000
```
API Documentation available at: `http://localhost:8000/docs`

### Run Frontend
```bash
npm run dev:web
```
Access portal at: `http://localhost:3000`

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
2. SHA-256 Database Hash Match      ──► Checked against PostgreSQL permission_letters table
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

## 8. Launch Checklist Verification (DESIGN.md Sections 11 & 12)

- [x] **Zero Fabricated Metrics**: No placeholder charts, fake user counters, or unproven testimonials.
- [x] **Design Tokens**: Standardized Graphite `#171717`, Paper `#F5F5F2`, Border `#D9D9D4`, Signal Orange `#E86A36`, Geist typography.
- [x] **Conflict Prevention**: Deterministic row-level locking (`with_for_update()`) verified under race-condition tests.
- [x] **Multi-Department Decomposition**: Independent department requests and status aggregation verified.
- [x] **Digital Signatures**: 2048-bit RSA-PSS signing; 1-byte alteration detected and rejected.
- [x] **Public Verification Tool**: Accessible without login at `/verify`.
- [x] **Compliance Pages**: Published `/privacy` and `/terms` with institutional policies.
- [x] **Favicon & Clean Metadata**: Configured with custom SVG mark and OpenGraph metadata.
- [x] **WCAG 2.2 AA Compliance**: Semantic HTML, high-contrast palette, accessible forms and drawer navigation.
