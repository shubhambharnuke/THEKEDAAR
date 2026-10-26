# Tech Stack --- Campus Resource Booking & Verification System

> **Project:** Campus Resource Booking & Verification System\
> **Purpose:** Manage college resource bookings, department-wise
> approvals, signed permission documents, and verifiable audit records.\
> **Status:** Proposed implementation stack for the academic prototype.

------------------------------------------------------------------------

## 1. Stack at a Glance

  -----------------------------------------------------------------------
  Layer                   Technology              Responsibility
  ----------------------- ----------------------- -----------------------
  Web application         **Next.js + React +     Responsive club,
                          TypeScript**            authority, verifier,
                                                  and admin interfaces

  UI styling              **Tailwind CSS** +      Consistent, responsive
                          accessible primitives   interface and reusable
                          (Radix UI where useful) components

  Authentication          **Better Auth**         Sign-in, sessions, and
                                                  authentication
                                                  management

  Backend API             **Python + FastAPI**    Booking rules,
                                                  approvals,
                                                  authorization,
                                                  documents, and
                                                  blockchain integration

  Primary database        **Neon PostgreSQL**     Users/application data,
                                                  resources,
                                                  availability, requests,
                                                  approvals, and audit
                                                  history

  Python ORM              **SQLAlchemy 2.x**      Database access and
                                                  transaction handling in
                                                  FastAPI

  Database migrations     **Alembic**             Versioned schema
                                                  changes for
                                                  application-owned
                                                  tables

  Smart contracts         **Solidity**            Store selected document
                                                  hashes and
                                                  approval/version audit
                                                  references

  Blockchain network      **Ethereum Sepolia**    Academic testnet for
                                                  blockchain verification

  Blockchain client       **Web3.py**             Submit transactions and
                                                  read contract records
                                                  from FastAPI

  Contract development    **Hardhat**             Compile, test, and
                                                  deploy Solidity
                                                  contracts

  Documents               **PDF generation +      Generate permission
                          cryptographic digital   letters and support
                          signatures**            authenticity
                                                  verification

  Frontend hosting        **Vercel**              Deploy the Next.js
                                                  application

  API hosting             **Render**              Deploy the FastAPI
                                                  service

  Testing                 **Vitest, Playwright,   Unit, UI, API,
                          Pytest, Hardhat tests** integration, and
                                                  contract testing

  Version control / CI    **Git + GitHub + GitHub Source control and
                          Actions**               automated checks
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 2. Frontend

### Next.js, React, and TypeScript

Use Next.js with the App Router for the web application. React provides
the component model, while TypeScript helps catch common errors as the
project grows.

The frontend will support four main user experiences:

-   **Club users:** create events, select resources and time slots,
    track department-wise approvals, and download issued permission
    letters.
-   **Department authorities:** view requests for resources they
    control, review details, and approve, reject, or request
    corrections.
-   **Verifiers:** check a permission document's signature, hash,
    current status, and associated on-chain record.
-   **Administrators:** manage users, roles, departments, resources, and
    authority assignments.

### Styling

Use Tailwind CSS with custom components and accessible primitives. Keep
the design consistent with the project's technical, monochrome visual
direction, restrained orange accent, thin borders, and rectangular
controls.

**Frontend rule:** UI visibility is not authorization. Every protected
operation must be validated by the server.

------------------------------------------------------------------------

## 3. Authentication and Authorization

### Better Auth

Use Better Auth for authentication and session management in the Next.js
application.

-   Keep authentication secrets and configuration in environment
    variables.
-   Use the official Better Auth setup and schema migration instructions
    for its own tables.
-   Keep Better Auth-owned tables separate from application tables
    managed by SQLAlchemy and Alembic.
-   Do not assume that a Better Auth browser session cookie
    automatically authenticates requests to FastAPI.

### FastAPI authentication bridge

For requests from Next.js to FastAPI, implement and test an explicit
authentication mechanism. One suitable option is Better Auth's JWT
plugin with JWKS-based token verification, where configured according to
the official documentation.

FastAPI should:

1.  Verify the token's signature and required claims.
2.  Identify the authenticated user.
3.  Load current roles and department/resource permissions from trusted
    server-side data.
4.  Enforce authorization for every protected action.

Do not trust role names or department IDs supplied only by the browser.
A valid token proves the relevant authentication claims, but the
application must still check current authorization.

------------------------------------------------------------------------

## 4. Backend API

### Python + FastAPI

FastAPI will implement the application's business rules and provide API
endpoints for:

-   Resource and department management
-   Availability checks
-   Event and booking requests
-   Department-wise request grouping
-   Approval, rejection, and correction workflows
-   Request versioning and audit history
-   Permission-letter generation and verification
-   Blockchain record submission and lookup

Use Pydantic models for request and response validation. Keep business
rules in service modules rather than embedding them directly in route
handlers.

Suggested backend modules:

``` text
backend/
└── app/
    ├── api/
    ├── auth/
    ├── resources/
    ├── bookings/
    ├── approvals/
    ├── documents/
    ├── blockchain/
    ├── database/
    └── tests/
```

------------------------------------------------------------------------

## 5. Database

### Neon PostgreSQL

Neon provides a managed PostgreSQL database. Store the application's
operational and private data here, including:

-   Application users and role/department assignments
-   Departments, resources, and resource ownership
-   Events and requested time slots
-   Department-level requests and their versions
-   Approval decisions and reasons
-   Booking status and cancellation records
-   Document metadata and storage references
-   Audit events and blockchain transaction references

Do **not** store full permission PDFs, private personal data,
authentication secrets, or signing private keys on-chain.

### SQLAlchemy and Alembic

Use SQLAlchemy 2.x for application database access and Alembic for
versioned migrations of application-owned tables. Follow Better Auth's
own documented migration process for its tables; avoid having two
migration systems manage the same table.

Use Neon's pooled connection string for normal application traffic when
appropriate. Check Neon's current guidance for migrations and any
operation that requires a direct or session-based connection.

### Preventing double bookings

PostgreSQL is the source of truth for booking availability and confirmed
booking conflicts.

-   Recheck availability when a request is submitted and again when it
    is approved.
-   Use database transactions and suitable constraints/locking so
    concurrent approval attempts cannot confirm overlapping bookings for
    the same resource.
-   A normal "check availability, then insert" sequence without
    concurrency protection is not sufficient.
-   Pending requests warn about potential conflicts but do not reserve
    resources by default, according to the current product requirements.
-   Material changes to an approved request create a new version and
    require the applicable approvals again.

The exact constraint or locking strategy must be designed around the
final resource/time-slot schema and tested with concurrent requests.

------------------------------------------------------------------------

## 6. Blockchain Layer

### Solidity + Ethereum Sepolia + Web3.py

Use Solidity for a small contract that records selected verification
data, such as:

-   A cryptographic hash of a finalized permission document
-   A request or document identifier that does not expose private
    information
-   A version or event reference
-   Issuer/record metadata needed for verification
-   Revocation or supersession status, if implemented in the contract
    design

Use Ethereum Sepolia for the academic prototype and Web3.py in FastAPI
to submit transactions and read records.

### What belongs on-chain?

**On-chain:** only the minimum data required for independent integrity
checks and audit references.

**Off-chain in PostgreSQL or controlled document storage:** full PDFs,
event details, student information, private approval notes, and other
sensitive data.

Never put a full permission letter or personal data on a public
blockchain.

### What blockchain does and does not do

Blockchain can make a submitted hash and its recorded transaction
history independently verifiable and tamper-evident. It does **not**
independently prove that a physical signature or real-world approval
occurred, and it does not automatically prevent booking conflicts.

-   PostgreSQL enforces operational booking rules.
-   The application's authorization system controls who may approve.
-   A cryptographic digital signature verifies the signed document and
    signer key.
-   Blockchain provides an additional verifiable record of selected
    hashes and events.

Keep database approval status and blockchain transaction status
separate. Do not label a record as confirmed on-chain until the
transaction has reached the required confirmation state. Plan for
transaction failures, retries, duplicate submissions, and delayed
confirmations.

Sepolia is a test network suitable for a prototype; it is not evidence
that the system has production-grade decentralized governance.

------------------------------------------------------------------------

## 7. Permission PDFs and Digital Signatures

Generate a combined permission letter for each department-level request,
listing the resources managed by that department. A single event may
therefore have multiple department-level requests and multiple
permission letters.

The document workflow should:

1.  Generate the PDF from a specific request version.
2.  Apply a genuine cryptographic digital signature using an appropriate
    signing certificate/key arrangement.
3.  Store the PDF and required verification metadata off-chain.
4.  Compute a cryptographic hash of the finalized signed document.
5.  Record the relevant hash and reference on-chain, if that step is
    enabled and successfully submitted.
6.  Allow verifiers to check the signature, hash, current approval
    status, version, and blockchain record.

A typed name or pasted image of a signature is **not** a cryptographic
digital signature. Hash matching alone does not prove who signed the
document or whether that person was authorized. The signing identity,
certificate/key trust model, key custody, and revocation approach must
be selected and documented before claiming a signature is officially
trusted.

When a request is changed, cancelled, or superseded, retain the
historical document and mark its status clearly; do not silently
overwrite it.

------------------------------------------------------------------------

## 8. Deployment

### Recommended deployment layout

  Component            Deployment
  -------------------- ---------------------------
  Next.js web app      Vercel
  FastAPI backend      Render
  PostgreSQL           Neon
  Smart contract       Ethereum Sepolia
  Source code and CI   GitHub and GitHub Actions

Suggested hostnames, once a domain is selected:

-   `app.example.com` --- Next.js application
-   `api.example.com` --- FastAPI API

These are examples, not configured domains.

### Deployment checks

-   Use HTTPS for production traffic.
-   Configure FastAPI CORS to allow only the required frontend origins.
-   Configure and test token verification across the frontend/backend
    boundary.
-   Set environment variables through the hosting providers'
    secret/configuration settings.
-   Never commit `.env` files, database URLs, Better Auth secrets,
    wallet private keys, or signing keys.
-   Restrict blockchain signing keys and document-signing keys to the
    minimum required service and permissions.
-   Test deployment behavior, logs, health checks, database migrations,
    and recovery from API or RPC outages.
-   Check current hosting plan limitations before choosing a free tier;
    sleeping services or resource limits can affect live demonstrations.

------------------------------------------------------------------------

## 9. Testing Strategy

  -------------------------------------------------------------------------
  Test level              Tool                    What to test
  ----------------------- ----------------------- -------------------------
  Frontend unit/component Vitest                  Components, validation,
  tests                                           status display, and
                                                  utility logic

  End-to-end browser      Playwright              Club, authority,
  tests                                           verifier, and admin
                                                  workflows

  Backend tests           Pytest                  API validation, business
                                                  rules, role checks, and
                                                  error handling

  Database integration    Pytest + PostgreSQL     Transactions, migrations,
  tests                   test setup              versioning, and
                                                  concurrent booking
                                                  attempts

  Smart contract tests    Hardhat                 Authorized writes, hash
                                                  records, duplicate
                                                  handling, and
                                                  revocation/supersession
                                                  behavior

  Signature/document      Pytest and suitable     Invalid signatures,
  tests                   PDF/signature tools     changed files, hash
                                                  mismatches, and stale
                                                  documents
  -------------------------------------------------------------------------

Minimum critical scenarios:

-   Two concurrent approvals cannot confirm overlapping bookings for the
    same resource.
-   A department authority cannot approve a request for a resource
    outside their authorization.
-   Approval by one department does not approve another department's
    request.
-   A modified document fails integrity verification.
-   A cancelled or superseded permission letter is not presented as
    current.
-   An invalid, expired, or incorrectly signed token is rejected by
    FastAPI.
-   Blockchain RPC failure does not silently mark a transaction as
    confirmed.
-   All material decisions record the actor, timestamp, request version,
    action, and relevant reason.

------------------------------------------------------------------------

## 10. Repository Structure

``` text
campus-resource-system/
├── apps/
│   └── web/                    # Next.js + React + TypeScript + Better Auth
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── resources/
│   │   ├── bookings/
│   │   ├── approvals/
│   │   ├── documents/
│   │   ├── blockchain/
│   │   ├── database/
│   │   └── tests/
│   ├── migrations/             # Alembic migrations for app-owned tables
│   └── pyproject.toml
├── contracts/
│   ├── contracts/
│   ├── test/
│   └── scripts/
├── docs/
│   ├── PRD.md
│   ├── DESIGN.md
│   ├── TECHSTACK.md
│   └── ARCHITECTURE.md
├── .gitignore
└── README.md
```

This is a proposed layout. Adjust it if the repository already has a
working structure; do not rewrite an existing application solely to
match this example.

------------------------------------------------------------------------

## 11. Environment Variables

Example names only. Keep real values in local environment files or
deployment secret managers.

``` dotenv
# Web application / Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_APP_URL=

# API
API_BASE_URL=
CORS_ALLOWED_ORIGINS=

# Neon PostgreSQL
DATABASE_URL=

# Blockchain
SEPOLIA_RPC_URL=
BLOCKCHAIN_CHAIN_ID=11155111
DOCUMENT_REGISTRY_CONTRACT_ADDRESS=
BLOCKCHAIN_SIGNER_PRIVATE_KEY=

# Document signing
DOCUMENT_SIGNING_KEY_REFERENCE=
DOCUMENT_SIGNING_CERTIFICATE_REFERENCE=
```

Important:

-   Do not use a `NEXT_PUBLIC_` prefix for secrets.
-   `DATABASE_URL` and `SEPOLIA_RPC_URL` must only be available to
    server-side code.
-   The private key variable is a placeholder for a prototype; prefer
    managed secret storage or a dedicated signer service where feasible.
-   Better Auth's exact environment variable names and URL requirements
    must match the version and deployment configuration selected.
-   A certificate/key reference is not itself a signing key. The actual
    signing mechanism must be implemented and protected.
-   Add `.env*` to `.gitignore`, while retaining a sanitized
    `.env.example` with empty values.

------------------------------------------------------------------------

## 12. Implementation Order

1.  Initialize the repository and Next.js application.
2.  Configure Better Auth and Neon PostgreSQL.
3.  Establish application roles, departments, resources, and server-side
    authorization.
4.  Implement resource availability and database-enforced confirmed
    booking integrity.
5.  Build club event submission and department-wise request grouping.
6.  Build authority review, versioning, correction, approval, rejection,
    and cancellation flows.
7.  Generate permission PDFs and implement real cryptographic signature
    verification.
8.  Add verifier workflows and audit history.
9.  Implement and test the Solidity contract on Hardhat.
10. Deploy to Sepolia and integrate Web3.py with transaction-status
    handling.
11. Deploy the web app and API, configure secrets/domains, and run
    end-to-end tests.
12. Complete security, accessibility, privacy, and launch checks.

**Recommended principle:** finish and test the core booking/approval
workflow before adding blockchain integration. This keeps database,
authorization, document, and blockchain failures easier to isolate.

------------------------------------------------------------------------

## 13. Key Design Decisions to Confirm

Before a production claim or real institutional rollout, document and
validate:

-   The official source of user identity and how college users are
    onboarded.
-   Which roles may approve, and how department/resource authority
    assignments are maintained.
-   The exact overlap rules, time zone, buffers, and resource-specific
    booking constraints.
-   The cryptographic signature format, signer identity, key custody,
    and certificate trust model.
-   Which events are written to the blockchain and how retries,
    reversals, and stale records are represented.
-   Where PDFs are stored, who can access them, and how long they are
    retained.
-   The applicable privacy, data retention, and institutional approval
    requirements.

------------------------------------------------------------------------

## 14. Final Stack Decision

**Next.js + React + TypeScript + Tailwind CSS + Better Auth + FastAPI +
Neon PostgreSQL + SQLAlchemy/Alembic + Solidity + Ethereum Sepolia +
Web3.py**, deployed using **Vercel, Render, and Neon**.

This stack separates the responsibilities clearly: PostgreSQL handles
operational consistency, FastAPI enforces application rules, Better Auth
manages authentication, cryptographic signatures support document
verification, and blockchain records provide an additional
tamper-evident integrity layer.
