# Specification

## Summary
**Goal:** Correct WCA inspection penalty timing so inspection duration is measured only from inspection start to solve start (excluding solve time).

**Planned changes:**
- Record an `inspectionStart` timestamp when inspection begins (InspectionTimer onStart).
- Record a `solveStart` timestamp when the solve timer starts and compute inspection duration as `(solveStart - inspectionStart)` for penalty logic.
- Trigger existing +2 and DNF toasts based on the corrected inspection duration thresholds (>=15s & <17s = +2; >=17s = DNF), without changing other solve/session/navigation behavior.

**User-visible outcome:** Inspection penalties (+2 or DNF) are applied based solely on how long the user took before starting the solve, not including the time spent solving.
