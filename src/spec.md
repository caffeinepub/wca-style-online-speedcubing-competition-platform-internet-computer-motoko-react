# Specification

## Summary
**Goal:** Expand admin authorization to allow competition creation for an additional allowlisted email and for a specific MCUBES user ID, and update frontend messaging to reflect multiple admins.

**Planned changes:**
- Backend: Update admin-check logic to treat a caller as admin if their stored email is allowlisted (including `midhun.speedcuber@gmail.com` and `thiirdparty.mcubes@gmail.com`) or if their stored `mcubesId` is exactly `MCUBES-0`.
- Backend: Ensure `createCompetition` returns `Unauthorized` for callers who match neither the email allowlist nor the `mcubesId` rule.
- Frontend: Adjust AdminGuard/access-denied messaging to indicate the admin page is restricted to allowlisted administrators (plural), while continuing to block non-admin access based on backend admin status.

**User-visible outcome:** Allowlisted administrators (by email or `mcubesId=MCUBES-0`) can access the admin competition creation page and successfully create competitions; non-admin users see an English access-denied message and cannot access competition creation.
