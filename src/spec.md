# Specification

## Summary
**Goal:** Ensure that refreshing/reloading during an in-progress solve attempt automatically records that attempt as DNF and continues the user to the next attempt, with the Solve Flow UI reflecting and explaining the change.

**Planned changes:**
- Backend: On the next session-state retrieval after a refresh/reload, detect if the authenticated user had an in-progress attempt and persist a DNF for that attempt using the existing DNF marker convention, then advance `currentAttempt` by 1.
- Backend: Make the refresh-triggered auto-DNF behavior idempotent so repeated session-state fetches do not create multiple DNFs for the same attempt index.
- Backend: Ensure no auto-DNF occurs on refresh when the session is between attempts or already completed.
- Frontend (Solve Flow): On page load, fetch server session state using the existing session token from `sessionStorage` and set attempt index/phase from the server response (not only local state).
- Frontend (Solve Flow): If the backend indicates an attempt was auto-marked DNF due to refresh, show an English-only notification explaining what happened and that the flow is continuing with the next attempt; ensure messages/errors remain English-only and use `normalizeError` where applicable.
- Frontend (Solve Flow): After refresh, ensure the scramble and attempt counter reflect the advanced attempt index.

**User-visible outcome:** If a user refreshes during an attempt, that attempt is recorded as DNF automatically and the Solve Flow resumes on the next attempt, with a clear English message explaining the auto-DNF and continuation.
