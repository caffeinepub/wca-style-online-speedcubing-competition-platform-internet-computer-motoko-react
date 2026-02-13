# Specification

## Summary
**Goal:** Ensure SolveFlow refresh recovery resumes on the correct next attempt after an auto-DNF, and prevent re-solving attempts already marked DNF or already submitted.

**Planned changes:**
- Update backend refresh recovery so a refresh during attempt N persists attempt N as DNF, advances the session to the next eligible attempt (N+1), and rejects any duplicate/overwrite submissions for attempts that already have a stored time or DNF marker.
- Update SolveFlowPage attempt header and refresh messaging to always reflect the server-reported next eligible attempt (1-based), with English-only text (e.g., “Attempt N was marked DNF because the page was refreshed. Continuing with attempt N+1.”).
- Ensure the post-refresh UI loads the scramble and timing flow only for the next eligible attempt and surfaces clear English errors via existing error normalization when applicable.

**User-visible outcome:** After refreshing mid-attempt, the app clearly tells the user which attempt was marked DNF and correctly continues at the next attempt (e.g., shows “Attempt 3 of 5”), without allowing the user to re-run or re-submit an already-DNF’d (or already-submitted) attempt.
