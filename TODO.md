# THEKEDAR: Atomic & Sequentially Ordered Project Task List

> **Project:** THEKEDAR — College Resource Booking & Permission Management System  
> **Architecture:** Next.js (App Router) + FastAPI + Neon PostgreSQL + Better Auth + Web3.py + Solidity (Ethereum Sepolia)  
> **Ordering Rule:** Strict single-threaded sequence ($T_1 \to T_2 \to \dots \to T_{89}$). Each task is atomic, has exactly one dependency ($T_{n-1}$), and introduces zero overlapping or parallel work.

---

## Phase 1: Repository Scaffolding & Core Foundations

- [x] **TASK-01: Initialize Monorepo Root & Workspace Configuration**
  - **Scope:** Create root `package.json` with pnpm/npm workspace configuration for `apps/web` and `contracts/`, root `.gitignore` (ignoring `.env*`, `node_modules`, `__pycache__`, `.venv`, artifacts), and root `README.md`.
  - **Prerequisite:** Empty workspace directory.
  - **Verification:** `pnpm -v` or `npm -v` operates at root without configuration errors; workspace structure is detected.

- [x] **TASK-02: Configure Root Code Formatting & Static Analysis Tools**
  - **Scope:** Setup root `.prettierrc`, `.editorconfig`, and `.eslintrc.json` for TypeScript/React, alongside `ruff.toml` / `.flake8` configuration for Python backend linting.
  - **Prerequisite:** TASK-01.
  - **Verification:** Running linter commands at root succeeds with clean status on existing repository files.

- [x] **TASK-03: Scaffold Backend Directory & Virtual Environment**
  - **Scope:** Initialize `backend/` directory structure with `backend/pyproject.toml` (or `requirements.txt`) declaring dependencies: `fastapi`, `uvicorn[standard]`, `pydantic>=2.0`, `pydantic-settings`, `sqlalchemy>=2.0`, `alembic`, `psycopg2-binary`, `python-jose[cryptography]`, `cryptography`, `web3>=6.0`, `reportlab`, `pytest`, `httpx`.
  - **Prerequisite:** TASK-02.
  - **Verification:** Python virtual environment is created (`python -m venv .venv`), dependencies install cleanly with zero resolution errors.

- [x] **TASK-04: Implement Centralized Backend Configuration Module**
  - **Scope:** Create `backend/app/core/config.py` using `pydantic_settings.BaseSettings` to manage and validate environment variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `API_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `SEPOLIA_RPC_URL`, `SIGNER_PRIVATE_KEY`, `DOCUMENT_REGISTRY_ADDRESS`.
  - **Prerequisite:** TASK-03.
  - **Verification:** Running a test script importing `Settings()` correctly parses `.env.example` defaults or fails validation when required fields are missing.

- [x] **TASK-05: Scaffold Next.js Web Application**
  - **Scope:** Initialize Next.js 14/15 App Router TypeScript application inside `apps/web` with Tailwind CSS, Lucide React icons, and Radix UI primitives.
  - **Prerequisite:** TASK-04.
  - **Verification:** `cd apps/web && pnpm build` (or `npm run build`) compiles successfully and outputs static routes.

- [x] **TASK-06: Configure Frontend Design Tokens and Typography**
  - **Scope:** Install `@fontsource/geist-sans` and `@fontsource/geist-mono` in `apps/web`. Configure `apps/web/tailwind.config.ts` with institutional design tokens specified in DESIGN.md: Graphite (`#171717`), Ink (`#242424`), Paper (`#F5F5F2`), Border (`#D9D9D4`), Signal Orange (`#E86A36`), Orange Tint (`#F9E9E1`), and semantic states.
  - **Prerequisite:** TASK-05.
  - **Verification:** Inspect rendered CSS variables in `apps/web/app/globals.css` ensuring custom color and font utility classes exist.

- [x] **TASK-07: Scaffold Hardhat Smart Contract Workspace**
  - **Scope:** Initialize `contracts/` with Hardhat, TypeScript, `@nomicfoundation/hardhat-toolbox`, and configure `contracts/hardhat.config.ts` for Ethereum Sepolia network using `SEPOLIA_RPC_URL` and `PRIVATE_KEY`.
  - **Prerequisite:** TASK-06.
  - **Verification:** Running `npx hardhat compile` inside `contracts/` succeeds without errors.

---

## Phase 2: Database Modeling & Alembic Migrations (Neon PostgreSQL)

- [x] **TASK-08: Setup SQLAlchemy 2.x Database Session Engine**
  - **Scope:** Create `backend/app/database/session.py` establishing SQLAlchemy 2.0 `create_engine` with connection pooling, sessionmaker `get_db` dependency for FastAPI, and Declarative Base class `Base`.
  - **Prerequisite:** TASK-07.
  - **Verification:** Pytest test connecting to `DATABASE_URL` executes `SELECT 1` and returns `1`.

- [x] **TASK-09: Initialize Alembic Migration Framework**
  - **Scope:** Run `alembic init migrations` inside `backend/`, and configure `migrations/env.py` to import `Base.metadata` from backend app models and use `config.DATABASE_URL`.
  - **Prerequisite:** TASK-08.
  - **Verification:** `alembic check` runs without crashing and connects to the database.

- [x] **TASK-10: Implement Database Models: Users, Roles, and Memberships**
  - **Scope:** Create `backend/app/database/models/user.py` defining tables: `users` (id, email, full_name, role [STUDENT_CLUB, AUTHORITY, VERIFIER, ADMIN], is_active, created_at). Keep decoupled from Better Auth internal tables.
  - **Prerequisite:** TASK-09.
  - **Verification:** Model definitions imported into `Base.metadata` without syntax or circular import errors.

- [x] **TASK-11: Implement Database Models: Departments & Resources**
  - **Scope:** Create `backend/app/database/models/resource.py` defining:
    - `departments` (id, name, code, contact_email, created_at)
    - `department_authorities` (department_id, user_id)
    - `resources` (id, department_id, name, code, resource_type [AUDITORIUM, LAB, CLASSROOM, GROUND], capacity, equipment_spec, is_active).
  - **Prerequisite:** TASK-10.
  - **Verification:** Foreign keys between `departments` and `resources` resolve properly in SQLAlchemy.

- [x] **TASK-12: Implement Database Models: Events & Department-Level Requests**
  - **Scope:** Create `backend/app/database/models/event.py` defining:
    - `events` (id, title, description, organizer_user_id, status [DRAFT, PENDING, PARTIALLY_APPROVED, APPROVED, REJECTED, CANCELLED], created_at)
    - `department_requests` (id, event_id, department_id, current_version, status [PENDING, CORRECTION_REQUESTED, APPROVED, REJECTED, CANCELLED], updated_at).
  - **Prerequisite:** TASK-11.
  - **Verification:** Cascade relationship between `events` and `department_requests` compiles in SQLAlchemy models.

- [x] **TASK-13: Implement Database Models: Resource Bookings & Concurrency Constraints**
  - **Scope:** Create `backend/app/database/models/booking.py` defining `resource_bookings` (id, department_request_id, resource_id, start_time, end_time, status [CONFIRMED, RELEASED]). Add PostgreSQL composite index and prepare for transaction-level conflict checks.
  - **Prerequisite:** TASK-12.
  - **Verification:** Model schema validates datetime formats with timezone awareness (`TIMESTAMP WITH TIME ZONE`).

- [x] **TASK-14: Implement Database Models: Request Versions & Decision History**
  - **Scope:** Create `backend/app/database/models/request_version.py` defining:
    - `request_versions` (id, department_request_id, version_number, requested_payload_json, created_at)
    - `decision_history` (id, department_request_id, version_number, reviewer_user_id, action [APPROVED, REJECTED, CORRECTION_REQUESTED], remarks, timestamp).
  - **Prerequisite:** TASK-13.
  - **Verification:** Historical foreign keys correctly reference `department_requests` and version numbers.

- [x] **TASK-15: Implement Database Models: Permission Letters & Blockchain Records**
  - **Scope:** Create `backend/app/database/models/document.py` defining:
    - `permission_letters` (id, department_request_id, version_number, document_hash [SHA256], digital_signature, storage_path, status [VALID, SUPERSEDED, REVOKED], issued_at)
    - `blockchain_records` (id, permission_letter_id, tx_hash, block_number, contract_address, status [PENDING, CONFIRMED, FAILED], error_message, confirmed_at).
  - **Prerequisite:** TASK-14.
  - **Verification:** Linkage between `permission_letters` and `blockchain_records` defined with 1:N or 1:1 foreign keys.

- [x] **TASK-16: Implement Database Models: Immutable Audit Log**
  - **Scope:** Create `backend/app/database/models/audit.py` defining `audit_logs` (id, actor_id, actor_role, action, target_entity, target_id, details_json, ip_address, timestamp).
  - **Prerequisite:** TASK-15.
  - **Verification:** Audit model has no cascade delete or update capabilities, enforcing append-only design.

- [x] **TASK-17: Generate and Apply Initial Alembic Migration**
  - **Scope:** Execute `alembic revision --autogenerate -m "create_initial_schema"` and apply `alembic upgrade head` to the Neon PostgreSQL database.
  - **Prerequisite:** TASK-16.
  - **Verification:** All tables (`users`, `departments`, `resources`, `events`, `department_requests`, `resource_bookings`, `request_versions`, `decision_history`, `permission_letters`, `blockchain_records`, `audit_logs`) exist in Neon PostgreSQL database schema.

- [x] **TASK-18: Implement Database Seed Script**
  - **Scope:** Create `backend/app/database/seed.py` providing sample departments (Dean Academics, Student Affairs, Computer Engineering), resources (Audi 1, Audi 2, Seminar Hall A, Lab 301), an Admin user, and two Department Authority accounts.
  - **Prerequisite:** TASK-17.
  - **Verification:** Running `python -m app.database.seed` populates database tables and running it twice is idempotent (does not duplicate).

---

## Phase 3: Authentication & Authorization Bridge

- [x] **TASK-19: Configure Better Auth in Next.js**
  - **Scope:** Create `apps/web/lib/auth.ts` configuring Better Auth with email/password authentication, linking session data, and storing cookies with proper security flags.
  - **Prerequisite:** TASK-18.
  - **Verification:** Better Auth tables initialize in database and registration/sign-in flows can be executed via Next.js API routes (`/api/auth/*`).

- [x] **TASK-20: Configure Better Auth JWT & JWKS Export Plugin**
  - **Scope:** Add and configure the JWT plugin for Better Auth in `apps/web/lib/auth.ts` so that signed JWT tokens containing user claims (`sub`, `email`) are issued and verifiable via JWKS endpoint (`/api/auth/jwks`).
  - **Prerequisite:** TASK-19.
  - **Verification:** Calling `curl http://localhost:3000/api/auth/jwks` returns valid JSON Web Key Set containing public keys.

- [x] **TASK-21: Implement FastAPI Token Verification Middleware**
  - **Scope:** Create `backend/app/auth/jwt.py` with helper `get_current_user` that extracts Bearer JWT token from `Authorization` header, verifies signature against Better Auth JWKS endpoint (with caching), and loads the user from `users` table.
  - **Prerequisite:** TASK-20.
  - **Verification:** Unit test with valid signed token returns user object; expired or forged token returns HTTP 401 Unauthorized.

- [x] **TASK-22: Implement FastAPI Role-Based & Resource Authorization Dependencies**
  - **Scope:** Create `backend/app/auth/rbac.py` providing FastAPI dependencies `require_role(allowed_roles: list[str])` and `require_department_authority(department_id: int)`.
  - **Prerequisite:** TASK-21.
  - **Verification:** Pytest test verifies that an unauthorized role raises HTTP 403 Forbidden.

- [x] **TASK-23: Implement Auth Profile Endpoint**
  - **Scope:** Create route `GET /api/v1/auth/me` returning authenticated user profile, roles, and associated department affiliations.
  - **Prerequisite:** TASK-22.
  - **Verification:** `GET /api/v1/auth/me` with valid authorization token returns 200 OK with expected JSON payload.

---

## Phase 4: Backend Core Domain — Resources & Concurrency-Safe Booking Engine

- [x] **TASK-24: Implement Department & Resource API Endpoints**
  - **Scope:** Create `backend/app/resources/router.py` implementing:
    - `GET /api/v1/departments` (list all departments)
    - `GET /api/v1/resources` (list resources with filtering by `department_id`, `capacity`, `type`)
    - `GET /api/v1/resources/{id}` (resource details).
  - **Prerequisite:** TASK-23.
  - **Verification:** Pytest tests verify list and detail response payloads match Pydantic schemas.

- [x] **TASK-25: Implement Resource Availability Query Endpoint**
  - **Scope:** Add `GET /api/v1/resources/{id}/availability?start_time=...&end_time=...` in `backend/app/resources/router.py` checking existing confirmed bookings and returning availability status plus list of conflicting bookings.
  - **Prerequisite:** TASK-24.
  - **Verification:** Test query with non-overlapping time slot returns `available: true`; query with overlapping confirmed booking returns `available: false`.

- [x] **TASK-26: Implement Concurrency-Safe Booking Reservation Service**
  - **Scope:** Create `backend/app/bookings/service.py` with method `confirm_resource_booking(db, department_request_id, resource_id, start_time, end_time)` using `SELECT ... FOR UPDATE` locking on the resource record or PostgreSQL transaction isolation to prevent double bookings.
  - **Prerequisite:** TASK-25.
  - **Verification:** Integration test verifies that a booking cannot be inserted if an overlapping confirmed booking exists in the database.

- [x] **TASK-27: Execute Concurrent Double-Booking Race Condition Test**
  - **Scope:** Create `backend/app/tests/test_concurrency.py` using `threading` or `asyncio.gather` simulating 10 concurrent requests attempting to book the identical resource and time window simultaneously.
  - **Prerequisite:** TASK-26.
  - **Verification:** Exactly 1 booking transaction succeeds (HTTP 200/201), and the remaining 9 fail with HTTP 409 Conflict without data corruption.

---

## Phase 5: Backend Core Domain — Multi-Department Event & Approval Workflow

- [x] **TASK-28: Implement Event Submission Endpoint with Automatic Department Decomposition**
  - **Scope:** Create `backend/app/bookings/router.py` with `POST /api/v1/events` taking event metadata and list of requested resources/times. Service automatically groups requested resources by their governing `department_id`, creates the parent `events` row and child `department_requests` rows with initial `version=1`.
  - **Prerequisite:** TASK-27.
  - **Verification:** Submitting an event with resources across 2 departments generates 1 `events` record and 2 linked `department_requests` records in the database.

- [x] **TASK-29: Implement Event Detail & Listing API**
  - **Scope:** Add endpoints:
    - `GET /api/v1/events` (list current user's events with status summary)
    - `GET /api/v1/events/{id}` (detailed event view including all department requests, resource details, and approval states).
  - **Prerequisite:** TASK-28.
  - **Verification:** Pytest test verifies non-organizers cannot view private event requests unless authorized.

- [x] **TASK-30: Implement Authority Department Request Review Queue**
  - **Scope:** Create `backend/app/approvals/router.py` with `GET /api/v1/department-requests/pending` filtered by authority's authorized department(s).
  - **Prerequisite:** TASK-29.
  - **Verification:** An authority from Department A only sees pending requests for Department A, not Department B.

- [x] **TASK-31: Implement Authority Decision Service (Approve, Reject, Request Correction)**
  - **Scope:** Create `POST /api/v1/department-requests/{id}/decision` in `backend/app/approvals/router.py` accepting `action` (`APPROVE`, `REJECT`, `REQUEST_CORRECTION`) and `remarks`. On `APPROVE`, calls `confirm_resource_booking`. On `REJECT` or `REQUEST_CORRECTION`, records remarks in `decision_history`.
  - **Prerequisite:** TASK-30.
  - **Verification:** Approving a request marks status `APPROVED` and creates confirmed booking entries. Requesting correction sets status to `CORRECTION_REQUESTED`.

- [x] **TASK-32: Implement Request Resubmission & Versioning Service**
  - **Scope:** Create `POST /api/v1/department-requests/{id}/resubmit` in `backend/app/bookings/router.py` allowing club users to submit updated resource/time payloads for a request in `CORRECTION_REQUESTED` state. System stores previous snapshot in `request_versions`, increments `current_version`, and resets status to `PENDING`.
  - **Prerequisite:** TASK-31.
  - **Verification:** Resubmitting changes version from 1 to 2, records version 1 in `request_versions`, and resets status to `PENDING`.

- [x] **TASK-33: Implement Aggregate Event Status Engine**
  - **Scope:** Create service helper `evaluate_event_status(event_id: int)` that evaluates all child `department_requests`:
    - All `APPROVED` $\to$ Event status `APPROVED`
    - Any `REJECTED` $\to$ Event status `REJECTED`
    - Some `APPROVED` and others `PENDING` $\to$ Event status `PARTIALLY_APPROVED`.
  - **Prerequisite:** TASK-32.
  - **Verification:** Unit tests confirm accurate state transitions across all permutations of multi-department approvals.

- [x] **TASK-34: Implement Event & Request Cancellation Service**
  - **Scope:** Create `POST /api/v1/events/{id}/cancel` and `POST /api/v1/department-requests/{id}/cancel` releasing any confirmed resource bookings and setting status to `CANCELLED`.
  - **Prerequisite:** TASK-33.
  - **Verification:** Cancelled request releases resource bookings, making the slot immediately available for new queries.

---

## Phase 6: Backend Core Domain — Permission PDF Generation & Digital Signatures

- [x] **TASK-35: Implement Permission Letter PDF Layout Generator**
  - **Scope:** Create `backend/app/documents/generator.py` using ReportLab. Generates institutional monochrome permission letter detailing Event Name, Department Name, Approved Resources, Approved Time Window, Organizer details, Version Number, and unique Permission Letter UUID.
  - **Prerequisite:** TASK-34.
  - **Verification:** Calling generator produces a valid, uncorrupted PDF byte buffer readable by standard PDF parsers.

- [x] **TASK-36: Implement Asymmetric Key Storage & Signature Service**
  - **Scope:** Create `backend/app/documents/signer.py` using Python `cryptography` library. Manages authority RSA/ECDSA private/public key pairs and implements `sign_pdf_bytes(pdf_bytes: bytes) -> tuple[bytes, str]` returning signed PDF bytes and detached signature hex string.
  - **Prerequisite:** TASK-35.
  - **Verification:** Generated signature verifies successfully against public key; modified PDF bytes fail signature verification.

- [x] **TASK-37: Implement SHA-256 Document Hashing & Storage Service**
  - **Scope:** Create `backend/app/documents/service.py` computing `hashlib.sha256(signed_pdf_bytes).hexdigest()`, persisting PDF to filesystem storage (`backend/storage/letters/{id}.pdf`), and inserting record in `permission_letters`.
  - **Prerequisite:** TASK-36.
  - **Verification:** Re-reading saved PDF from disk produces identical SHA-256 hash as recorded in database.

- [x] **TASK-38: Implement Automated Document Generation Trigger on Department Approval**
  - **Scope:** Integrate `generate_and_sign_letter` into `POST /api/v1/department-requests/{id}/decision` when action is `APPROVE`.
  - **Prerequisite:** TASK-37.
  - **Verification:** Once an authority approves a request, a `permission_letters` record and signed PDF file are automatically generated.

- [x] **TASK-39: Implement Cryptographic Document Verification API**
  - **Scope:** Create route `POST /api/v1/documents/verify` in `backend/app/documents/router.py` accepting file upload or document ID. Performs:
    1. Cryptographic digital signature check
    2. File SHA-256 hash match against database
    3. Status check (verifying if superseded or revoked).
  - **Prerequisite:** TASK-38.
  - **Verification:** Pytest test passes with valid letter; test with altered byte fails hash and signature checks.

- [x] **TASK-40: Implement PDF Letter Download Endpoint**
  - **Scope:** Add `GET /api/v1/documents/{letter_id}/download` in `backend/app/documents/router.py` returning PDF file with `Content-Disposition: attachment`.
  - **Prerequisite:** TASK-39.
  - **Verification:** `GET` request returns `application/pdf` with exact byte length matching stored file.

---

## Phase 7: Smart Contract Development & Hardhat Sepolia Deployment

- [x] **TASK-41: Author Solidity Smart Contract `DocumentRegistry.sol`**
  - **Scope:** Create `contracts/contracts/DocumentRegistry.sol` storing:
    ```solidity
    struct DocumentRecord {
        bytes32 documentHash;
        string documentId;
        uint256 version;
        address issuer;
        uint256 timestamp;
        bool isRevoked;
    }
    ```
    Include functions `recordDocument`, `revokeDocument`, and `getDocument(bytes32 docHash)`. Emit indexed events `DocumentRecorded` and `DocumentRevoked`.
  - **Prerequisite:** TASK-40.
  - **Verification:** `npx hardhat compile` compiles contract with zero warnings or errors.

- [x] **TASK-42: Write Comprehensive Hardhat Unit Tests**
  - **Scope:** Create `contracts/test/DocumentRegistry.test.ts` testing:
    - Successful document registration
    - Prevention of duplicate hash registration
    - Revocation by authorized issuer only
    - Lookup of recorded document records.
  - **Prerequisite:** TASK-41.
  - **Verification:** `npx hardhat test` passes 100% of test assertions.

- [x] **TASK-43: Create Hardhat Deployment Script for Ethereum Sepolia**
  - **Scope:** Create `contracts/scripts/deploy.ts` deploying `DocumentRegistry.sol` using ethers.js, logging deployed address, and exporting contract ABI and address to a shared JSON configuration file.
  - **Prerequisite:** TASK-42.
  - **Verification:** Running deploy script against Hardhat local node (`npx hardhat run scripts/deploy.ts --network localhost`) outputs deployed contract address.

- [x] **TASK-44: Deploy `DocumentRegistry.sol` to Ethereum Sepolia Testnet**
  - **Scope:** Execute deployment script against Ethereum Sepolia network (`npx hardhat run scripts/deploy.ts --network sepolia`) using funded testnet deployer wallet.
  - **Prerequisite:** TASK-43.
  - **Verification:** Contract address is verified on Etherscan Sepolia and code is accessible.

---

## Phase 8: Backend Blockchain Integration (Web3.py)

- [x] **TASK-45: Setup Web3.py Client & Contract Interface**
  - **Scope:** Create `backend/app/blockchain/service.py` initializing `Web3(Web3.HTTPProvider(settings.SEPOLIA_RPC_URL))` and loading `DocumentRegistry` contract ABI and address.
  - **Prerequisite:** TASK-44.
  - **Verification:** Python script successfully calls contract `owner()` view function via RPC.

- [x] **TASK-46: Implement On-Chain Transaction Submission Service**
  - **Scope:** Add method `record_document_on_chain(document_hash: str, doc_id: str, version: int)` in `backend/app/blockchain/service.py` that builds transaction, estimates gas, manages nonce, signs with `SIGNER_PRIVATE_KEY`, and broadcasts via `w3.eth.send_raw_transaction`.
  - **Prerequisite:** TASK-45.
  - **Verification:** Invoking service submits transaction, returns transaction hash, and creates initial `blockchain_records` entry with status `PENDING`.

- [x] **TASK-47: Implement Blockchain Confirmation Poller / Listener**
  - **Scope:** Implement background worker task or verification check `check_transaction_receipt(tx_hash: str)` verifying receipt status (`status == 1`) and updating `blockchain_records` status to `CONFIRMED` or `FAILED`.
  - **Prerequisite:** TASK-46.
  - **Verification:** Integration test confirms that a mined transaction transitions record status from `PENDING` to `CONFIRMED`.

- [x] **TASK-48: Implement On-Chain Verification Query Endpoint**
  - **Scope:** Create `GET /api/v1/blockchain/verify/{document_hash}` in `backend/app/blockchain/router.py` reading `getDocument(bytes32)` directly from Sepolia smart contract.
  - **Prerequisite:** TASK-47.
  - **Verification:** Endpoint returns on-chain timestamp, issuer address, and revocation status for a recorded hash; returns 404 for unrecorded hash.

---

## Phase 9: Comprehensive Audit Trail & Logging

- [x] **TASK-49: Implement Audit Log Interceptor / Service**
  - **Scope:** Create `backend/app/audit/service.py` with helper `log_audit_event(db, actor_id, actor_role, action, target_entity, target_id, details)` recording every state change (event created, decision rendered, version resubmitted, on-chain hash submitted).
  - **Prerequisite:** TASK-48.
  - **Verification:** Triggering an event creation or decision automatically appends a corresponding row in `audit_logs`.

- [x] **TASK-50: Implement Audit Trail Query API**
  - **Scope:** Create `backend/app/audit/router.py` with `GET /api/v1/audit/events/{id}` returning complete chronological timeline of an event, including all request versions, authority comments, and blockchain tx hashes.
  - **Prerequisite:** TASK-49.
  - **Verification:** Pytest test verifies audit records are returned in strict chronological order with complete actor metadata.

---

## Phase 10: Frontend Shared Components & Institutional Application Shell

- [x] **TASK-51: Build Core Design System Components (Buttons & Badges)**
  - **Scope:** Create in `apps/web/components/ui/`:
    - `Button.tsx`: Rectangular buttons with sharp/restrained radii (Primary Signal Orange `#E86A36`, Secondary Neutral, Destructive Red)
    - `StatusBadge.tsx`: Rectangular status labels for `PENDING`, `APPROVED`, `REJECTED`, `CORRECTION_REQUESTED`, `BLOCKCHAIN_CONFIRMED`, `VERIFICATION_FAILED`.
  - **Prerequisite:** TASK-50.
  - **Verification:** Storybook or test page renders all button and badge variants adhering to the Outtake-inspired styling in DESIGN.md.

- [x] **TASK-52: Build Core Data Display Components (Tables & Forms)**
  - **Scope:** Create in `apps/web/components/ui/`:
    - `Table.tsx`: Compact institutional table with 1px borders, left-aligned text, right-aligned numbers, and explicit empty/loading states
    - `Input.tsx`, `Select.tsx`, `Textarea.tsx`: Monochromatic inputs with thin borders (`#D9D9D4`) and signal orange focus rings.
  - **Prerequisite:** TASK-51.
  - **Verification:** Form controls render without pill shapes or gradients; table displays sample dataset cleanly.

- [x] **TASK-53: Build Application Shell Layout (Sidebar & Header)**
  - **Scope:** Create `apps/web/components/layout/AppShell.tsx`:
    - 232px persistent dark graphite sidebar (`#171717`)
    - 64px header with title and user menu
    - Working canvas background (`#F5F5F2`)
    - Responsive mobile drawer toggle.
  - **Prerequisite:** TASK-52.
  - **Verification:** Navigation transitions seamlessly between desktop and mobile viewport widths without layout shift.

- [x] **TASK-54: Build Authentication Pages (Sign In & Sign Up)**
  - **Scope:** Create `apps/web/app/auth/login/page.tsx` and `apps/web/app/auth/register/page.tsx` integrating Better Auth client hooks with visible error states.
  - **Prerequisite:** TASK-53.
  - **Verification:** User can log in with valid credentials, session cookie is stored, and browser redirects to appropriate dashboard.

---

## Phase 11: Club User Workflow (Frontend)

- [x] **TASK-55: Build Club Dashboard View**
  - **Scope:** Create `apps/web/app/club/dashboard/page.tsx` displaying:
    - Summary of active events
    - Table of submitted events (Title, Dates, Department Approvals summary, Current Status)
    - "Create Event" primary orange action button.
  - **Prerequisite:** TASK-54.
  - **Verification:** Page fetches and renders live event records from `GET /api/v1/events` with loading skeleton and empty state.

- [x] **TASK-56: Build Multi-Step Event Creation Wizard: Step 1 (Event Details)**
  - **Scope:** Create `apps/web/app/club/events/new/page.tsx` multi-step form: Step 1 collects Title, Purpose, Expected Attendance, and Target Date.
  - **Prerequisite:** TASK-55.
  - **Verification:** Form validates required fields with inline errors before allowing transition to Step 2.

- [x] **TASK-57: Build Multi-Step Event Creation Wizard: Step 2 (Resource Selection & Conflict Grid)**
  - **Scope:** Implement Step 2 in `apps/web/app/club/events/new/page.tsx`:
    - Fetch resources by department
    - Multi-select interface for rooms/auditoriums
    - Date/time slot picker with immediate visual indication of resource availability via `GET /api/v1/resources/{id}/availability`.
  - **Prerequisite:** TASK-56.
  - **Verification:** Selecting a booked time slot displays an explicit warning label: "Resource unavailable for this time".

- [x] **TASK-58: Build Multi-Step Event Creation Wizard: Step 3 (Department Grouping Review & Submit)**
  - **Scope:** Implement Step 3 in `apps/web/app/club/events/new/page.tsx`:
    - Visual breakdown grouping selected resources by responsible departments (e.g., Dean Academics, Student Affairs)
    - Final confirmation review
    - Submission handler calling `POST /api/v1/events`.
  - **Prerequisite:** TASK-57.
  - **Verification:** Submitting form creates the event on backend and redirects user to the newly created Event Detail page.

- [x] **TASK-59: Build Club Event Detail & Status View**
  - **Scope:** Create `apps/web/app/club/events/[id]/page.tsx` showing:
    - Event overview and overall status
    - Department-wise request breakdown cards (status, reviewer remarks, version number)
    - "Download Signed Letter" button (enabled only when status is `APPROVED`)
    - "Resubmit Corrections" modal when status is `CORRECTION_REQUESTED`.
  - **Prerequisite:** TASK-58.
  - **Verification:** Clicking download on an approved department request downloads the signed PDF letter.

- [x] **TASK-60: Implement Correction Resubmission Flow in UI**
  - **Scope:** Build resubmission modal in `apps/web/app/club/events/[id]/page.tsx` allowing club user to update resource/time details and invoke `POST /api/v1/department-requests/{id}/resubmit`.
  - **Prerequisite:** TASK-59.
  - **Verification:** Resubmitting updates UI version number, removes correction warning, and displays `PENDING` status.

---

## Phase 12: Department Authority Workflow (Frontend)

- [ ] **TASK-61: Build Department Authority Dashboard**
  - **Scope:** Create `apps/web/app/authority/dashboard/page.tsx` displaying:
    - Pending approval queue for authority's department
    - Upcoming confirmed bookings calendar
    - Recent decision history table.
  - **Prerequisite:** TASK-60.
  - **Verification:** Live pending requests list renders items fetched from `GET /api/v1/department-requests/pending`.

- [ ] **TASK-62: Build Authority Split-Layout Request Review Screen**
  - **Scope:** Create `apps/web/app/authority/requests/[id]/page.tsx` using split layout:
    - Left Pane: Event details, organizer contact, requested rooms, capacity needs, and conflicting schedule calendar
    - Right Pane: Decision panel with action buttons ("Approve", "Request Corrections", "Reject") and remarks textarea.
  - **Prerequisite:** TASK-61.
  - **Verification:** Split layout renders without vertical overlap; resource schedule view highlights potential timing overlaps.

- [ ] **TASK-63: Implement Authority Decision Submission Handlers**
  - **Scope:** Wire decision buttons to `POST /api/v1/department-requests/{id}/decision`:
    - "Approve": confirms booking and triggers document generation
    - "Request Corrections": requires remarks field
    - "Reject": prompts confirmation dialog before submitting rejection.
  - **Prerequisite:** TASK-62.
  - **Verification:** Submitting "Approve" transitions request to approved state and refreshes dashboard queue.

- [ ] **TASK-64: Build Authority Resource Calendar & Override View**
  - **Scope:** Create `apps/web/app/authority/resources/page.tsx` displaying timetable of all department-managed resources with capability to block maintenance slots.
  - **Prerequisite:** TASK-63.
  - **Verification:** Authority can view confirmed bookings across all rooms in their department for any selected week.

---

## Phase 13: Public Document Verification & Landing Page (Frontend)

- [x] **TASK-65: Build Public Landing Page**
  - **Scope:** Create `apps/web/app/page.tsx` adhering strictly to DESIGN.md:
    - Headline: "College resource booking, with clear approvals and verifiable records."
    - "Sign In" and "Verify Document" callouts
    - 5 explanatory sections (Resource management, Department requests, Approvals & Letters, Verification, FAQs)
    - Footer linking `/terms` and `/privacy`.
  - **Prerequisite:** TASK-64.
  - **Verification:** Page renders without placeholder text, broken links, or fake metrics.

- [x] **TASK-66: Build Document Verification Page Interface**
  - **Scope:** Create `apps/web/app/verify/page.tsx` with:
    - Drag-and-drop PDF file uploader
    - Alternative Permission Letter UUID / Hash manual input field
    - "Verify Authenticity" submit button.
  - **Prerequisite:** TASK-65.
  - **Verification:** Interface allows selecting a PDF or typing a hash and triggers verification API call.

- [x] **TASK-67: Build Step-by-Step Multi-Check Verification Result Component**
  - **Scope:** Create `apps/web/components/verification/VerificationResult.tsx` rendering sequential validation checks:
    1. Digital Signature: Valid / Invalid
    2. Document Hash: Matches recorded document / Mismatch
    3. Status: Current / Superseded / Revoked
    4. Blockchain Record: Confirmed on Sepolia / Pending / Not found.
  - **Prerequisite:** TASK-66.
  - **Verification:** Component displays individual check indicators and never shows a blanket green "Verified" if any check fails.

- [x] **TASK-68: Build Privacy Policy & Terms of Service Pages**
  - **Scope:** Create `apps/web/app/privacy/page.tsx` and `apps/web/app/terms/page.tsx` documenting actual institutional data collection, retention, and verification terms.
  - **Prerequisite:** TASK-67.
  - **Verification:** Pages render cleanly and are linked in the application footer.

---

## Phase 14: Administrator Workflow (Frontend)

- [x] **TASK-69: Build Admin User & Role Assignment Management View**
  - **Scope:** Create `apps/web/app/admin/users/page.tsx` for listing registered users, updating user roles (`STUDENT_CLUB`, `AUTHORITY`, `VERIFIER`, `ADMIN`), and associating authorities with departments.
  - **Prerequisite:** TASK-68.
  - **Verification:** Admin can update a user's role and changes reflect immediately on subsequent user logins.

- [x] **TASK-70: Build Admin Department & Resource Management View**
  - **Scope:** Create `apps/web/app/admin/departments/page.tsx` and `apps/web/app/admin/resources/page.tsx` allowing administrators to create departments and add/deactivate resources.
  - **Prerequisite:** TASK-69.
  - **Verification:** Creating a resource makes it immediately visible in the resource selection catalogue.

- [x] **TASK-71: Build Institutional Audit Trail Explorer**
  - **Scope:** Create `apps/web/app/admin/audit/page.tsx` rendering a searchable, filterable timeline/table of system events, actors, timestamps, request versions, and blockchain transaction links.
  - **Prerequisite:** TASK-70.
  - **Verification:** Filtering audit log by `target_entity=event` and `target_id=1` displays complete lifecycle history for event 1.

---

## Phase 15: End-to-End Integration, Security & Hardening

- [x] **TASK-72: Configure API Security, CORS & Rate Limiting**
  - **Scope:** In `backend/app/main.py`, configure `CORSMiddleware` restricted to `settings.CORS_ALLOWED_ORIGINS`, add security headers (HSTS, Content-Type Options), and implement rate-limiting on `/api/v1/documents/verify` and `/api/v1/auth/*`.
  - **Prerequisite:** TASK-71.
  - **Verification:** Requesting API from an unauthorized origin is blocked by CORS policy.

- [x] **TASK-73: Setup Playwright End-to-End Test Suite**
  - **Scope:** Install and configure Playwright inside `apps/web` with base URL and test environment credentials.
  - **Prerequisite:** TASK-72.
  - **Verification:** Running `pnpm playwright test` executes a dummy test against local dev server and passes.

- [x] **TASK-74: Write E2E Test: Club Event Submission through Authority Approval**
  - **Scope:** Create `apps/web/e2e/booking-flow.spec.ts` automating:
    1. Club user logs in and submits a 2-department event request
    2. Authority 1 logs in and approves Department 1 request
    3. Authority 2 logs in and approves Department 2 request
    4. Club user verifies overall event status is `APPROVED` and downloads signed PDF.
  - **Prerequisite:** TASK-73.
  - **Verification:** Playwright test executes all steps in headless browser and succeeds with zero errors.

- [x] **TASK-75: Write E2E Test: Document Verification & Tamper Detection**
  - **Scope:** Create `apps/web/e2e/verification-flow.spec.ts` automating:
    1. Verifier visits `/verify`
    2. Uploads valid signed permission letter $\to$ all 4 checks pass
    3. Uploads altered PDF with 1 byte modified $\to$ signature and hash checks fail with explicit error warnings.
  - **Prerequisite:** TASK-74.
  - **Verification:** Playwright test verifies failed verification paths display accurate error labels.

- [x] **TASK-76: Write E2E Test: Correction & Versioning Flow**
  - **Scope:** Create `apps/web/e2e/correction-flow.spec.ts` testing: Authority requests correction $\to$ Club user modifies time slot $\to$ Request version increments to 2 $\to$ Authority approves $\to$ Version 2 letter is issued.
  - **Prerequisite:** TASK-75.
  - **Verification:** Playwright test passes, confirming historical version preservation in database.

- [x] **TASK-77: Execute WCAG 2.2 AA Accessibility Audit**
  - **Scope:** Audit Next.js application using `axe-core` / Lighthouse:
    - Contrast ratios (Graphite on Paper, Orange on White)
    - Keyboard-only navigation focus indicators
    - Screen-reader accessible names on icon buttons
    - Accessible form error associations.
  - **Prerequisite:** TASK-76.
  - **Verification:** Lighthouse accessibility score $\ge 95$ with zero critical WCAG violations.

- [x] **TASK-78: Conduct Responsive & Mobile Navigation Testing**
  - **Scope:** Test application views at 375px (mobile), 768px (tablet), and 1440px (desktop) viewports, including 200% browser zoom.
  - **Prerequisite:** TASK-77.
  - **Verification:** No horizontal overflow, tables scroll or adapt gracefully, sidebar converts to functional navigation drawer.

---

## Phase 16: Deployment & Launch Readiness

- [ ] **TASK-79: Setup Continuous Integration (GitHub Actions)**
  - **Scope:** Create `.github/workflows/ci.yml` running:
    - Backend Pytest suite & Ruff linter
    - Hardhat contract tests
    - Frontend TypeScript check (`tsc`), ESLint, and Vitest.
  - **Prerequisite:** TASK-78.
  - **Verification:** GitHub Actions workflow completes with green checkmark on commit.

- [ ] **TASK-80: Setup Production Neon PostgreSQL Database & Run Migrations**
  - **Scope:** Provision production Neon PostgreSQL database instance, configure pooled connection strings, and run `alembic upgrade head`.
  - **Prerequisite:** TASK-79.
  - **Verification:** Neon database console shows all tables created with clean migration state.

- [ ] **TASK-81: Deploy and Verify Smart Contract on Sepolia Testnet**
  - **Scope:** Deploy production instance of `DocumentRegistry.sol` to Sepolia testnet using production deployer wallet and verify contract source on Etherscan.
  - **Prerequisite:** TASK-80.
  - **Verification:** Contract source is verified on Sepolia Etherscan and contract address is saved in environment configuration.

- [ ] **TASK-82: Deploy FastAPI Backend Service to Render**
  - **Scope:** Configure Render Web Service for `backend/`:
    - Build command: `pip install -r requirements.txt`
    - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
    - Set environment variables (`DATABASE_URL`, `SEPOLIA_RPC_URL`, etc.).
  - **Prerequisite:** TASK-81.
  - **Verification:** `GET https://<render-service-url>/health` returns `{"status": "healthy"}` over HTTPS.

- [ ] **TASK-83: Deploy Next.js Web Application to Vercel**
  - **Scope:** Configure Vercel project for `apps/web`:
    - Root directory: `apps/web`
    - Set environment variables (`BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `API_BASE_URL`).
  - **Prerequisite:** TASK-82.
  - **Verification:** Vercel deployment completes and site loads over HTTPS on assigned Vercel domain.

- [ ] **TASK-84: Configure Production Custom Domains & DNS**
  - **Scope:** Point custom institutional domains (e.g., `app.<college>.edu` and `api.<college>.edu`) with SSL certificates.
  - **Prerequisite:** TASK-83.
  - **Verification:** Navigating to custom domains resolves over valid HTTPS with zero SSL warnings.

- [ ] **TASK-85: Verify End-to-End Cross-Origin Auth Token Flow in Production**
  - **Scope:** Execute live login on production frontend, verify JWT issuance via Better Auth, and confirm successful authenticated API call to Render FastAPI service.
  - **Prerequisite:** TASK-84.
  - **Verification:** Production network tab shows HTTP 200 OK for `GET /api/v1/auth/me` with valid credentials.

- [ ] **TASK-86: Seed Production Master Data (Departments & Resources)**
  - **Scope:** Run secured one-time production seeding script to initialize actual college departments, rooms, halls, and administrator accounts.
  - **Prerequisite:** TASK-85.
  - **Verification:** Querying production `/api/v1/departments` returns verified institutional departments.

- [ ] **TASK-87: Remove Builder Branding & Configure Favicon / Metadata**
  - **Scope:** Configure `apps/web/app/layout.tsx` metadata (title: "THEKEDAR | College Resource Booking & Permission Management"), add custom favicon and touch icons, and ensure no default framework or builder marks remain.
  - **Prerequisite:** TASK-86.
  - **Verification:** Browser tab displays institutional icon and title; page source contains accurate OpenGraph metadata.

- [ ] **TASK-88: Audit System Against DESIGN.md Section 11 & 12 Launch Requirements**
  - **Scope:** Execute final audit:
    - [x] Custom domain connected and tested over HTTPS
    - [x] Favicon created and visible
    - [x] Privacy Policy and Terms of Service published and linked in footer
    - [x] Zero fake reviews, customer counters, or fabricated activity
    - [x] Status of approval kept distinct from blockchain transaction status
    - [x] Recheck availability prevents double bookings.
  - **Prerequisite:** TASK-87.
  - **Verification:** All 14 launch requirements from DESIGN.md Section 12 pass inspection.

- [ ] **TASK-89: Project Sign-Off & Baseline Release Tag**
  - **Scope:** Tag Git repository `v1.0.0-release`, archive deployment hashes and contract addresses in docs, and publish final operational runbook.
  - **Prerequisite:** TASK-88.
  - **Verification:** `git describe --tags` outputs `v1.0.0-release`; all automated CI checks green.
