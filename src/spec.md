# Specification

## Summary
**Goal:** Enable admins to both hide and unhide leaderboard results in Admin Results Management, with the UI accurately reflecting the persisted hidden state for each result row.

**Planned changes:**
- Update the backend admin results listing to return an explicit per-result boolean hidden flag (persisted server-side) indicating whether the result is currently hidden.
- Update `/admin/results` UI to use the backend-provided hidden flag (not a frontend-derived guess) to render the correct action/state per row.
- Update the visibility action so it toggles both ways: set `hidden=true` when visible, and set `hidden=false` when hidden, with English-only UI strings (e.g., tooltips/toasts).

**User-visible outcome:** In `/admin/results`, each result row clearly shows whether it is hidden or visible, and admins can reliably hide or unhide a result with the correct action still available after reload.
