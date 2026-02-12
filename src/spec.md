# Specification

## Summary
**Goal:** Add two new competition pricing models (base+additional-event and all-events-flat) while keeping existing per-event pricing behavior intact.

**Planned changes:**
- Extend the backend Competition/CompetitionPublic pricing fields to support three fee modes: per-event, base+additional-event, and all-events-flat.
- Update competition create/update APIs to accept and persist the new pricing mode and amounts, and keep existing scrambles/events validation unchanged.
- Update backend paid-access enforcement and Razorpay order amount calculation to charge based on the selected fee mode and the user’s purchase state (including preventing repurchase of already-paid events).
- Add upgrade/migration handling as needed so existing competitions using `entryFee` continue to behave as per-event fee after upgrade.
- Update admin competition create/edit UI to select a fee mode and configure required amounts with English-only validation messages.
- Update public competition detail payment/start UI to display an English fee summary for the selected mode and use the backend-returned payable amount, preserving the existing “Payments are temporarily unavailable…” behavior when Razorpay is not configured.

**User-visible outcome:** Admins can configure competitions with per-event, first+extra-event, or all-events-flat pricing; users see the correct fee description and are charged the correct amount (or continue to see the existing “payments not configured” message when applicable).
