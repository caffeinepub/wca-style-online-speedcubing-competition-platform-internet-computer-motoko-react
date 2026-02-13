# Specification

## Summary
**Goal:** Fix admin and public pages that are stuck loading or crashing, ensuring competition edit, admin users/results management, and the public leaderboard reliably load real data and show stable English error states when failures occur.

**Planned changes:**
- Update `/admin/competitions/$competitionId/edit` to fetch a full competition record by `competitionId` before building any scrambles/event mappings, so the form never crashes on missing fields and always loads existing competition data (events, feeMode, registrationStartDate, per-event scrambles).
- Add validation and a clear English error state on the competition edit page when scrambles are missing/invalid, and block saving until required data is valid (instead of crashing).
- Replace/remove any admin Users/Results React Query stubs/disabled hooks that cause perpetual loading, wiring the pages to real backend admin actor methods and ensuring loading resolves to either real data or a stable English error state.
- Ensure required backend admin actor methods exist/are restored to support existing admin users actions (block/unblock, delete, view solve history, reset competition status) and admin results actions (list by competition+event, toggle hidden/visible, export CSV).
- Fix the public leaderboard query/backend integration so it uses the intended leaderboard/results API, filters to completed + non-hidden results, and resolves from loading to results, “no results” messaging, or a stable English error state (no infinite spinner).

**User-visible outcome:** Admins can open competition edit without crashes and see the correct existing data; admin Users and Results pages load and actions work end-to-end; the public leaderboard reliably loads and shows completed, non-hidden results (or a clear English message/error instead of spinning forever).
