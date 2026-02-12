# Specification

## Summary
**Goal:** Deploy a new backend canister, update `frontend/public/env.json` with the new `BACKEND_CANISTER_ID`, and re-run the go-live deployment flow successfully.

**Planned changes:**
- Deploy a new backend canister and capture the newly created canister ID.
- Update `frontend/public/env.json` to set `BACKEND_CANISTER_ID` to the new backend canister ID (replacing the placeholder).
- Re-run the go-live build + deploy flow and confirm it completes without errors and without the preflight failure about missing `BACKEND_CANISTER_ID`.

**User-visible outcome:** The Admin Go Live process completes end-to-end without being blocked by a missing `BACKEND_CANISTER_ID`, and deployment/preflight messaging remains English-only.
