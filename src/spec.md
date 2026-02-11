# Specification

## Summary
**Goal:** Fix competition creation authorization by updating the backend allowlisted admin email to the correct address.

**Planned changes:**
- Update the allowlisted admin email constant in `backend/main.mo` from `"miidhun.speedcuber@gmail.com"` to `"midhun.speedcuber@gmail.com"` so `isAllowlistedAdmin` checks the correct value.
- Keep authorization behavior unchanged for any other stored email values (including the old misspelled one).

**User-visible outcome:** An admin user whose stored email is `midhun.speedcuber@gmail.com` can successfully create competitions; users with any other stored email remain unauthorized as before.
