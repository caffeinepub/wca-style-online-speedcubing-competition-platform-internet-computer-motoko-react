# Specification

## Summary
**Goal:** Build a WCA-style online speedcubing competition platform on the Internet Computer with Internet Identity login, admin-managed competitions, a 5-solve timed flow (with WCA inspection rules), and per-competition leaderboards.

**Planned changes:**
- Add Internet Identity authentication and per-Principal user profiles with editable display names; require login for starting competitions and submitting solves.
- Implement Motoko backend persistence (single actor) for Users, Competitions (with event identifier), Scrambles (exactly 5 per competition), and Results (one per user per competition) with stable storage across upgrades.
- Add admin-only competition management to create competitions (name, unique slug, start/end dates, status, optional participant limit) and store 5 scrambles; non-admin users can only read.
- Implement participation lifecycle: competition intro + “Start Competition” (idempotent), create/lock a user’s result, and prevent re-joining, restarting, or resetting.
- Build solve flow UI: dark/minimal timer-focused interface; 15s inspection (penalties: +2 for 15–17s, DNF for >17s), client-side solve timer, one scramble at a time, submit each attempt, and prevent backtracking.
- Enforce server-side integrity for submissions: authenticated caller only, mutate own result only, validate competition state and expected attempt index, idempotency, and clear error responses.
- Add competition leaderboard: completed results only, compute Average of 5 (drop best/worst; DNF handling applied consistently), sort best-first with DNFs last, and paginate with backend paged queries.
- Add in-session UX safeguards: warn on refresh/close, confirm on in-app navigation away during in-progress solves, and block UI access to previous attempts.
- Set and apply a consistent dark visual theme across pages with a non-blue/non-purple primary accent color.
- Structure backend API methods and frontend React Query data layer to be extendable for future multi-event support and future payments/webhooks (not implemented now).

**User-visible outcome:** Users can browse competitions, log in with Internet Identity, set a display name, start a competition once, complete a locked 5-solve session with WCA-style inspection and timing, and view a paginated leaderboard; admins can create/manage competitions and scrambles.
