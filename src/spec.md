# Specification

## Summary
**Goal:** Ensure the paid competition Pay button on the Competition Detail page never becomes a silent no-op, and instead always shows loading, opens Razorpay Checkout, or displays a clear English error.

**Planned changes:**
- Update the Pay click handler in `frontend/src/pages/CompetitionDetailPage.tsx` to replace the current early-return guard with explicit user-facing feedback when prerequisites are missing (competition data, entry fee, or user profile not loaded/created).
- Improve Pay button disabled/loading states to reflect payment configuration checks: disable with an inline “Checking payments…” state while `useIsRazorpayConfigured()` is loading, and keep disabled with the existing `paymentError` when Razorpay is not configured.
- Ensure unexpected errors in the payment-start flow are surfaced to the user via `normalizeError(error)` (toast and/or page alert), rather than being swallowed.
- Add minimal console diagnostics (non-sensitive) for the payment click path and step boundaries (script load, order creation, checkout open, confirmation), with `console.error` on failures.

**User-visible outcome:** Clicking Pay on a paid competition always results in a visible state change (disabled/loading), Razorpay Checkout opening, or a clear English message explaining what’s missing or what failed—never an idle button that does nothing.
