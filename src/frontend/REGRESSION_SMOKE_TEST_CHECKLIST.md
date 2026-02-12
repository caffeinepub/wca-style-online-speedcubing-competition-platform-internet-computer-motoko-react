# Regression Smoke Test Checklist

This checklist validates the core functionality after deployment to ensure no regressions have been introduced.

## Prerequisites
- Application deployed and accessible
- At least one admin account configured (email in allowlist: midhun.speedcuber@gmail.com or thirdparty.mcubes@gmail.com, or mcubesId == MCUBES-0)
- Internet Identity authentication working

## Test Steps

### 1. Authentication & Admin Access
- [ ] Log in with Internet Identity using an admin-allowlisted account
- [ ] Verify "Admin" navigation link appears in header after login
- [ ] Navigate to `/admin` - should show Admin Dashboard (not Access Denied)
- [ ] Navigate to `/admin/users` - should load (not Access Denied)
- [ ] Navigate to `/admin/competitions` - should load (not Access Denied)
- [ ] Navigate to `/admin/results` - should load (not Access Denied)
- [ ] Log out and log in with a non-admin account
- [ ] Verify "Admin" link does NOT appear in header
- [ ] Attempt to navigate to `/admin` - should show Access Denied screen

### 2. Public Competitions List
- [ ] Navigate to `/competitions` or `/` (home page)
- [ ] If competitions exist in the system, verify they are displayed (not an empty state)
- [ ] Verify competitions are organized by status (Running, Upcoming, Completed)
- [ ] Click on a competition card - should navigate to competition detail page

### 3. Admin Competition Creation
- [ ] Log in as admin
- [ ] Navigate to `/admin/competitions`
- [ ] Click "Create Competition" button
- [ ] Fill out the competition form with valid data (name, dates, events, scrambles)
- [ ] Submit the form
- [ ] Verify success toast appears
- [ ] Verify new competition appears in the admin competitions list
- [ ] Navigate to `/competitions` (public list)
- [ ] Verify new competition appears in the public competitions list

### 4. Leaderboard Display
- [ ] Ensure at least one competition has completed results (status = completed)
- [ ] Navigate to that competition's leaderboard page
- [ ] Select an event from the dropdown
- [ ] Verify leaderboard displays results (not an empty state)
- [ ] Verify competitor names show their display name (not "Anonymous" unless profile is missing)
- [ ] Verify hidden results do NOT appear on the public leaderboard
- [ ] Verify results show Ao5 and individual attempt times

### 5. Admin Users List
- [ ] Log in as admin
- [ ] Navigate to `/admin/users`
- [ ] Verify existing users are displayed (not an empty list)
- [ ] Verify user cards show display name, principal, and email (if set)
- [ ] Verify Block/Unblock buttons are present and functional
- [ ] Verify Delete button is present
- [ ] Click "View History" on a user - should open solve history dialog

## Expected Results
- All admin pages load successfully for allowlisted admins
- Public competitions list shows existing competitions when they exist
- Admin can create competitions and they appear in both admin and public lists
- Leaderboards display completed results with correct competitor names
- Admin users list shows existing users with functional action buttons
- Non-admin users are blocked from admin pages with Access Denied screen

## Notes
- If any step fails, document the exact error message and browser console output
- Check browser network tab for failed API calls
- Verify backend canister is running and accessible
