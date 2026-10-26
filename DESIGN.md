# Design Document: College Resource Booking and Permission Management System

## 1. Design direction

**Design concept: Institutional Control System**

The product should communicate three things immediately:

- **Control:** Resource availability and booking conflicts are handled systematically.
- **Accountability:** Every important approval, change, and cancellation has a traceable history.
- **Verification:** Permission documents can be checked against their signatures and recorded versions.

The visual identity takes cues from Outtake's restrained monochrome palette, strong typography, technical diagrams, thin rules, dense information layouts, and orange accents. It adapts these cues for an institutional workflow rather than a cybersecurity marketing website.

The application should feel closer to a carefully engineered operations console than a landing-page template.

### Design principles

1. Information before decoration.
2. Strong typography instead of oversized marketing claims.
3. Orange used sparingly to direct attention.
4. Thin borders and structured alignment instead of excessive shadows.
5. Real booking data and real product screenshots instead of stock or AI-generated imagery.
6. Clear, consistent controls across club, authority, and administrator screens.
7. Motion only when it explains a change or confirms an action.

## 2. Reference analysis

### Color language

Outtake's reference is predominantly monochromatic, using black, white, and grey with orange as a supporting accent. The design presents a technical character through contrast, grid-based composition, and outlined details.

**Application to this project:** Use charcoal for the navigation shell, off-white for the working canvas, white for primary surfaces, and a restrained orange for the principal action and selected interface elements.

Do not copy the original site's brand assets or exact page composition. Establish a separate identity for the college resource-management product.

### Layout

The reference uses strong section hierarchy and technical, diagram-oriented compositions. The site combines editorial sections with detailed product imagery.

**Application to this project:**
- Use a persistent sidebar for primary application navigation.
- Keep page titles and primary actions in a consistent header.
- Use tables for operational records.
- Use timelines for approval history.
- Use a calendar and structured time slots for resource availability.
- Use a resource-request summary for multi-department events.
- Use a split layout for reviewing a request alongside its associated letter and history.

### Typography

The reference is associated with Geist, Roobert, and Geist Mono.

**Application to this project:**
- Geist for headings, body text, forms, and navigation.
- Geist Mono for request identifiers, timestamps, transaction hashes, version numbers, and technical metadata.
- Clear typographic hierarchy, compact labels, and consistent numeric alignment.

Use typography to create the visual identity. Do not rely on decorative gradients, oversized rounded cards, or animated text.

### Component style

Adopt:
- Thin neutral borders.
- Small, consistent corner radii.
- Solid rectangular buttons.
- Restrained hover and focus states.
- Compact, readable tables.
- Clear text labels for status.
- Minimal shadows.
- Technical details presented in organized blocks.

Avoid:
- Purple gradients.
- Pill-shaped buttons.
- Floating glassmorphism panels.
- Decorative blockchain graphics that do not represent actual system behavior.
- Animated cursors.
- Fake dashboard activity.
- Fake customer logos, reviews, counters, or performance metrics.

## 3. Color system

The following palette is a proposed project palette inspired by the reference, not a claim about Outtake's exact CSS values.

| Token | Hex | Usage |
|---|---|---|
| Graphite | `#171717` | Sidebar, dark navigation, strong text |
| Ink | `#242424` | Headings and primary text |
| Paper | `#F5F5F2` | Application background |
| White | `#FFFFFF` | Tables, forms, dialogs, document surfaces |
| Border | `#D9D9D4` | Dividers, input borders, table boundaries |
| Muted | `#70706B` | Secondary text and metadata |
| Signal orange | `#E86A36` | Primary action and selected navigation |
| Orange tint | `#F9E9E1` | Subtle selection or informational emphasis |
| Success | `#237A50` | Approved and confirmed states |
| Warning | `#946318` | Pending review and caution |
| Error | `#B83A32` | Rejected, failed, or destructive states |
| Information | `#315D8A` | Neutral informational messages |

### Color rules

- Orange is an accent, not a page background.
- Use orange for one principal action per major screen where possible.
- Use semantic colors only for meaningful states.
- Never rely on color alone to communicate a status.
- Avoid gradients entirely in the initial design system.
- Verify text and control contrast against WCAG 2.2 AA requirements.

## 4. Typography system

**Primary family:** Geist  
**Technical family:** Geist Mono

| Element | Desktop specification |
|---|---|
| Page title | 30 to 36 px, semibold |
| Section heading | 20 to 24 px, semibold |
| Card or panel heading | 16 to 18 px, medium |
| Body text | 14 to 16 px, regular |
| Form labels | 13 to 14 px, medium |
| Table text | 13 to 14 px |
| Metadata | 12 to 13 px |
| IDs and hashes | 12 to 13 px, monospace |

Use compact line heights for headings and comfortable line heights for longer text. Avoid excessive letter spacing and all-caps body copy. Uppercase micro-labels may be used for genuine categories or technical annotations.

## 5. Layout system

### Application shell

Desktop layout:
- Sidebar width: approximately 232 px.
- Header height: approximately 64 px.
- Main content maximum width: approximately 1440 px.
- Main content padding: 28 to 36 px.
- Grid spacing: 16 to 24 px.
- Standard component radius: 4 to 8 px.
- Border thickness: 1 px.

These values are starting tokens and should be refined during responsive implementation.

### Wireframe

    +----------------------+-----------------------------------+
    | PRODUCT MARK         | Page title             User menu  |
    +----------------------+-----------------------------------+
    | Overview             |                                   |
    | My events            | Main content                      |
    | Resource availability|                                   |
    | Requests             | Tables, forms, calendar           |
    | Permission letters   | and approval details              |
    | Audit history        |                                   |
    |                      |                                   |
    | Settings             |                                   |
    +----------------------+-----------------------------------+

The sidebar remains stable while the main content changes. On mobile, it becomes an accessible navigation drawer with a clear open and close control.

### Content width

Avoid stretching tables and forms across unnecessarily wide screens. Use a clear content grid, align headings and actions consistently, and keep the most important decision information visible without excessive scrolling.

## 6. Component design

### Buttons

Use rectangular buttons with restrained corner radii.

- Primary: orange background, white text.
- Secondary: white background, neutral border, dark text.
- Tertiary: text button with a clear hover state.
- Destructive: red treatment reserved for actions such as cancellation or removal.
- Disabled: visibly unavailable, with a clear explanation when the reason is not obvious.

Button labels must state the action: "Create event", "Approve request", "Request corrections", "Download signed letter", or "Cancel booking".

Avoid vague labels such as "Continue" when the actual action can be named.

### Status indicators

Use compact rectangular labels with text and, where useful, a simple status icon.

Examples:
- Pending
- Needs correction
- Approved
- Rejected
- Cancelled
- Blockchain pending
- Blockchain confirmed
- Verification failed

Keep approval status separate from blockchain transaction status. An approved booking must not automatically imply that its blockchain transaction has been confirmed.

### Tables

Tables are the primary interface for requests, bookings, and audit history.

Use:
- Clear column headings.
- Consistent row heights.
- Left-aligned text and right-aligned numeric values where appropriate.
- Subtle horizontal dividers.
- Visible sorting and filtering controls where implemented.
- A clear empty state.
- Explicit loading and error states.
- Pagination when needed.

Do not use decorative charts or fake metrics when a table communicates the information more accurately.

### Forms

Forms should have visible labels, sensible grouping, inline validation, and clear error messages.

Use a structured multi-step form only when it reduces meaningful complexity. Event creation should allow the organizer to enter event details, select resources, review department grouping, and confirm submission.

Preserve entered values when validation fails.

### Cards and panels

Cards should group information with a clear purpose, such as event details, request status, or document verification. They should not be used to wrap every individual piece of text.

Use flat white surfaces, neutral borders, and restrained spacing. Shadows should be rare.

### Icons

Use a consistent outline icon set such as Lucide. Icons should communicate an action or recognizable object, not decorate headings.

Every icon-only control must have an accessible name and an appropriate focus state. Do not use emoji as interface icons.

## 7. Screen specifications

### 7.1 Public landing page

The landing page explains the product in concrete language.

Suggested headline:

**College resource booking, with clear approvals and verifiable records.**

Supporting copy:

"Create event requests, coordinate permissions across departments, and access signed permission letters from one place."

Primary action: "Sign in"

Secondary action: "How it works"

Sections:
1. What the system manages.
2. How department-wise requests work.
3. How approvals and signed letters are handled.
4. How document verification works.
5. Frequently asked questions.
6. Footer with Privacy Policy, Terms and Conditions, and contact information.

Use a real screenshot of the implemented product once available. If the interface is not ready, use a simple, accurate diagram made from native shapes and labels. Do not invent customer logos, testimonials, adoption statistics, or claims of institutional deployment.

### 7.2 Club dashboard

The dashboard should answer:
- Which requests require attention?
- Which events are fully approved?
- Which departments are still reviewing requests?
- Which permission letters are available?

Recommended layout:
- Page heading: "My events"
- Primary action: "Create event"
- Compact filters for event status, date, and department.
- Event table with event name, date, requested resources, approval summary, and next action.
- A clear pending-approval summary based on actual records.

Do not display fake counts, fabricated activity, or meaningless charts.

### 7.3 Create event and select resources

The workflow should use a structured form with:
- Event details.
- Date and time.
- Campus and resource selection.
- Capacity and equipment requirements.
- Department grouping preview.
- Final review before submission.

Show unavailable resources as unavailable with a clear reason when possible. Revalidate availability on the server during submission and again before confirmation.

### 7.4 Event details and department requests

Present one event with a separate section for each responsible department.

Each section contains:
- Department name.
- Requested rooms.
- Requested time.
- Request status.
- Current letter version.
- Last decision and any correction notes.
- Relevant actions.

A partially approved event must be clearly distinguished from a fully approved event.

### 7.5 Authority dashboard

Use a compact operational layout with:
- Pending requests.
- Upcoming confirmed bookings.
- Requests awaiting correction or review.
- Recent decisions.

These are live, database-backed lists, not fabricated metric cards.

The request review screen should place event details and resource availability alongside the decision panel. Authorities should be able to review the exact request version, inspect relevant history, and record a decision with an optional reason.

### 7.6 Permission-letter verification

The verification page should display:
- Letter identifier.
- Request and version identifiers.
- Digital signature verification result.
- Document hash match result.
- Current approval status.
- Cancellation or supersession status.
- Blockchain network and transaction status, where applicable.

Present the result as a clear sequence of checks. Never display a single green "Verified" result when one or more required checks have failed or remain unresolved.

### 7.7 Audit history

Use a chronological timeline or compact table.

Each entry should identify the action, actor, timestamp, relevant request version, and transaction reference when applicable.

The timeline should distinguish application events from confirmed on-chain events.

### 7.8 Authentication screens

Use a restrained layout with the product mark, a clear heading, labeled fields, and visible authentication errors. Avoid oversized promotional content around the login form.

The interface must remain compatible with Better Auth's chosen authentication flow, session management, and server-side authorization model.

## 8. Motion and interaction

Motion is functional, not decorative.

Permitted:
- Short hover transitions.
- Clear focus states.
- Small feedback transitions after an action.
- Loading indicators for real asynchronous operations.
- Expand and collapse transitions when they improve comprehension.

Avoid:
- Scroll-triggered entrance animations across every section.
- Cursor-following effects.
- Animated backgrounds.
- Parallax effects.
- Moving interface elements that distract from booking tasks.
- Animations that conceal loading delays or change layout unexpectedly.

Respect reduced-motion preferences. Core functionality must remain understandable and usable without animation.

## 9. Responsive behavior and accessibility

Support desktop, tablet, and mobile layouts.

- Tables must adapt through responsive columns, horizontal scrolling where appropriate, or a carefully designed compact layout.
- Forms must remain usable on narrow screens.
- Navigation must work with keyboard and touch.
- Focus indicators must remain visible.
- Form errors must be associated with their fields.
- Dialogs must support keyboard navigation and focus restoration.
- Important states must be communicated in text as well as color.
- Target WCAG 2.2 AA.

Test at narrow mobile widths, at 200% zoom, and with keyboard-only navigation.

## 10. Content and copy rules

The product voice is direct, calm, and specific.

Prefer:
- "Room unavailable for this time."
- "Department B has requested a correction."
- "This letter was superseded by version 3."
- "The blockchain transaction is still pending."
- "The signature could not be verified."

Avoid:
- "Revolutionizing campus experiences."
- "A seamless, next-generation ecosystem."
- "Trusted by thousands of institutions" without evidence.
- Generic AI-written paragraphs that do not explain the actual workflow.
- Claims that blockchain guarantees truth or prevents all fraud.

Use real product terminology consistently across navigation, buttons, notifications, documents, and audit records.

## 11. Data integrity and interface truthfulness

The visual design must reflect actual system behavior.

- Show only real database records and computed summaries.
- Do not invent booking activity, user counts, approval rates, testimonials, or performance metrics.
- Distinguish pending requests from confirmed bookings.
- Distinguish an application approval from a confirmed blockchain transaction.
- Distinguish a matching document hash from a valid digital signature.
- Distinguish historical approvals from current authorization.
- Show errors when a real operation fails instead of presenting success by default.
- Never label an event fully approved while a required department-level request remains unresolved.

## 12. Brand and launch requirements

A launch is blocked until all of the following are complete:

- [ ] Custom domain connected and tested.
- [ ] HTTPS configured and working.
- [ ] Favicon created and visible in the browser.
- [ ] Product title and metadata configured.
- [ ] All "Made with AI" or similar builder branding removed where permitted.
- [ ] Privacy Policy page published and linked in the footer.
- [ ] Terms and Conditions page published and linked in the footer.
- [ ] Legal copy reviewed for the actual service and data practices.
- [ ] No fake reviews, customer counters, adoption metrics, or unsupported claims.
- [ ] No placeholder links or unfinished public-facing sections.
- [ ] All forms, navigation links, and key actions tested.
- [ ] Responsive layout and accessibility checks completed.
- [ ] Authentication, authorization, and document-verification paths tested.
- [ ] Production error handling and environment configuration reviewed.

Legal pages must describe the actual product, data collection, storage, retention, and applicable terms. They must not be generated as generic placeholders and published without review.

## 13. Technical design tokens

Implement the approved palette, typography, spacing, radii, and semantic states as shared design tokens.

Use one canonical source for design values, then map them to CSS variables and reusable components. Do not independently hardcode colors and spacing across screens.

Recommended token groups:
- Color.
- Typography.
- Spacing.
- Borders and radii.
- Focus rings.
- Elevation.
- Layout widths.
- Motion duration.
- Semantic status colors.

Shared components should include buttons, form fields, tables, status labels, dialogs, toasts, page headers, empty states, loading states, and error messages.

## 14. Design quality assurance

Before release, review every screen for:
- Correct content and labels.
- Consistent typography and spacing.
- Accurate status representation.
- Working links and controls.
- Keyboard and screen-reader usability.
- Responsive layout.
- Correct loading, empty, error, and success states.
- No invented metrics or placeholder content.
- No accidental gradients, pill-shaped controls, emoji icons, or decorative motion.
- No exposed secrets or sensitive data.
- Correct permission and verification behavior.

Run formatting, type checks, automated tests, production builds, and a manual browser review. Record actual results and fix discovered defects before declaring the product ready.

## 15. Final design statement

The College Resource Booking and Permission Management System should look like a precise institutional operations product: monochrome surfaces, technical typography, disciplined grids, clear tables, subtle orange accents, and honest system states.

The design succeeds when users can identify available resources, understand approval status, resolve conflicts, and verify permission letters without visual noise or ambiguity.

The product must never imply that an action succeeded, a document is valid, or an event is approved unless the underlying system can support that claim.
