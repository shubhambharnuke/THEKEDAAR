# Product Requirements Document (PRD)
## Blockchain-Based College Resource Booking and Permission Management System

**Project Type:** College Course Project (CP)  
**Institution Context:** Vishwakarma Institute of Technology (VIT), Pune  
**Version:** 1.0  
**Status:** Proposed — Requirements Definition  
**Document Purpose:** Faculty review, project approval, development planning, and evaluation

---

## 1. Executive Summary

College clubs and student teams frequently require classrooms, seminar halls, auditoriums, laboratories, and other shared institutional resources to conduct events and activities.

The current permission process often relies on shared spreadsheets, physical permission letters, manual approvals, and communication between clubs and multiple departments. This creates opportunities for double bookings, outdated availability information, incorrect booking entries, conflicting approvals, and difficulty tracking changes or verifying the validity of permission letters.

The proposed system is a centralized web application with a blockchain-backed verification layer. It will allow student clubs to create event requests, select resources, generate department-wise permission letters, and track approval status. Department authorities will be able to review requests, verify availability, record decisions, and issue digitally signed permission letters.

Neon PostgreSQL will manage operational data and booking consistency. Better Auth will provide authentication, while React and FastAPI will power the frontend and backend. Solidity smart contracts deployed on Ethereum Sepolia will record selected approval events and document hashes, enabling independent verification of recorded versions.

The system will prioritize a reliable booking workflow first, with blockchain introduced as a complementary verification and audit layer.

## 2. Problem Statement

The existing resource-booking workflow faces several operational challenges:

- **Double booking:** Multiple clubs may believe the same room is available for overlapping time slots.
- **Stale information:** Shared spreadsheets may not reflect the latest booking or approval status.
- **Incorrect entries:** A booking may contain the wrong campus, room, date, or time.
- **Approval mismatches:** A physical permission letter and the latest digital booking record may disagree.
- **Fragmented approvals:** One event may require permission from multiple departments, making its overall status difficult to understand.
- **Untracked changes:** Changes to event details or requested resources may not be clearly connected to the approval that was originally granted.
- **Limited verification:** Staff may have difficulty establishing whether a permission letter is genuine, current, and associated with an authorized approval.
- **Weak accountability:** It may be difficult to reconstruct who approved, rejected, modified, or cancelled a request and when.

### Illustrative scenario

Club A reserves the New Seminar Hall until 5:00 PM. However, the booking is mistakenly entered under the wrong campus. Club B checks the shared spreadsheet, sees no reservation for the hall, and requests the room from 4:00 PM onward.

The resulting conflict is caused by incorrect or inconsistent booking information rather than simply by a lack of a booking interface.

The proposed system must maintain reliable availability information, validate requests, enforce booking rules, and preserve a traceable history of decisions and changes.

## 3. Product Vision

To provide a reliable, transparent, and verifiable digital system for managing college resource bookings and permission workflows across multiple clubs and departments.

### Core value proposition

**One event. Department-wise requests. Clear approvals. Verifiable permission letters.**

The product should make resource booking easier for students, more manageable for authorities, and more auditable for the institution.

## 4. Product Goals and Objectives

### Primary goals

1. **Prevent confirmed booking conflicts.** The system must prevent overlapping confirmed bookings for the same resource.
2. **Centralize resource availability.** Clubs and authorities must work from a consistent source of operational booking data.
3. **Simplify multi-department requests.** A single event requesting resources from multiple departments must be divided into department-specific approval groups.
4. **Make approval status transparent.** Clubs must be able to distinguish pending, approved, rejected, cancelled, and partially approved requests.
5. **Provide verifiable permission documents.** Each approved request version must be associated with the correct digitally signed permission letter.
6. **Maintain accountability.** Important changes and approval decisions must be recorded in an audit trail.
7. **Demonstrate a justified blockchain use case.** Selected approval records and document hashes must be independently verifiable without putting private event information or full documents on-chain.

### Secondary goals

- Reduce repetitive manual data entry.
- Minimize unnecessary back-and-forth between clubs and departments.
- Make cancellations and changed requests easier to manage.
- Support a future expansion to additional departments, campuses, and resource types.

### Non-goals for the initial release

- Replacing every existing institutional approval process.
- Managing financial payments or event ticket sales.
- Storing complete permission letters or personal information on a public blockchain.
- Using AI to decide whether an event should be approved.
- Proving that a physical signature or in-person approval actually occurred solely through blockchain.
- Integrating directly with the institution's official identity system unless access is provided.
- Deploying a production blockchain network operated by independent college departments.

## 5. Target Users and Roles

### 5.1 Club member / Club organizer

Creates events, selects rooms and time slots, submits requests, tracks approval progress, downloads permission letters, and manages changes or cancellations.

### 5.2 Department authority / Authorized approver

Reviews requests for resources managed by their department, checks availability and event details, records decisions, and issues digitally signed permission letters.

### 5.3 System administrator

Manages user roles, departments, resources, and authorized approver assignments. The administrator maintains the configuration needed for the workflow.

Administrative access must not automatically grant permission to approve every department's booking unless that authority has been explicitly assigned.

### 5.4 On-ground staff / Resource manager

Checks the validity of a permission letter and the associated booking before allowing a club to use a room or resource.

For the initial release, this role may be implemented as a limited read-only verification interface rather than a separate full dashboard.

## 6. User Stories and Acceptance Criteria

### 6.1 Club-side user stories

**US-01: Create an event**

As a club organizer, I want to create an event with its details so that I can request the resources required to conduct it.

Acceptance criteria:
- The organizer can enter the event name, purpose, date, start time, end time, expected attendance, and relevant setup details.
- Required fields are validated.
- The event is assigned a unique identifier.
- The organizer can save a draft before submitting requests.

**US-02: Select resources**

As a club organizer, I want to select rooms and available time slots so that I can request suitable resources.

Acceptance criteria:
- Resources are displayed with their campus, location, capacity, and responsible department.
- Resources unavailable for the requested time are not selectable.
- The system validates that the requested time interval is valid.
- Availability is rechecked when a request is submitted and again before final confirmation.

**US-03: Submit one event to multiple departments**

As a club organizer, I want the system to group requested rooms by department so that I do not have to create a separate event for every department.

Acceptance criteria:
- One event can request multiple resources.
- Resources managed by the same department are grouped into one department-level request.
- Each department-level request has its own identifier and status.
- One combined permission letter is generated per department-level request.
- Approval by one department does not automatically approve another department's request.

**US-04: Track request progress**

As a club organizer, I want to see the status of every department-level request so that I know which permissions are pending.

Acceptance criteria:
- The event page shows an overall event status and the status of each department-level request.
- The system distinguishes fully approved, partially approved, pending, rejected, and cancelled outcomes.
- The interface identifies the department responsible for each pending decision.
- The system does not label the entire event fully approved while required approvals remain outstanding.

**US-05: View request history**

As a club organizer, I want to view the history of my request so that I can understand what changed and who made each decision.

Acceptance criteria:
- The history shows submission, edits, decisions, cancellation, and relevant document updates.
- Each significant request version has a version identifier.
- Previous versions remain available for audit.
- The current status is clearly distinguished from historical status.

**US-06: Download permission letters**

As a club organizer, I want to download the approved, digitally signed permission letter so that I can present valid authorization to on-ground staff.

Acceptance criteria:
- The approved letter corresponds to the exact approved request version.
- The system provides a cryptographically signed PDF or a signed PDF with a verifiable signature structure.
- The system displays whether the document is current, superseded, cancelled, or unverifiable.
- A blockchain transaction is shown as confirmed only after the required transaction is confirmed on the configured network.
- The club can access the approved electronic letter from its event page.

**US-07: Modify or cancel a request**

As a club organizer, I want to modify or cancel a request so that the system reflects the latest event plans.

Acceptance criteria:
- Changes create a new version rather than silently overwriting approved details.
- Material changes, such as room, date, or time changes, require renewed approval.
- Previous permission letters are marked superseded when appropriate.
- Cancellation updates the current booking status and preserves historical records.
- Any associated blockchain record remains part of the audit history.

### 6.2 Authority-side user stories

**US-08: View department-specific requests**

As a department authority, I want to see requests for resources managed by my department so that I can review the requests relevant to my responsibilities.

Acceptance criteria:
- Authorities see requests within their assigned scope.
- Each request shows event details, selected resources, dates, times, and the relevant permission letter.
- Unauthorized users cannot approve requests for departments they do not control.

**US-09: Review competing requests and availability**

As an authority, I want to review current bookings and competing requests so that I can make informed decisions.

Acceptance criteria:
- The interface displays confirmed bookings and relevant pending requests.
- Availability is revalidated immediately before a booking is confirmed.
- Concurrent approval attempts cannot produce overlapping confirmed bookings for the same exclusive resource.
- Conflicts are explained to the authority instead of silently accepting an invalid booking.

**US-10: Approve or reject a request**

As an authorized approver, I want to record my decision online so that the official system reflects the outcome.

Acceptance criteria:
- The authority can approve, reject, or request corrections, subject to the defined workflow.
- Rejections and correction requests can include a reason.
- The system records the approver identity, timestamp, request version, and decision.
- Only designated authorized approvers can submit decisions.
- A decision applies only to the department-level request and version that was reviewed.

**US-11: Issue a digitally signed permission letter**

As an authorized approver, I want to issue a cryptographically signed permission letter so that recipients can independently verify its authenticity and integrity.

Acceptance criteria:
- The letter contains the relevant event, resource, approval, and version information.
- The signature can be independently verified using the appropriate public key or certificate.
- The system does not treat a typed name or image of a signature as equivalent to a cryptographic signature.
- Any change to the signed document invalidates the document's integrity verification.
- The approved document is linked to its corresponding request version.

**US-12: Review the audit trail**

As an authority, I want to view the history of a request so that I can investigate changes and verify previous decisions.

Acceptance criteria:
- The audit history includes significant edits, decisions, cancellations, and document issuance.
- Records identify the actor and timestamp where available.
- Blockchain transaction references are available for events that have been recorded on-chain.
- Failed or pending blockchain transactions are not falsely represented as confirmed.

### 6.3 Administrator and verification user stories

**US-13: Manage resources and departments**

As an administrator, I want to maintain the resource registry so that booking requests are routed to the correct authority.

Acceptance criteria:
- Each resource has a unique identifier, location, capacity, and responsible department.
- Only authorized administrators can change resource ownership or availability configuration.
- Resource changes are logged.
- Inactive resources cannot be requested for new bookings.

**US-14: Manage user permissions**

As an administrator, I want to assign users to appropriate roles and departments so that users can access only the features and records they are authorized to use.

Acceptance criteria:
- The system supports club organizers, department authorities, administrators, and limited verification users.
- Role and department permissions are enforced on the backend, not just hidden in the frontend.
- Unauthorized requests are rejected.
- Sensitive signing keys and credentials are not exposed to the browser.

**US-15: Verify a permission letter**

As a staff member or authorized verifier, I want to verify a permission letter so that I can check its integrity and approval status.

Acceptance criteria:
- The verifier can check the cryptographic signature.
- The system can compare the document hash against the appropriate recorded hash.
- The verifier can view the associated approval status, where authorized and available.
- Superseded or cancelled letters are clearly identified.
- Verification does not expose unrelated private event data.

## 7. Functional Requirements and Feature List

### 7.1 Authentication and authorization

- Integrate Better Auth for user authentication and session management.
- Support secure login and logout.
- Implement role-based access control.
- Associate authority accounts with the departments and resources they manage.
- Validate authenticated identities and permissions in FastAPI.
- Protect against unauthorized API access and privilege escalation.
- Keep signing keys, database credentials, and blockchain credentials on the server side.

**Integration requirement:** Better Auth is commonly used in TypeScript/JavaScript applications. Its session validation with FastAPI must be explicitly designed and tested. FastAPI must not trust a client-supplied user ID or role without server-side verification.

### 7.2 Resource registry

- Create, update, and deactivate rooms and other bookable resources.
- Store campus, building, room name, capacity, department ownership, and availability configuration.
- Support different resource types in future iterations.
- Identify resources managed by different departments.
- Prevent inactive resources from being requested.

### 7.3 Event management

- Create, edit, view, and cancel events.
- Validate dates, time ranges, and required fields.
- Associate multiple requested resources with one event.
- Store event purpose, expected attendance, and setup or equipment requirements.
- Maintain an event-level summary of all related department requests.

### 7.4 Availability and booking management

- Display resource availability.
- Exclude unavailable resources from selectable options for the requested slot.
- Revalidate availability during submission and approval.
- Prevent overlapping confirmed bookings using database transactions and appropriate PostgreSQL constraints or locking.
- Handle concurrent approval attempts safely.
- Maintain a distinction between pending requests and confirmed bookings.

**Booking rule:** Pending requests do not reserve a resource by default in the initial release. If institutional policy later requires temporary holds or priority rules, those can be configured separately. Conflicting pending requests are reviewed by the responsible authority, while the system guarantees that conflicting confirmed bookings cannot both succeed.

### 7.5 Department-wise request grouping

- Group the resources of one event by responsible department.
- Create one department-level request for each department involved.
- Generate one combined permission letter per department-level request.
- Maintain separate statuses and histories for each group.
- Display a combined event-level summary without hiding unresolved approvals.
- Allow a department to approve its group independently of other departments.

### 7.6 Approval workflow

The standard workflow is:

1. The club creates an event and selects resources.
2. The system groups selected resources by department.
3. Department-level requests and permission letters are prepared.
4. The club prints the letters and takes them to the respective authorities.
5. Each authority reviews the request and relevant physical permission process.
6. The authority records the decision online.
7. The authority signs the physical letter and issues the corresponding digitally signed electronic letter.
8. The system updates the request status and preserves the decision history.
9. The club accesses the current electronic permission letter from its event page.

The online approval record is authoritative within the application. Printing a letter alone does not confirm a booking.

### 7.7 Permission-letter generation and digital signing

- Generate consistent PDF letters from approved request data.
- Include a unique letter ID, request ID, version, event details, department, decision details, and relevant approval metadata.
- Sign the PDF cryptographically using an approved signing method.
- Store the PDF off-chain in appropriately protected storage.
- Store a cryptographic hash of the final signed PDF where required.
- Provide a signature-verification mechanism.
- Maintain document status, including current, superseded, cancelled, and unverifiable.
- Prevent changes to approved event details from silently modifying an already signed document.

The digital signature and blockchain hash serve different purposes: the signature supports verification of the signer's identity and document integrity, while the hash provides a reference for matching the file to the recorded version.

### 7.8 Audit history

Record significant events, including:

- Event creation and edits.
- Resource selection and request submission.
- Department-wise grouping.
- Approval, rejection, and correction requests.
- Changes to approved requests.
- Cancellation and release of bookings.
- Permission-letter generation and signing.
- Blockchain transaction submission, confirmation, or failure.

Audit entries should be append-only at the application level, access-controlled, and linked to the relevant event, request, and version. Database audit records and blockchain records serve complementary purposes.

### 7.9 Blockchain verification

- Deploy the Solidity smart contract to Ethereum Sepolia.
- Record selected request and approval events.
- Associate records with a request identifier, version, event type, and document hash as appropriate.
- Store a blockchain transaction reference for each successfully recorded event.
- Provide a mechanism to verify that a document matches the recorded hash.
- Track pending, confirmed, and failed transactions.
- Handle transaction retries and reconciliation without duplicating logical events.
- Never store full permission letters, personal information, or confidential event details on-chain.

The initial release will use PostgreSQL for authoritative operational booking constraints. The blockchain component will provide a verifiable record of selected events rather than independently deciding room availability.

### 7.10 Notifications

- Notify clubs when an authority records a decision.
- Notify clubs when corrections or further information are required.
- Notify relevant users about cancellations or material changes.
- Display pending approvals and failed document or blockchain operations in the dashboard.
- Use in-app notifications as the minimum viable implementation; email or other channels may be added later.

## 8. Product Workflow and State Model

### 8.1 High-level workflow

Club creates event → selects resources → system groups requests by department → requests are reviewed → authorities record decisions → approved requests are confirmed after availability validation → signed permission letters are issued → selected records and hashes are recorded on-chain → club and authorized staff verify the current permission.

### 8.2 Request status

The system must support:

- **Draft:** The organizer is preparing the event or request.
- **Pending:** The request has been submitted and awaits a decision.
- **Needs Correction:** The authority has requested changes or further information.
- **Approved:** The department-level request has been approved and its booking confirmed.
- **Rejected:** The authority has rejected the request.
- **Cancelled:** The request or confirmed booking has been cancelled according to the cancellation workflow.

These states apply to department-level requests. The event-level status is a derived summary of all its department-level requests and must distinguish partial approval from full approval.

### 8.3 Booking consistency rules

- A confirmed booking cannot overlap another confirmed booking for the same exclusive resource.
- Time intervals should use a consistent convention, such as start-inclusive and end-exclusive, so adjacent bookings can be handled correctly.
- The database must enforce consistency under concurrent transactions.
- A resource's availability must be rechecked before confirmation.
- A material change to an approved request requires a new version and renewed approval.
- Cancellation releases the booking according to the defined workflow but does not erase historical evidence.
- A blockchain failure must not be falsely presented as a confirmed blockchain record. The product must define how the application reports and reconciles a booking whose database confirmation succeeds but whose blockchain transaction is delayed or fails.

## 9. Technical Architecture

### 9.1 Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Authentication | Better Auth |
| Backend API | Python, FastAPI |
| Database | Neon PostgreSQL |
| Smart contracts | Solidity |
| Blockchain network | Ethereum Sepolia testnet |
| Blockchain integration | Web3.py |
| Documents | PDF generation and cryptographic signing |
| Testing | Frontend, API, database concurrency, signature verification, and contract tests |

### 9.2 Architecture responsibilities

**React frontend**
- Club, authority, administrator, and verification interfaces.
- Form validation and status presentation.
- Secure communication with backend APIs.

**Better Auth**
- Authentication and session lifecycle.
- Integration with the application's user identity and authorization model.

**FastAPI backend**
- Enforce permissions and workflow rules.
- Validate booking requests.
- Coordinate database transactions.
- Generate and manage permission letters.
- Verify digital signatures and document hashes.
- Interact with the blockchain and track transaction status.

**Neon PostgreSQL**
- Store operational entities, requests, approvals, bookings, versions, and audit metadata.
- Enforce data integrity and booking conflict prevention.

**Ethereum Sepolia**
- Store selected tamper-evident approval records and document hashes.
- Enable independent inspection of confirmed on-chain records.

### 9.3 Core data entities

The proposed data model includes:

- `User`
- `Club`
- `Department`
- `Resource`
- `Event`
- `DepartmentRequest`
- `RequestedResource`
- `Booking`
- `RequestVersion`
- `ApprovalDecision`
- `PermissionLetter`
- `AuditEvent`
- `BlockchainTransaction`
- `Notification`

The exact schema will be finalized during technical design. Foreign keys, indexes, authorization rules, and concurrency-safe booking constraints must be established before implementation.

## 10. Non-Functional Requirements

### Security
- Enforce backend authorization for every protected operation.
- Secure authentication sessions and API communication.
- Keep private keys and credentials out of source control and frontend code.
- Protect sensitive event and user information.
- Verify digital signatures and hashes server-side.
- Use appropriate access controls for stored documents.

### Reliability and consistency
- Prevent conflicting confirmed bookings, including concurrent attempts.
- Preserve request and approval history.
- Handle failed API calls, database transactions, and blockchain submissions safely.
- Avoid duplicate logical records when blockchain transactions are retried.

### Performance
Initial prototype targets:
- Common dashboard requests should have a target p95 response time of 2 seconds or less under the defined demonstration workload, excluding external blockchain confirmation and document-signing delays.
- Availability checks should complete within 1 second under the defined demonstration workload.
- Long-running document or blockchain operations should show explicit processing status rather than blocking the user indefinitely.

These are proposed targets to be measured, not claims about existing performance.

### Usability
- Make the current event and department-level request statuses easy to distinguish.
- Display useful conflict and validation messages.
- Minimize repeated data entry across departments.
- Make the current version of a permission letter easy to identify.

### Maintainability
- Separate authentication, booking, document, and blockchain responsibilities.
- Use version-controlled database migrations and smart-contract source code.
- Maintain automated tests for critical business rules.
- Keep blockchain integration replaceable without redesigning the entire booking interface.

### Privacy
- Keep personal information and full permission letters off-chain.
- Store only the minimum necessary metadata and hashes on the public testnet.
- Consider the persistence and public visibility of blockchain records when designing identifiers and metadata.

## 11. Success Metrics and Acceptance Targets

The following targets are proposed for the academic prototype. They must be validated through test scenarios and measured during evaluation.

| Metric | Target | Measurement method |
|---|---|---|
| Confirmed double bookings | 0 | Run overlapping booking and concurrent approval tests |
| Department grouping accuracy | 100% | Test events involving multiple departments and resources |
| Request status accuracy | 100% | Compare event-level summaries against department-level states |
| Approval audit completeness | 100% of tested decisions | Verify actor, timestamp, request version, and decision |
| Document integrity verification | 100% of test cases | Verify valid documents and detect modified files |
| Signature verification | All valid test signatures accepted; invalid or altered signatures rejected | Automated signature tests |
| Blockchain hash matching | All matching files verified; altered or mismatched files rejected | Compare test document hashes with confirmed records |
| Unauthorized approval attempts | 100% rejected in test cases | Test role and department access boundaries |
| Change-history preservation | 100% of tested material changes retain prior versions | Edit approved requests and inspect history |
| Booking conflict recovery | No invalid confirmed booking after concurrent attempts | Stress-test competing confirmations |
| Core workflow completion | At least 95% of scripted happy-path tests pass | End-to-end test suite |
| Dashboard response time | p95 ≤ 2 seconds under the agreed test workload | API and browser performance measurements, excluding external signing and chain confirmation |

### Product-level indicators

If pilot users are available, additionally measure:

- Average time taken to submit an event request.
- Average number of manual follow-ups required per event.
- Percentage of requests completed without data correction.
- Percentage of users who can locate and verify the current permission letter without assistance.
- Number of discrepancies discovered between the system record and issued permission documents.

Baseline measurements should be collected before claiming that the system reduces administrative effort.

## 12. Testing Strategy

### Functional tests
- Create, edit, submit, approve, reject, and cancel requests.
- Request resources from one or multiple departments.
- Generate department-wise requests and letters.
- Verify partial and full event approval statuses.

### Booking integrity tests
- Submit overlapping requests for the same resource.
- Attempt concurrent approval of conflicting requests.
- Confirm adjacent non-overlapping bookings work correctly.
- Verify that changing the time or resource triggers the appropriate revalidation.

### Authorization tests
- Attempt approval from an unauthorized account.
- Attempt access to another department's requests.
- Attempt modification of another club's event.
- Verify that the frontend cannot bypass backend permissions.

### Document tests
- Verify a correctly signed PDF.
- Modify a signed PDF and verify that the integrity check fails.
- Verify that superseded and cancelled letters are not presented as current.
- Confirm the document hash corresponds to the exact stored version.

### Blockchain tests
- Record an approval event on Sepolia.
- Confirm a transaction before displaying it as confirmed.
- Simulate pending, failed, and retried transactions.
- Verify hash matching and duplicate-event handling.
- Confirm no private information or full document contents are written on-chain.

### End-to-end acceptance scenario

1. Club A creates an event requiring Rooms 1, 2, 3, 4, and 5.
2. Rooms 1 and 4 are managed by Department A; Rooms 2, 3, and 5 by Department B.
3. The system creates two department-level requests and two permission letters.
4. Department A approves its request; Department B requests a correction.
5. The event is displayed as partially approved or awaiting completion, not fully approved.
6. The club corrects and resubmits Department B's request.
7. Department B approves the current version.
8. The system confirms the bookings only after successful availability validation.
9. The authorities issue the corresponding digitally signed letters.
10. The application records the selected approval events and signed-document hashes on Sepolia.
11. A verifier validates the signatures and hashes.
12. A modified PDF, a superseded letter, and an unauthorized approval attempt are correctly rejected or flagged.

## 13. Implementation Roadmap

### Phase 1 — Foundation
- Finalize requirements and role permissions.
- Set up React, FastAPI, Better Auth, and Neon.
- Define the data model and database migrations.
- Create the resource registry and user/department administration.

**Deliverable:** Authenticated application foundation with configured resources and roles.

### Phase 2 — Booking workflow
- Implement event creation and editing.
- Implement resource availability and conflict prevention.
- Implement department-wise request grouping.
- Add request statuses and event-level summaries.

**Deliverable:** Working multi-department booking workflow without blockchain dependencies.

### Phase 3 — Approval and audit
- Build authority dashboards.
- Implement approvals, rejections, correction requests, and cancellations.
- Implement request versioning and audit history.
- Add in-app notifications.

**Deliverable:** End-to-end digital request and approval workflow.

### Phase 4 — Permission letters
- Generate PDFs.
- Implement cryptographic digital signing and signature verification.
- Add document version and status management.
- Provide a verification interface.

**Deliverable:** Verifiable permission letters linked to approved request versions.

### Phase 5 — Blockchain integration
- Implement and test the Solidity contract.
- Deploy the contract to Sepolia.
- Integrate Web3.py with FastAPI.
- Record selected approval events and document hashes.
- Implement transaction status tracking, retry handling, and reconciliation.

**Deliverable:** Working blockchain-backed verification prototype.

### Phase 6 — Validation and demonstration
- Run end-to-end, security, and concurrency tests.
- Validate the acceptance scenario.
- Document the architecture, contract, limitations, and test results.
- Prepare the faculty demonstration and final report.

**Deliverable:** Tested academic prototype with documentation and a reproducible demo.

## 14. Risks and Mitigation

**Risk: Blockchain adds complexity without improving the booking workflow.**  
Mitigation: Establish database-backed booking correctness first and use blockchain only for a clearly defined verification requirement.

**Risk: A blockchain transaction fails after a booking is approved in the database.**  
Mitigation: Track the two states separately, implement retry and reconciliation, and define whether the product can issue a final permission letter before the required on-chain confirmation.

**Risk: Digital signing is confused with blockchain verification.**  
Mitigation: Use a real cryptographic signature for the permission letter and treat the blockchain hash as a separate integrity reference.

**Risk: Better Auth and FastAPI session integration is insecure or inconsistent.**  
Mitigation: Define a server-verifiable authentication integration before implementing protected APIs. Never rely on user identity or role values supplied directly by the browser.

**Risk: Concurrent requests produce a booking conflict.**  
Mitigation: Enforce booking integrity using PostgreSQL transactions and appropriate constraints or locking. Availability displayed in the UI is not sufficient by itself.

**Risk: Public blockchain data exposes sensitive information.**  
Mitigation: Store only the minimum necessary non-sensitive metadata and hashes on-chain. Keep full letters and personal details off-chain.

**Risk: The blockchain is presented as proof of physical approval.**  
Mitigation: Document that the chain records submitted actions and associated evidence; it cannot independently prove that an in-person signature or physical procedure occurred.

**Risk: The prototype overstates the value of blockchain compared with a conventional database.**  
Mitigation: Demonstrate independent verification of selected records and clearly explain the trust assumptions. Compare the blockchain layer with a conventional audit-log approach in the final evaluation.

## 15. Assumptions and Open Decisions

The following assumptions are used for this PRD:

- Each resource has one responsible department for approval routing.
- One event can involve multiple department-level requests.
- Each department-level request has its own status and permission letter.
- Pending requests do not reserve resources by default.
- Confirmed booking conflicts are prevented by the database-backed booking workflow.
- Authorities are assigned explicit approval permissions.
- A genuine cryptographic digital signature is required for the electronic permission letter.
- The application uses Neon PostgreSQL for operational data and Ethereum Sepolia for the academic blockchain prototype.
- Full permission letters and private data remain off-chain.

The following decisions should be finalized during technical design:

1. The exact Better Auth integration pattern for FastAPI.
2. The digital-signature format, signing authority, key management, and certificate verification model.
3. Whether an electronic permission letter may be issued while the blockchain transaction is pending, or only after confirmation.
4. The cancellation and release rules for already confirmed bookings.
5. The policy for competing pending requests and any temporary booking holds.
6. The approval hierarchy when a department has multiple authorized approvers.
7. The exact smart-contract data model and the events that must be recorded on-chain.
8. The deployment and storage arrangements for PDFs and other off-chain documents.

## 16. Definition of Done

The initial release will be considered complete when:

- Users can authenticate and access only their permitted features.
- Clubs can create events and request resources across multiple departments.
- Requests are grouped correctly and have independent department-level statuses.
- The system prevents overlapping confirmed bookings, including under concurrent attempts.
- Authorities can approve, reject, request corrections, and cancel requests according to the defined workflow.
- Material changes create a new version and preserve the previous history.
- Approved permission letters are cryptographically signed and independently verifiable.
- Modified, superseded, and cancelled documents are correctly identified.
- Selected approval events and document hashes can be verified on Sepolia.
- Blockchain transaction failures and pending states are represented accurately.
- Automated tests cover the critical acceptance scenarios.
- The architecture, security assumptions, limitations, and blockchain justification are documented for faculty evaluation.

## 17. Final Product Statement

The proposed system is a college resource-booking and permission-management application that combines reliable database-backed scheduling, department-wise approval workflows, cryptographically signed permission letters, and blockchain-backed verification.

Its primary operational responsibility is to make booking and approval processes consistent and accountable. Its blockchain component adds an independently verifiable record of selected approvals and document versions, rather than replacing the database or claiming to guarantee the truth of physical-world actions.

**The central design principle is to use each technology for the problem it is best suited to solve.**
