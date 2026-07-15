# Move `useProfileExpanded` from localStorage to Cookie

## Context

Profile headers (clinic, patient, user, clinician, prescription) persist their expanded/collapsed state in localStorage. Because localStorage is client-only, the server renders collapsed, then the client syncs after hydration — causing a visible flash where the header collapses then re-expands on refresh.

We just moved the sidebar preference to a cookie, which eliminated its flash. This plan applies the same pattern to profile expanded state, using a single cookie that stores all 5 profile types as a JSON map.

## Approach

Mirror the sidebar cookie pattern: session cookie → action route → context provider → hook reads context.

### 1. Add cookie session — `app/sessions.server.ts`

Add `profileExpandedSession` export using `createCookieSessionStorage` with cookie name `__profile-expanded`, following the `sidebarSession` pattern.

### 2. Create action route — `app/routes/action.set-profile-expanded.ts` (new)

Pattern: `app/routes/action.set-sidebar.ts`

- Accepts `profileType` and `expanded` from form data
- Reads existing session, gets the stored map (default `{}`)
- Updates `map[profileType] = expanded === 'true'`
- Commits session with `Set-Cookie` header

### 3. Create context — `app/contexts/ProfileExpandedContext.tsx` (new)

Pattern: `app/contexts/SidebarExpandedContext.tsx`

- `ProfileExpandedProvider` accepts `initialExpandedMap: Record<string, boolean>` + `children`
- Internal `useState(initialExpandedMap)` holds the map
- `useFetcher()` for fire-and-forget persistence to `/action/set-profile-expanded`
- `setProfileExpanded(profileType, expanded)` updates state optimistically + submits fetcher
- Export `useProfileExpandedContext()` consumer hook with the standard guard

### 4. Wire into root — `app/root.tsx`

- Import `profileExpandedSession` from `./sessions.server`
- Import `ProfileExpandedProvider` from `./contexts/ProfileExpandedContext`
- **Loader**: read cookie, extract map: `profileExpandedCookie.get('expanded') || {}`; add `profileExpandedMap` to return
- **AppWithProviders**: destructure `profileExpandedMap`, wrap with `<ProfileExpandedProvider initialExpandedMap={profileExpandedMap}>`

### 5. Rewrite hook — `app/hooks/useProfileExpanded.ts`

Replace localStorage implementation with context consumption:

- Import `useProfileExpandedContext`
- `defaultExpanded = profileExpandedMap[profileType] ?? false`
- `onExpandedChange` calls `setProfileExpanded(profileType, expanded)`
- Return type `{ defaultExpanded, onExpandedChange }` stays identical

### 6. Revert ProfileHeader useEffect — `app/components/ui/ProfileHeader.tsx`

Remove the `useEffect([defaultExpanded])` sync and the `useEffect` import we added earlier. With the cookie approach, `defaultExpanded` is correct from the first render — the sync effect is no longer needed. Revert `import` back to `{ ReactNode, useState }`.

## Files changed

| File                                        | Action | Changes                               |
| ------------------------------------------- | ------ | ------------------------------------- |
| `app/sessions.server.ts`                    | Modify | Add `profileExpandedSession` export   |
| `app/routes/action.set-profile-expanded.ts` | Create | Action route to persist to cookie     |
| `app/contexts/ProfileExpandedContext.tsx`   | Create | Context + provider + consumer hook    |
| `app/root.tsx`                              | Modify | Read cookie in loader, add provider   |
| `app/hooks/useProfileExpanded.ts`           | Modify | Replace localStorage with context     |
| `app/components/ui/ProfileHeader.tsx`       | Modify | Remove now-unnecessary useEffect sync |

**Zero changes needed**: All 5 consumer components (`ClinicProfile`, `PatientProfile`, `UserProfile`, `ClinicianProfile`, `PrescriptionProfile`) — the hook's return type is unchanged.

## Verification

1. `npm run test:run` — all tests pass
2. `npm run format` — formatting clean
3. `npm run typecheck` — no new type errors
4. Manual: refresh on a profile page with header expanded — should stay expanded without flash
