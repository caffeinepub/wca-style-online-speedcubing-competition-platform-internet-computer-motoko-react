# Specification

## Summary
**Goal:** Add an optional registration start date for upcoming competitions that blocks start/payment until the date is reached, and automatically transitions the competition to Running when registration opens.

**Planned changes:**
- Backend: Add optional `registrationStartDate` to competition DTOs/inputs and store it per competition; ensure existing competitions behave unchanged when the field is missing/unset.
- Backend: Enforce gating so that when status is Upcoming and `now < registrationStartDate`, starting a session and initiating any paid-entry flow are rejected with a clear error.
- Backend: Auto-transition competitions from Upcoming to Running when `now >= registrationStartDate`, triggered during normal reads and/or participation-related calls (no scheduled jobs).
- Frontend (Admin): Add/edit a `datetime-local` Registration Start Date field on admin create/edit competition pages and send it in competition create/update payloads.
- Frontend (Public detail): On competition detail, when Upcoming and registration is not yet open, disable the Start/Pay CTA and show “Registration opens at <date>”, while still allowing viewing the page and selecting events.

**User-visible outcome:** Admins can set a registration start date for upcoming competitions; users can view those competition pages but cannot start or pay until registration opens, after which the competition automatically becomes Running and the CTA works as before (subject to existing rules).
