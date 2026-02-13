# Specification

## Summary
**Goal:** Fix remaining Admin-side errors by removing stubbed frontend hooks and wiring the Admin UI to real Motoko backend admin APIs for competitions, users, and results visibility.

**Planned changes:**
- Backend: expose/implement the admin-only canister methods required by the existing Admin pages (competition create/update/delete, lock/unlock, activate/deactivate; users list/block/unblock/delete; results list with `isHidden` and hide/unhide toggle), enforcing the existing allowlisted-admin rule and returning clear English errors.
- Frontend: update `frontend/src/hooks/useQueries.ts` to replace admin placeholder queries/mutations with real calls to the backend actor and invalidate/refetch relevant React Query keys on success.
- Frontend: add visible, inline error states (with normalized English error text and a Retry action) for AdminGuard, Admin competitions list, Admin users list, and Admin results list when queries/mutations fail.

**User-visible outcome:** Admin pages no longer fail with “Backend method not available” or appear stuck loading; admins can manage competitions, users, and result visibility end-to-end with clear English error messages and retry options on failure.
