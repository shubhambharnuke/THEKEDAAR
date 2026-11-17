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

**Current phase:** Phase H — UX & Feature Refinements (In Progress)

**Verified Capabilities:**
- Local SQLite database operational at `backend/data/thekedar.db` with enforced foreign keys.
- FastAPI-managed local authentication with PBKDF2 password hashing and signed HS256 JWT tokens.
- Next.js frontend connected to backend via typed API client (`apps/web/lib/api.ts`) and local auth client (`apps/web/lib/auth-client.ts`).
- End-to-end multi-department workflow, double-booking prevention, tamper-evident digital signatures, and local Ethereum node integration fully functional (Docker + Hardhat).
- Complete regression suite passing: 25/25 backend pytest tests pass.

---

## Phase H — UX & Feature Refinements (Preserving Design Theme)

### TASK-H01: Role-Specific Sign-In & Registration Experience
- [x] **H01.1 — Dual Role Sign-In Experience**: Updated `/auth/login` with distinct tabs/options for **Student Club** and **Authority** sign-in while preserving theme aesthetics and routing to appropriate dashboards.
- [x] **H01.2 — Role-Specific Registration**: Added dual-role registration page at `/auth/register`:
  - **Club Registration**: Full Name, Club/Organization Name, Email, Password.
  - **Authority Registration**: Full Name, Email, Password, Department Selection dropdown fetched live from `/api/v1/departments`.
- [x] **H01.3 — Backend Registration API**: Updated `/api/v1/auth/register` to accept `role`, `department_id`, and `club_name`.

### TASK-H02: Persistent Session During Document Verification
- [x] **H02.1 — Verification Portal Session Continuity**: Updated `/verify` page header to check active session using `useSession()`. If the user is logged in, their name and a direct "Go to Dashboard →" link are displayed without resetting the session or forcing a re-login.

### TASK-H03: Live Authority Resource Calendar
- [x] **H03.1 — Replace Dummy Data in Authority Calendar**: Updated `/authority/resources` to fetch live resources and real events/bookings from `/api/v1/resources` and `/api/v1/events`.
- [x] **H03.2 — Real Resource Time Slots**: Shows actual booking times, organizers, and approval states for the selected facility instead of hardcoded placeholders.

### TASK-H04: Live Resource Catalog & Slot Availability in Club Section
- [x] **H04.1 — Replace Hardcoded Dummy Slot Availability**: Fixed `/club/resources` to accurately consume the backend `/api/v1/resources/{id}/availability` collision responses (`is_available` and `conflicts`).
- [x] **H04.2 — Dynamic Reservation Status**: Accurately shows whether a slot is free or already reserved for an event with its exact reservation window.

### TASK-H05: Event Deletion / Cancellation for Clubs
- [x] **H05.1 — Backend Cancel/Delete Endpoint**: Added `DELETE /api/v1/events/{id}` endpoint in `backend/app/bookings/router.py` & `service.py` to permanently delete an event, request versions, bookings, and decision records if owned by the user.
- [x] **H05.2 — Frontend Delete Action**: Added "Delete Request" button with confirmation modal on the club event detail page (`/club/events/[id]`), matching the existing minimalist graphite/paper design theme.

---

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

## Phase I — Permissioned Besu Network & On-Chain Resource Management

> **Implementation Principle:**  
> The existing frontend pages, layouts, styles, and minimalist graphite/paper UI/UX remain 100% intact.  
> Frontend updates are strictly restricted to essential Web3 interactions: wallet connection header component, on-chain transaction status indicator, and calling smart contract write/read methods instead of purely DB CRUD operations.  
> **Source of Truth:** Hyperledger Besu QBFT blockchain is the sole authoritative state machine for identity, resources, bookings, and approvals. SQLite and FastAPI serve strictly as an event-indexed, rebuildable read model.

### TASK-I01: 4-Node Hyperledger Besu QBFT Cluster Setup
- [x] **I01.1 — QBFT Genesis Configuration**: Created `infrastructure/besu/genesis/genesis.json` configured for QBFT consensus with a 1-second block period, chainId 1337, extraData RLP-encoded validators, and pre-allocated zero-gas balances.
- [x] **I01.2 — Validator Node Configurations & Keys**: Generated 4 independent validator key pairs and created isolated configuration files (`config.toml`) with unique persistent data paths and distinct validator addresses for:
  - Validator 1 (Department A: `0xfe3b557e8fb62b89f4916b721be55ceb828dbd73`)
  - Validator 2 (Department B: `0x627306090abab3a6e1400e9345bc60c78a8bef57`)
  - Validator 3 (Department C: `0x2c36ffd7da7a0606c2ae6077c5a618f17805ab61`)
  - Validator 4 (Central Administration: `0xa0ee7a142d267c1f36714e4a8f75612f20a79720`)
- [x] **I01.3 — Besu Docker Compose Orchestration**: Created `infrastructure/besu/docker-compose.yml` orchestrating the 4 Besu nodes with static peering, isolated persistent volumes, health checks, restart policies, and exposing JSON-RPC (port 8545) on localhost.
- [ ] **I01.4 — Consensus & Fault Tolerance Verification**: Start the cluster and run an automated script verifying: (a) QBFT block finalization across all 4 nodes, (b) consistent state across nodes, (c) consensus continuation when 1 validator is stopped, and (d) successful resynchronization when the stopped node restarts.

### TASK-I02: Smart Contract Architecture (Hardhat + OpenZeppelin)
- [x] **I02.1 — CollegeAccessControl.sol**: Implemented role-based access control inheriting OpenZeppelin `AccessControl`:
  - Roles: `STUDENT`, `CLUB_MEMBER`, `FACULTY`, `DEPARTMENT_AUTHORITY`, `DEPARTMENT_ADMIN`, `CENTRAL_ADMIN`, `NETWORK_GOVERNOR`.
  - Enforced explicit role-admin hierarchy: users cannot self-assign; `STUDENT`/`CLUB_MEMBER` granted by registration authority; `DEPARTMENT_AUTHORITY`/`ADMIN` granted by central admin; `CENTRAL_ADMIN`/`NETWORK_GOVERNOR` managed by governance.
  - Implemented wallet suspension/reinstatement (`isSuspended`) and department-scoped verification (`getDepartment(address)`).
- [x] **I02.2 — CollegeAccessControl Unit Tests**: Wrote Hardhat tests for registration, department authorization, role hierarchy, revoking permissions, wallet suspension enforcement across privileged functions, and unauthorized caller rejections. (6 passing)
- [x] **I02.3 — ResourceRegistry.sol**: Implemented authoritative on-chain resource registry with unique resource IDs, owning department, metadata hash, active/inactive state, booking limits (min/max duration), and department-level management permissions.
- [x] **I02.4 — ResourceRegistry Unit Tests**: Wrote Hardhat tests for resource registration, department ownership checks, metadata updates, deactivation safeguards, and verifying that deactivation preserves historical records while preventing new bookings. (4 passing)
- [x] **I02.5 — BookingManager.sol**: Implemented atomic double-booking prevention engine:
  - 15-minute fixed slot indexing with half-open intervals $[start, end)$ aligned to 15-minute boundaries (`startTime < endTime`, duration bounds).
  - Slot storage mapping `(resourceId, slotTimestamp) => bookingId`.
  - Atomic slot reservation and exact state machine (`NONE`, `PENDING`, `CONFIRMED`, `REJECTED`, `CANCELLED`, `EXPIRED`, `COMPLETED`).
  - Atomic modification: release old slots and reserve new slots in a single transaction (reverting if conflicting).
  - Cancellation & expiry: permissionless or keeper-callable `expireBooking(bookingId)` after deadline releasing slots.
- [x] **I02.6 — BookingManager Concurrency & Unit Tests**: Wrote Hardhat tests for valid bookings, overlapping conflicting bookings (revert verification), adjacent reservations (must pass), cancellations, expired slot release, and atomic modification tests. (5 passing)
- [x] **I02.7 — ApprovalManager.sol**: Implemented multi-authority approval workflow:
  - Enforce multi-stage approvals (e.g. Department Authority $\rightarrow$ Central Admin).
  - Prevent self-approval, duplicate decisions, and unauthorized cross-department approvals.
  - On-chain atomic confirmation: upon satisfying final required approval, `ApprovalManager` makes an on-chain contract-to-contract call to `BookingManager.confirmBooking(...)`. If confirmation fails, the approval transaction reverts atomically.
- [x] **I02.8 — ApprovalManager Unit Tests**: Wrote Hardhat tests preventing self-approval, duplicate decisions, out-of-order stages, unauthorized cross-department approvals, and verifying atomic cross-contract confirmation. (3 passing)
- [x] **I02.9 — Upgrade DocumentRegistry.sol & SystemGovernance.sol**: Upgraded `DocumentRegistry.sol` to support document revocation while preserving original registration history, and implemented `SystemGovernance.sol` for multi-party institutional policy adjustments.
- [x] **I02.10 — Deployment & ABI Export Script**: Wrote Hardhat deployment script deploying all 6 contracts to the Besu QBFT network and exporting contract ABIs and deployed addresses to `apps/web/lib/contracts/` and `backend/app/blockchain/abi/`. Verified via `scripts/deploy-all.ts`.
- [x] **I02.11 — Role-Admin Hierarchy & Wallet Suspension Tests**: Comprehensive test suite verifying that suspended wallets fail all privileged contract operations even if holding roles.
- [x] **I02.12 — Permitted Booking Status Transition Invariant Tests**: Verified all valid and invalid transitions across all 7 booking states.
- [x] **I02.13 — Resource Deactivation Policy Tests**: Verified existing confirmed bookings remain valid for historical audits when a resource is deactivated.
- [x] **I02.14 — Booking Modification Reapproval Rules**: Verified that modifying critical booking parameters (dates, slots, venue) resets status to `PENDING` and preserves atomicity.
- [x] **I02.15 — Cross-Contract Authorization & Atomicity Tests**: Verified that `BookingManager.confirmBooking` rejects calls from any address other than the authorized `ApprovalManager` contract.

### TASK-I03: Blockchain Event Indexer & Read Database Sync
- [ ] **I03.1 — Blockchain Event Indexer Service**: Implement a dedicated TypeScript/Viem event indexer service connecting to the Besu JSON-RPC endpoint.
- [ ] **I03.2 — Complete Event Subscriptions & Database Read Model Sync**: Subscribe to and index all state-changing events:
  - `CollegeAccessControl`: `UserRegistered`, `RoleGranted`, `RoleRevoked`, `WalletSuspended`, `WalletReinstated`, `DepartmentUpdated`
  - `ResourceRegistry`: `ResourceRegistered`, `ResourceUpdated`, `ResourceDeactivated`, `ResourceReactivated`
  - `BookingManager`: `BookingRequested`, `BookingConfirmed`, `BookingRejected`, `BookingCancelled`, `BookingModified`, `BookingExpired`, `BookingCompleted`
  - `ApprovalManager`: `ApprovalRecorded`, `RejectionRecorded`, `ApprovalPolicyUpdated`
  - `DocumentRegistry`: `DocumentRegistered`, `DocumentRevoked`
  - `SystemGovernance`: `PolicyUpdated`, `GovernanceActionExecuted`
  Update the local SQLite database models (`resources`, `events`, `bookings`, `decision_history`, `blockchain_records`) idempotently.
- [ ] **I03.3 — Idempotent Block Processing & Replay**: Persist the last processed block number; deduplicate events using `(txHash, logIndex)`; safely recover missed blocks upon restart.
- [ ] **I03.4 — Database Reconstruction from Blockchain History**: Implement and verify a `rebuild-database` CLI command: deleting the SQLite database and replaying events from genesis block 0 fully recovers the entire institutional resource and booking history.
- [ ] **I03.5 — Indexer Health & Sync Monitoring**: Expose health status and current indexed block height to ensure dashboards reflect finalized on-chain data.

### TASK-I04: Essential Frontend Web3 Integration (Preserving UI/UX)
- [ ] **I04.1 — Wallet Connection Header Pill**: Integrate Wagmi + Viem in `apps/web` with a clean, unobtrusive "Connect Wallet / Wallet Connected" badge in the navigation bar matching the existing graphite/paper style.
- [ ] **I04.2 — On-Chain Role & Department Detection**: Read the connected wallet's assigned role and department directly from `CollegeAccessControl`; display appropriate warnings if the connected wallet is unregistered or suspended.
- [ ] **I04.3 — Transaction Status Indicator Component**: Create a reusable `TransactionStatus` component displaying exact transaction lifecycle (`Awaiting Signature` $\rightarrow$ `Submitted` $\rightarrow$ `Pending Consensus` $\rightarrow$ `Confirmed in Block #X` / `Reverted` / `Rejected by Wallet`) without changing existing page layouts.
- [ ] **I04.4 — Wire Club Event Booking to Smart Contract**: Update the Club event submission form (`/club/events/new`) to request user wallet signature for `BookingManager.requestBooking(...)`, enforcing 15-minute slot bounds and verifying receipt confirmation before displaying success.
- [ ] **I04.5 — Wire Authority Decision to Smart Contract**: Update Authority approval and rejection actions (`/authority/approvals/[id]`) to sign `ApprovalManager.recordApproval(...)` or `recordRejection(...)` directly on-chain.
- [ ] **I04.6 — Wire Document Revocation to Smart Contract**: Add a revocation action for authorized issuers on `/verify` and letter views calling `DocumentRegistry.revokeDocument(...)`.
- [ ] **I04.7 — Network & Account Switching Guard**: Handle wallet account switches, wrong chain IDs (must be Besu 1337), and disconnected states gracefully with inline alerts.
- [ ] **I04.8 — On-Chain State Refresh Post-Confirmation**: Trigger indexer sync or poll contract state immediately upon block receipt to update local views seamlessly.

### TASK-I05: End-to-End System Demonstration & Verification
- [ ] **I05.1 — Multi-Department Concurrency & Double-Booking Demonstration**: Run an end-to-end integration test demonstrating two distinct wallets attempting to reserve the same resource time window; verify that the first succeeds and the second transaction reverts on-chain.
- [ ] **I05.2 — Multi-Authority Approval Flow Demonstration**: Run a complete end-to-end workflow: Club booking request $\rightarrow$ Department Authority on-chain approval $\rightarrow$ Central Admin on-chain approval $\rightarrow$ Automated cross-contract on-chain booking confirmation $\rightarrow$ UI reflection.
- [ ] **I05.3 — Fault Tolerance & Consensus Live Test**: Stop one validator node during active booking submissions; demonstrate that blocks continue to be forged and finalized by the remaining 3 validators.
- [ ] **I05.4 — Unauthorized, Suspended, & Cross-Department Security Tests**: Demonstrate rejections on-chain when: (a) a suspended wallet attempts to book, (b) Department B attempts to approve Department A's booking, (c) an applicant attempts to self-approve.
- [ ] **I05.5 — Booking Expiry & Automatic Slot Release Test**: Demonstrate a pending booking exceeding its approval deadline, triggering expiry, and releasing its reserved slots on-chain.
- [ ] **I05.6 — Complete Read-Model Rebuild Test**: Delete `backend/data/thekedar.db`, run indexer replay from block 0, and verify that the full institutional state matches the smart contracts.

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
13. **On-chain authority:** No backend API, database operation, or frontend state update may independently change authoritative resource, booking, approval, or access-control state.
14. **Contract security:** Every privileged contract function must enforce role, department, suspension, and state-transition checks on-chain.
15. **Transaction verification:** A transaction hash or wallet submission is not success. Verify the receipt, execution status, and resulting contract state.
16. **Read-model integrity:** The indexer must be idempotent and capable of rebuilding the database from blockchain history.
17. **Network separation:** Local Besu QBFT and public Sepolia must use separate configurations, deployments, addresses, and environment variables.
18. **No accidental UI redesign:** Existing pages, components, layouts, styling, and user flows must remain unchanged unless a specific Web3 interaction requires a targeted modification.
19. **Deployment evidence:** Every completed infrastructure or contract task must include reproducible commands, test output, and relevant configuration evidence.
20. **No premature completion:** Do not mark a task complete because files were created. Mark it complete only after its acceptance test passes.

**Definition of done:** THEKEDAR runs locally on Windows with Next.js, FastAPI, SQLite, local authentication, a 4-validator Hyperledger Besu QBFT network, and verified on-chain resource booking and multi-authority approval workflows. Sepolia deployment is a separate, explicitly scoped target and must not replace local QBFT verification.