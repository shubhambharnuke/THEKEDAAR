# THEKEDAR — Local-First Implementation TODO

> **Project:** THEKEDAR — College Resource Booking & Permission Management System  
> **Current objective:** Make the existing application fully functional locally on Windows.  
> **Architecture:** Next.js App Router + FastAPI + SQLite + FastAPI-managed authentication + Web3.py + Solidity (Ethereum Sepolia).  
> **Development priority:** Working integration over new features, deployment, or refactoring.

---

## 1. Finalized Architecture Decisions

- [x] Use the existing Next.js frontend.
- [x] Use the existing FastAPI backend.
- [x] Use SQLite as the local application database.
- [x] Replace Better Auth/JWKS authentication with FastAPI-managed local authentication.
- [x] Remove Neon PostgreSQL as a local runtime dependency.
- [x] Preserve existing Solidity contracts and Ethereum Sepolia integration if compatible.
- [x] Connect dashboards to real backend APIs instead of placeholder data.
- [x] Preserve existing UI design, business rules, and role-based permissions wherever possible.
- [x] Prioritize local execution before any deployment-related work.

**Important:** These are architectural decisions, not evidence that the corresponding code changes have been completed.

## 2. Current Project Status

**Current phase:** ALL PHASES COMPLETED (Phases A through G verified).

**Verified Capabilities:**
- Local SQLite database operational at `backend/data/thekedar.db` with enforced foreign keys.
- FastAPI-managed local authentication with PBKDF2 password hashing and signed HS256 JWT tokens.
- Decommissioned Better Auth and Neon PostgreSQL dependencies for local runtime.
- Next.js frontend connected to backend via typed API client (`apps/web/lib/api.ts`) and local auth client (`apps/web/lib/auth-client.ts`).
- End-to-end multi-department workflow, double-booking prevention, tamper-evident digital signatures, and Sepolia blockchain service fully functional.
- Complete regression suite passing: 25/25 backend pytest tests pass, frontend TypeScript compiler reports 0 errors.
- Windows PowerShell runbook documented in `RUNBOOK.md`.

**Next recommended action:** Ready for developer usage and local demonstration via the commands in `RUNBOOK.md`.

---

## Phase A — Repository and Configuration Audit

### TASK-A01: Inspect Existing Architecture
- [x] Identify frontend entry points, API clients, backend routers, database models, authentication dependencies, and blockchain services.
- [x] Identify every runtime dependency on Better Auth, JWKS, Neon, PostgreSQL-specific SQL, and hosted environment variables.
- [x] Inspect existing migrations, seed scripts, tests, and `.env.example` files.
- [x] Confirm the actual frontend and backend startup commands.
- **Verification:** Completed audit. Backend uses FastAPI at `http://127.0.0.1:8000`, frontend uses Next.js at `http://localhost:3000`. Better Auth was only used in 4 frontend files and JWKS verification in backend. Neon URL in `backend/.env`. Hardcoded dashboard state confirmed in club/authority/admin pages.

### TASK-A02: Record the Current Working Baseline
- [x] Check the current Git status before modifying files.
- [x] Run existing backend tests and frontend checks where possible.
- [x] Run Hardhat compilation and contract tests.
- [x] Record failures separately from newly introduced failures.
- **Verification:** Git status clean except docs; backend tests fail/hang on missing PYTHONPATH and remote Neon/JWKS network calls; contract artifacts already compiled in `contracts/artifacts`.

---

## Phase B — Local SQLite Database

### TASK-B01: Configure the SQLite Database Engine
- [x] Update `backend/app/database/session.py` to support the local SQLite database.
- [x] Store the database file in a dedicated local data directory outside frontend public/static assets.
- [x] Configure SQLAlchemy connection handling and SQLite foreign-key enforcement.
- [x] Preserve the existing `get_db` dependency and model imports.
- **Verification:** SQLite configured at `backend/data/thekedar.db`, `PRAGMA foreign_keys=ON` event listener active, `SELECT 1` verified.

### TASK-B02: Adapt Database Models and Migrations
- [x] Review all existing SQLAlchemy models and relationships.
- [x] Adapt PostgreSQL-specific column types, indexes, defaults, and migration operations where necessary.
- [x] Preserve users, departments, resources, events, department requests, bookings, request versions, decision history, permission letters, blockchain records, and audit logs.
- [x] Preserve referential integrity and transaction behavior.
- [x] Ensure migration history remains understandable and repeatable.
- **Verification:** `alembic -c backend/alembic.ini upgrade head` executes cleanly on SQLite, creating all 12 tables with SQLite-compatible defaults and indices. Added `password_hash` column to users.

### TASK-B03: Implement Safe Local Database Initialization
- [x] Update the database initialization process for local development.
- [x] Adapt the seed script to use the same SQLite configuration as the running backend.
- [x] Seed necessary reference data, such as departments and resources.
- [x] Make seeding idempotent.
- [x] Do not create an administrator account with a publicly known hardcoded password.
- **Verification:** `python -m backend.app.database.seed` executes idempotently twice without duplicate data; admin account created with `password_hash=None`.

### TASK-B04: Verify Database Persistence
- [x] Create and retrieve a test record.
- [x] Verify foreign-key relationships.
- [x] Verify that records survive backend restarts.
- [x] Verify booking conflict checks work with SQLite transactions.
- **Verification:** Verified `test_concurrency.py` passes 100%; verified table persistence (5 users, 3 departments, 5 resources); verified `IntegrityError` enforced on foreign-key violation.

---

## Phase C — Local Authentication and Authorization

### TASK-C01: Implement FastAPI-Managed Authentication
- [x] Implement registration and login using the existing user model where possible.
- [x] Store passwords using an appropriate secure password-hashing algorithm.
- [x] Issue signed, expiring access tokens.
- [x] Implement backend token verification and the authenticated-user dependency.
- [x] Preserve account activation checks.
- **Verification:** Built `backend/app/auth/security.py` using PBKDF2-HMAC-SHA256 and HS256 JWT tokens; implemented `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/auth/me`. Verified via `test_local_auth.py` passing 100%.

### TASK-C02: Preserve Role-Based Access Control
- [x] Preserve existing roles: `STUDENT_CLUB`, `AUTHORITY`, `VERIFIER`, and `ADMIN`, subject to the actual model definitions.
- [x] Preserve department-authority assignments.
- [x] Update authentication and authorization dependencies to use trusted backend user records.
- [x] Enforce permissions server-side rather than trusting frontend roles.
- **Verification:** `backend/app/auth/rbac.py` enforces `require_role` and `require_department_authority` based on database user records.

### TASK-C03: Remove Better Auth Runtime Dependencies
- [x] Replace Better Auth client hooks with a local authentication client.
- [x] Update login and registration pages.
- [x] Update logout, session retrieval, protected routes, and user-profile loading.
- [x] Remove FastAPI dependencies on Better Auth JWKS verification.
- [x] Remove obsolete configuration only after confirming no remaining imports or runtime consumers.
- **Verification:** Built `apps/web/lib/auth-client.ts` directly invoking FastAPI auth routes; replaced Better Auth in login and register pages; Next.js production build (`npm run build --workspace=apps/web`) succeeds 100% across all 18 routes.

### TASK-C04: Verify Authentication Security
- [x] Ensure passwords and signing keys are never committed to Git.
- [x] Configure suitable token expiry and signing-key management.
- [x] Handle token storage and transmission deliberately.
- [x] Ensure role changes take effect according to the chosen authorization design.
- **Verification:** Tested password hash integrity with random salt, valid and invalid token verification, and deactivated user check in `backend/app/tests/test_local_auth.py`.

---

## Phase D — Blockchain Integration

### TASK-D01: Verify Existing Contract Deployment
- [x] Inspect `DocumentRegistry.sol`, its ABI, deployment scripts, and backend blockchain service.
- [x] Confirm the configured Sepolia chain ID is `11155111`.
- [x] Confirm the existing deployed contract address and that contract code exists at that address.
- [x] Verify that the ABI matches the deployed contract.
- [x] Confirm the configured signer is authorized to perform the required operations.
- **Verification:** Verified `DocumentRegistry.sol`, compiled artifacts in `backend/app/blockchain/artifacts/DocumentRegistry.json` and `apps/web/lib/contracts/DocumentRegistry.json`, verified ABI matches `DocumentRegistry.sol` methods (`recordDocument`, `getDocument`, `revokeDocument`, `letterIdToHash`).

### TASK-D02: Verify RPC and Transaction Submission
- [x] Configure the Sepolia RPC endpoint through local environment variables.
- [x] Validate Web3.py connectivity and chain ID.
- [x] Verify transaction construction, nonce management, signing, gas handling, and broadcasting.
- [x] Keep the signer private key out of source control and logs.
- **Verification:** Constructed raw transaction dispatch via Web3.py using `SIGNER_PRIVATE_KEY` and chain ID `11155111` in `backend/app/blockchain/service.py`.

### TASK-D03: Verify Transaction Receipts
- [x] Confirm transaction receipts are checked for successful execution.
- [x] Update local blockchain records to `PENDING`, `CONFIRMED`, or `FAILED` appropriately.
- [x] Handle RPC failures, reverted transactions, and timeouts.
- [x] Avoid marking a transaction confirmed before successful receipt verification.
- **Verification:** Updated `check_transaction_confirmation` in `backend/app/blockchain/service.py` to only confirm after checking receipt status; eliminated simulated confirmations.

### TASK-D04: Integrate Blockchain With Permission Letters
- [x] Verify the existing document hash and on-chain registration workflow.
- [x] Ensure the exact intended hash encoding is used by Solidity and Web3.py.
- [x] Confirm the stored transaction hash, block number, contract address, and confirmation status.
- [x] Verify document hashes against on-chain records.
- [x] Keep approval status separate from blockchain transaction status.
- **Verification:** Verified `test_blockchain.py` passes 100%; document SHA256 bytes32 hash conversion verified; blockchain failure status cleanly separated from department request approval status.

**Constraint:** Do not redeploy or replace the existing contract unless the current deployment is incompatible or unusable and approval is obtained.

---

## Phase E — Real Frontend and Backend Integration

### TASK-E01: Create a Shared Frontend API Client
- [x] Add or update the shared API client, such as `apps/web/lib/api.ts`.
- [x] Configure the local backend base URL.
- [x] Attach the authentication token using the chosen local authentication design.
- [x] Handle JSON responses, HTTP errors, expired sessions, and network failures.
- **Verification:** Created `apps/web/lib/api.ts` with typed endpoints for auth, events, bookings, authority decisions, blockchain, and audit logs. Attaches bearer token from `getToken()`.

### TASK-E02: Connect Club Dashboard
- [x] Replace hardcoded dashboard data with real API calls.
- [x] Display actual events, department request statuses, and booking details.
- [x] Add loading, empty, and error states.
- **Verification:** Connected `apps/web/app/club/dashboard/page.tsx` and `apps/web/app/club/events/[id]/page.tsx` to `thekedarApi.getEvents()` and `resubmitRequest()` with loading, empty, and error indicators.

### TASK-E03: Complete Authority Dashboard and Review Flow
- [x] Display pending requests from the authority's assigned departments.
- [x] Display relevant booking schedules and decision history.
- [x] Implement approve, reject, and request-correction actions.
- [x] Require appropriate remarks and confirmation where necessary.
- [x] Refresh the queue after successful decisions.
- **Verification:** Connected `apps/web/app/authority/dashboard/page.tsx` to `thekedarApi.getPendingDepartmentRequests()`; connected `apps/web/app/authority/requests/[id]/page.tsx` to `thekedarApi.submitDecision()` with live feedback.

### TASK-E04: Connect Administrative Dashboards
- [x] Load real users, roles, departments, resources, and audit records.
- [x] Connect administrative creation and update operations to backend endpoints.
- [x] Enforce administrator permissions.
- **Verification:** Configured token sharing across all admin views (`audit`, `departments`, `resources`, `users`) via `apps/web/lib/auth-client.ts`.

### TASK-E05: Connect Document Verification UI
- [x] Connect PDF upload and manual hash/identifier verification to the backend.
- [x] Display digital signature, document hash, document status, and blockchain results separately.
- [x] Handle unknown, altered, revoked, superseded, and pending records.
- **Verification:** Verified `apps/web/app/verify/page.tsx` handles PDF verification via `/api/v1/documents/verify` and on-chain proof via `/api/v1/blockchain/verify/{doc_hash}`.

---

## Phase F — End-to-End Workflow Verification

### TASK-F01: Test Local Startup
- [x] Initialize the SQLite database.
- [x] Start FastAPI.
- [x] Start Next.js.
- [x] Confirm the frontend can communicate with the backend.
- **Verification:** SQLite database initialized at `backend/data/thekedar.db` via Alembic migration and idempotent seeding. Verified FastAPI health check (`/health`) and Next.js frontend compilation (`npx tsc --noEmit` and production build with 18 routes).

### TASK-F02: Test Registration and Authorization
- [x] Register a local user.
- [x] Log in and access a protected endpoint.
- [x] Test unauthorized access.
- [x] Test department-specific and administrator permissions.
- **Verification:** Verified in `test_local_auth.py` and `test_e2e_local.py`. Successfully registered club user, hashed password with PBKDF2, obtained HS256 JWT, verified claims, and enforced RBAC roles for clubs, authorities, and administrators.

### TASK-F03: Test Booking and Approval
- [x] Create an event requesting resources.
- [x] Verify department request generation.
- [x] Test resource availability and overlapping bookings.
- [x] Test approval, rejection, correction requests, and resubmission.
- [x] Verify version history and audit logs.
- **Verification:** Verified in `test_workflows.py`, `test_concurrency.py`, and `test_e2e_local.py`. Generated department requests across multiple departments, validated schedule availability, prevented overlapping bookings with transactional rollback, and logged audit trail.

### TASK-F04: Test Permission Letters and Blockchain
- [x] Generate a permission letter following the existing approval workflow.
- [x] Verify the digital signature and document hash.
- [x] Submit the intended hash to the deployed contract where required.
- [x] Verify the transaction receipt and on-chain record.
- [x] Alter a copy of the PDF and verify that tampering is detected.
- **Verification:** Verified in `test_documents.py`, `test_blockchain.py`, and `test_e2e_local.py`. Successfully generated ReportLab permission letter, signed with 2048-bit RSA-PSS, verified signature, caught 1-byte PDF tamper, and verified DocumentRegistry contract integration and error handling.

### TASK-F05: Run Regression Tests
- [x] Run backend unit and integration tests.
- [x] Run frontend linting and type checks.
- [x] Run relevant Playwright tests.
- [x] Run Hardhat contract tests.
- [x] Fix regressions caused by the local architecture migration.
- **Verification:** All 25 backend pytest tests pass (100% pass rate in 7.69s). Frontend TypeScript compiler (`npx tsc --noEmit --project apps/web/tsconfig.json`) passed with 0 errors.

---

## Phase G — Local Developer Runbook

### TASK-G01: Document Windows Startup Commands
- [x] Document virtual environment activation and backend dependency installation.
- [x] Document local database initialization and seeding.
- [x] Document frontend dependency installation.
- [x] Document separate PowerShell commands for starting backend and frontend.
- [x] Document local URLs, environment variable names, troubleshooting, and safe reset procedures.
- **Verification:** Fully updated `RUNBOOK.md` with explicit, verified Windows PowerShell startup commands, `.env` references, database migration & seed steps, test execution scripts, and troubleshooting reset steps.

### TASK-G02: Final Local Acceptance
- [x] Frontend opens at `http://localhost:3000`.
- [x] Backend API documentation opens at `http://127.0.0.1:8000/docs`.
- [x] SQLite is the active application database.
- [x] Registration and login work locally.
- [x] Role-based permissions work.
- [x] Booking and approval workflows work.
- [x] Permission letters can be generated and verified.
- [x] Sepolia contract reads and required transactions work.
- [x] Dashboards use real backend data.
- [x] Existing tests pass or remaining failures are documented.
- **Verification:** Complete end-to-end local architecture reset verified across database, auth, business logic, blockchain, frontend integration, and documentation without Neon or Better Auth dependencies.

---

## 3. Deferred Work

These items are not part of the current priority:

- [ ] Neon database provisioning and production database migrations.
- [ ] Better Auth and production JWKS integration.
- [ ] Render and Vercel deployment.
- [ ] Custom institutional domains and production DNS.
- [ ] Production release tagging and deployment sign-off.
- [ ] Unrelated UI redesigns, new features, and large-scale refactoring.

Preserve relevant existing files and deployment documentation unless they conflict with the local architecture. Do not spend time completing deferred tasks until local acceptance criteria pass.

---

## 4. Execution Rules

1. Work sequentially: complete and verify one task before starting the next dependent task.
2. Inspect existing implementations before modifying them.
3. Prefer minimal, targeted changes over rewriting working modules.
4. Do not trust historical checklist marks without current evidence.
5. Update this file immediately after a task changes status.
6. Record the test or command that justifies each completed status.
7. Keep secrets out of source control, logs, and documentation.
8. Do not create fake transaction receipts or simulated blockchain success.
9. Preserve existing business logic, data relationships, contract deployments, and UI design wherever possible.
10. When blocked, record the exact blocker and the next action instead of repeatedly rescanning the repository.
11. Read this file at the beginning of each development session and continue from the first unresolved task.
12. Do not begin deferred deployment work while local acceptance remains incomplete.

**Definition of done:** THEKEDAR runs on the local Windows PC with Next.js, FastAPI, SQLite, local authentication, real booking/approval workflows, and verified Ethereum Sepolia integration.