# Specification

## Summary
**Goal:** Enable a secure Razorpay live payment flow (server-side order creation + server-side verification) to gate access to paid competition events, and add a Profile view where users can see their payment/purchase history.

**Planned changes:**
- Add authenticated backend APIs to create Razorpay orders for a specific (competitionId, event) and return order details required for checkout (order id, amount, currency).
- Add authenticated backend API to verify/confirm payments by validating Razorpay signatures server-side before recording a purchase as verified.
- Persist payment records per (competitionId, caller, event) including amount, currency, Razorpay order/payment ids, verification status, and timestamp; add an authenticated query for the caller’s payment history (most recent first).
- Update frontend paid-event purchase/start flow to use backend-created order_id and handle processing/error states in English.
- Add Profile UI Payments/Purchases section that loads and displays the user’s purchase history (competition name via lookup where possible, event, amount/currency, timestamp, status) with empty/error states in English.
- Add/strengthen frontend guards so direct navigation to paid solve flows without verified payment shows an English payment-required message and a path back to competition details to pay/start.

**User-visible outcome:** Users must complete a verified Razorpay live payment before starting/accessing paid competition events, can’t bypass payment by direct navigation, and can view their Payments/Purchases history and statuses in their Profile.
