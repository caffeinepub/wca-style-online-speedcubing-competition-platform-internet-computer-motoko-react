# Regression & Smoke Test Checklist

This document contains manual verification steps for critical user flows and features.
Run these tests before marking a build as production-ready.

## Authentication & Profile Setup

- [ ] **Login Flow**
  - Open app in incognito/private window
  - Click "Login" button
  - Complete Internet Identity authentication
  - Verify successful login (user menu appears)

- [ ] **Profile Setup (First-Time User)**
  - After first login, profile setup dialog should appear
  - Enter display name and email
  - Submit profile
  - Verify profile is saved (no re-prompt on refresh)

- [ ] **Profile Setup Modal Flash Prevention**
  - Log in as existing user with profile
  - Verify profile setup modal does NOT flash/appear
  - Check that user goes directly to main app view

- [ ] **Logout**
  - Click logout from user menu
  - Verify redirect to login screen
  - Verify all cached data is cleared

## Competition Flow

- [ ] **Browse Competitions**
  - View competitions list page
  - Verify competitions are grouped by status (running, upcoming, completed)
  - Click on a competition card
  - Verify competition detail page loads

- [ ] **Payment Flow (Paid Competition)**
  - Select a paid event
  - Click "Pay & Start"
  - Complete Razorpay payment (or cancel)
  - Verify payment confirmation
  - Verify "Start Solving" button appears after payment

- [ ] **Free Competition**
  - Select a free event
  - Verify "Start Solving" button appears immediately (no payment)

## Solve Flow - Critical Path

### Inspection Timer
- [ ] **15-Second Countdown**
  - Start a solve session
  - Observe inspection timer counting down from 15 to 0
  - Verify countdown does NOT freeze or skip numbers
  - Verify countdown completes and transitions to solving phase

- [ ] **Inspection Penalties**
  - Start inspection
  - Wait 15-17 seconds before starting solve
  - Verify +2 penalty is applied and displayed
  - Start inspection again
  - Wait >17 seconds before starting solve
  - Verify DNF is applied

### Per-Attempt Persistence & Refresh Recovery
- [ ] **Complete Attempt 1**
  - Complete first solve
  - Verify time is recorded
  - Verify UI shows "Attempt 2 of 5"

- [ ] **Refresh During Attempt 2 (After Attempt 1 Complete)**
  - Start attempt 2 (begin inspection or solving)
  - Refresh the page (F5 or Cmd+R)
  - **Expected behavior:**
    - Alert message: "Attempt 2 was marked DNF because the page was refreshed. Continuing with attempt 3."
    - UI shows "Attempt 3 of 5" (NOT "Attempt 1 of 5")
    - Scramble shown is for attempt 3
    - Previous attempts section shows attempt 1 time and attempt 2 as DNF
  - Verify user CANNOT re-solve attempt 2
  - Complete attempt 3 normally
  - Verify attempt 3 is recorded correctly

- [ ] **Refresh During Attempt 1 (Before Any Completion)**
  - Start a new session
  - Begin attempt 1 (inspection or solving)
  - Refresh the page
  - **Expected behavior:**
    - Alert message: "Attempt 1 was marked DNF because the page was refreshed. Continuing with attempt 2."
    - UI shows "Attempt 2 of 5"
    - Scramble shown is for attempt 2
    - Previous attempts section shows attempt 1 as DNF
  - Complete attempt 2 normally
  - Verify attempt 2 is recorded correctly

- [ ] **No Refresh - Normal Flow**
  - Complete all 5 attempts without refreshing
  - Verify each attempt is recorded
  - Verify progression: 1→2→3→4→5
  - Verify completion screen appears after attempt 5

### Auto-Completion After 5th Attempt
- [ ] **5th Attempt Auto-Complete**
  - Complete attempts 1-4 normally
  - Complete attempt 5
  - Verify completion screen appears automatically
  - Verify NO "Next Attempt" or "Continue" button is needed
  - Verify user is shown completion message and next steps

### Solve Timer
- [ ] **Timer Accuracy**
  - Start solve timer
  - Let it run for ~10 seconds
  - Stop timer
  - Verify displayed time is accurate (within 100ms)

- [ ] **Timer Display**
  - Verify timer shows format: "0.00s" or "12.34s"
  - Verify large, readable font
  - Verify start/stop controls are accessible

## Leaderboard

- [ ] **View Competition Leaderboard**
  - Navigate to a completed competition
  - View leaderboard for an event
  - Verify results are sorted by Ao5 (best first)
  - Verify individual attempt times are displayed
  - Verify DNF attempts show as "DNF"

- [ ] **Leaderboards Hub**
  - Navigate to /leaderboards
  - Verify all competitions are listed
  - Click on a competition
  - Verify leaderboard page loads

- [ ] **Public Profile from Leaderboard**
  - Click on a competitor name in leaderboard
  - Verify public profile page loads
  - Verify stats and personal records are displayed

## Admin Features (Admin Users Only)

- [ ] **Admin Access**
  - Log in as admin user
  - Verify "Admin" link appears in header
  - Navigate to admin dashboard
  - Verify admin sections are accessible

- [ ] **Create Competition**
  - Navigate to admin → Create Competition
  - Fill in all required fields
  - Add events and scrambles
  - Submit form
  - Verify competition is created

- [ ] **Manage Results**
  - Navigate to admin → Results
  - Select a competition and event
  - Verify results list loads
  - Toggle hide/unhide on a result
  - Verify leaderboard reflects change

## Error Handling

- [ ] **Network Error**
  - Disconnect network
  - Attempt to load a page
  - Verify user-friendly error message
  - Reconnect network
  - Verify retry works

- [ ] **Invalid Competition ID**
  - Navigate to /competitions/99999
  - Verify "Competition not found" error
  - Verify "Back to Competitions" button works

- [ ] **Session Expiry**
  - Start a solve session
  - Wait for session to expire (if applicable)
  - Attempt to continue
  - Verify appropriate error message

## Responsive Design

- [ ] **Mobile View**
  - Open app on mobile device or resize browser to mobile width
  - Verify header navigation is accessible
  - Verify solve timer is readable
  - Verify buttons are tappable

- [ ] **Tablet View**
  - Resize browser to tablet width
  - Verify layout adapts appropriately
  - Verify all features are accessible

## Dark Mode

- [ ] **Theme Toggle**
  - Toggle between light and dark mode
  - Verify all pages render correctly in both modes
  - Verify text contrast is readable
  - Verify colors are appropriate for theme

## Browser Compatibility

- [ ] **Chrome/Edge**
  - Test all critical flows in Chrome or Edge
  - Verify no console errors

- [ ] **Firefox**
  - Test all critical flows in Firefox
  - Verify no console errors

- [ ] **Safari**
  - Test all critical flows in Safari
  - Verify no console errors

---

## Notes

- Mark each item as complete `[x]` after verification
- Document any issues found in a separate bug tracker
- Re-test after fixes are applied
- This checklist should be updated as new features are added
