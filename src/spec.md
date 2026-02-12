# Specification

## Summary
**Goal:** Let users set optional country and gender on their profile, and ensure the leaderboard shows competitors’ profile display names instead of always “Anonymous”.

**Planned changes:**
- Extend the backend `UserProfile` model to include optional `country` and `gender`, preserving compatibility with existing stored profiles (add migration only if required).
- Update backend profile create/save flows to initialize and persist `country` and `gender`.
- Add a backend query API to fetch another user’s public profile info (at minimum `displayName`, plus `country`/`gender` when available) by Principal without allowing mutation or exposing emails.
- Add a Profile section in the UI for authenticated users to view/edit `displayName`, `country`, and `gender`, with English labels and clear “Not set” placeholders.
- Update leaderboard UI loading/display to resolve and show competitor `displayName` when present, falling back to “Anonymous” only when missing/empty, without authorization-related errors.

**User-visible outcome:** Authenticated users can edit their display name, country, and gender in a Profile section, and the leaderboard displays competitors’ names when they’ve set a display name (otherwise shows “Anonymous”).
