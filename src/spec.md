# Specification

## Summary
**Goal:** Enforce canonical WCA Ao5 scoring/inspection penalties on the server, and fix start/resume of an existing event session so users can fetch scrambles and continue solving.

**Planned changes:**
- Add/ensure Motoko backend Ao5 validation as the single source of truth for leaderboard/scoring: drop best & worst of 5, include +2 in time, handle DNF, and set Ao5 to DNF when there are 2+ DNFs.
- Add/ensure backend enforcement of WCA inspection overage rules per attempt: apply +2 when start is in \[15s, 17s) and mark DNF when >= 17s; reject/normalize client submissions so these penalties cannot be bypassed.
- Fix the start/resume flow for an already in-progress (competitionId, event) session so a valid session token is returned/available to the frontend, enabling scramble fetch for the correct attempt index.
- Update frontend session handling to store session tokens in sessionStorage for both new and resumed sessions; if solve route is opened without a valid token, show an English-only message instructing the user to return and start/resume again.

**User-visible outcome:** Leaderboard results reflect server-validated WCA Ao5 rules (including inspection overage penalties), and users who resume an active event session can access the scramble and continue the solve flow without getting stuck.
