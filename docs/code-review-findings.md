# Code Review Findings

**Reviewed:** December 17, 2025  
**Scope:** Application logic, security, accessibility, performance, and code reuse  
**Excluded:** Unit tests

---

## Table of Contents

1. [Critical: Security Issues](#1-critical-security-issues)
2. [High: Error Handling & Data Validation](#2-high-error-handling--data-validation)
3. [Medium: Performance Issues](#3-medium-performance-issues)
4. [Medium: Accessibility Improvements](#4-medium-accessibility-improvements)
5. [Low: Code Reuse Opportunities](#5-low-code-reuse-opportunities)
6. [Low: Code Quality & Maintainability](#6-low-code-quality--maintainability)
7. [Summary & Prioritized Action Items](#7-summary--prioritized-action-items)

---

## 1. Critical: Security Issues

### 1.1 Hardcoded Default Session Secret

**File:** `app/sessions.server.ts:9`

```typescript
secrets: [process.env.SESSION_SECRET || 'default-secret'],
```

**Issue:** Falls back to a hardcoded secret if `SESSION_SECRET` is not set. This is a critical security vulnerability in production as all sessions would use a predictable secret.

**Recommendation:**

```typescript
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) throw new Error('Missing SESSION_SECRET env variable');

const commonCookieOptions = {
  // ...
  secrets: [SESSION_SECRET],
};
```

### 1.2 No Route-Level Authentication Verification

**Files:** All route files in `app/routes/`

**Issue:** Routes rely entirely on Pomerium proxy for authentication. There are no server-side checks in loaders/actions to verify the user is authenticated. If Pomerium is misconfigured or bypassed, routes are unprotected.

**Recommendation:** Add a middleware function or utility to verify authentication in critical loaders:

```typescript
// app/utils/auth.ts
export function requireAuth(request: Request) {
  const jwt = request.headers.get('x-pomerium-jwt-assertion');
  if (!jwt) {
    throw new Response('Unauthorized', { status: 401 });
  }
  // Optionally verify JWT signature for defense-in-depth
  return jwtDecode(jwt);
}

// In loaders:
export const loader = async ({ request }: LoaderFunctionArgs) => {
  requireAuth(request);
  // ... rest of loader
};
```

### 1.3 JWT Decoding Without Signature Verification

**File:** `app/routes/action.get-agent.ts:10-21`

```typescript
const pomeriumJWT = request.headers.get('x-pomerium-jwt-assertion');
const { name, picture, email }: Agent =
  typeof pomeriumJWT === 'string' ? jwtDecode(pomeriumJWT) : {};
```

**Issue:** JWT is decoded without signature verification. While Pomerium validates the JWT at the proxy level, a compromised network or misconfiguration could allow forged tokens.

**Recommendation:** Add signature verification using Pomerium's public key for defense-in-depth, or at minimum validate the JWT has not expired.

### 1.4 Server Auth Token Storage in Module State

**File:** `app/auth.server.ts:9-14`

```typescript
export const serverAuth = {
  serverSecret: SERVER_SECRET,
  serverName: SERVER_NAME,
  apiHost: API_HOST,
  serverSessionToken: '', // Mutable module-level state
};
```

**Issue:** The server session token is stored in mutable module-level state. In a multi-process or serverless environment, this could lead to:

- Token not being refreshed properly across instances
- Race conditions during token refresh

**Recommendation:** Consider token refresh on each request or implement proper token caching with TTL.

### 1.5 Silent Auth Failure

**File:** `app/auth.server.ts:34-36`

```typescript
} catch (e) {
  console.error(e);
}  // Function returns undefined on failure
```

**Issue:** If server authentication fails, the error is logged but the application continues with an empty session token, which will cause all subsequent API calls to fail with confusing errors.

**Recommendation:**

```typescript
export const authorizeServer = async () => {
  try {
    // ... existing code
    if (!serverSessionToken) {
      throw new Error('Server authentication failed: no token received');
    }
    serverAuth.serverSessionToken = serverSessionToken;
  } catch (e) {
    console.error('Server auth failed:', e);
    throw e; // Re-throw to prevent app from starting in broken state
  }
};
```

---

## 2. High: Error Handling & Data Validation

### 2.1 Silent Error Swallowing in API Batch Requests

**File:** `app/api.server.ts:422-432`

```typescript
export const apiRequests = async (requests: apiRequestArgs[]) => {
  try {
    const results = await Promise.all(
      requests.map((request) => apiRequest(request)),
    );
    return results;
  } catch (err) {
    console.log(err); // Returns undefined!
  }
};
```

**Issue:** When any request in the batch fails, the entire batch fails silently and returns `undefined`. This can cause null reference errors downstream.

**Recommendation:**

```typescript
export const apiRequests = async (requests: apiRequestArgs[]) => {
  const results = await Promise.all(
    requests.map((request) => apiRequest(request)),
  );
  return results;
};
// Or use Promise.allSettled for partial failure handling
```

### 2.2 Silent Error Swallowing in Clinic Loader

**File:** `app/routes/clinics.$clinicId.tsx:480-482`

```typescript
} catch (error) {
  console.error('Error fetching clinic or patients:', error);
}
return {
  clinic: null,
  // ... empty defaults
};
```

**Issue:** All errors are caught and swallowed, returning an empty state. Users see an empty page with no indication of what went wrong.

**Recommendation:** Return error state or throw Response with appropriate status:

```typescript
} catch (error) {
  if (error instanceof APIError && error.status === 404) {
    throw new Response('Clinic not found', { status: 404 });
  }
  throw error; // Let error boundary handle it
}
```

### 2.3 Missing Schema Validation on API Responses

**Files:** Multiple route loaders

**Issue:** Many API calls don't use schema validation:

```typescript
const results = await apiRequests([
  apiRoutes.clinic.get(clinicId),  // No schema
  apiRoutes.clinic.getPatients(clinicId, {...}),  // No schema
]);
const clinic: Clinic = results?.[0] as Clinic;  // Unsafe assertion
```

**Recommendation:** Add schema validation to all critical API calls:

```typescript
const clinic = await apiRequest({
  ...apiRoutes.clinic.get(clinicId),
  schema: ClinicSchema,
});
```

### 2.4 Unvalidated JSON.parse on Form Data

**File:** `app/routes/clinics.$clinicId.clinicians.$clinicianId.tsx:130-137`

```typescript
const rolesJson = formData.get('roles');
const roles = JSON.parse(rolesJson) as string[]; // No validation!
```

**Issue:** Form data is parsed as JSON without validation. Malformed input could cause runtime errors.

**Recommendation:**

```typescript
const RolesSchema = z.array(z.string());
const roles = RolesSchema.parse(JSON.parse(rolesJson as string));
```

### 2.5 Missing Input Validation in Export Route

**File:** `app/routes/users.$userId.export.tsx:8-12`

```typescript
const format = (url.searchParams.get('format') as 'json' | 'xlsx') || 'xlsx';
const bgUnits =
  (url.searchParams.get('bgUnits') as 'mmol/L' | 'mg/dL') || 'mg/dL';
```

**Issue:** Query parameters are cast directly to expected types without validation.

**Recommendation:**

```typescript
const ExportParamsSchema = z.object({
  format: z.enum(['json', 'xlsx']).default('xlsx'),
  bgUnits: z.enum(['mmol/L', 'mg/dL']).default('mg/dL'),
});
const params = ExportParamsSchema.parse({
  format: url.searchParams.get('format'),
  bgUnits: url.searchParams.get('bgUnits'),
});
```

### 2.6 Date Formatting Without Validation

**File:** `app/utils/dateFormatters.ts:6-20`

```typescript
export function formatShortDate(dateStr: string | undefined, locale: string): string | null {
  if (!dateStr) return null;
  return intlFormat(new Date(dateStr), {...});  // Can throw on invalid date
}
```

**Issue:** Invalid date strings (e.g., "not-a-date") cause `new Date()` to return "Invalid Date", which may throw in `intlFormat`.

**Recommendation:**

```typescript
export function formatShortDate(dateStr: string | undefined, locale: string): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  try {
    return intlFormat(date, {...}, { locale });
  } catch {
    return null;
  }
}
```

### 2.7 Missing Input Validation in Time Conversion

**File:** `app/utils/timeConversion.ts:46-48`

```typescript
export function timeToMs(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * MS_PER_HOUR + minutes * MS_PER_MINUTE;
}
```

**Issue:** No validation that input matches "HH:MM" format. Malformed input returns `NaN`.

**Recommendation:**

```typescript
export function timeToMs(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error(`Invalid time format: ${time}. Expected HH:MM`);
  const [, hours, minutes] = match;
  return Number(hours) * MS_PER_HOUR + Number(minutes) * MS_PER_MINUTE;
}
```

### 2.8 Null Header Cast Without Check

**File:** `app/utils/getLocale.ts:6-8`

```typescript
const languages = acceptLanguage.parse(
  request.headers.get('Accept-Language') as string, // Can be null
);
```

**Recommendation:**

```typescript
const languages = acceptLanguage.parse(
  request.headers.get('Accept-Language') || '',
);
```

---

## 3. Medium: Performance Issues

### 3.1 Sequential API Calls Instead of Parallel

**File:** `app/routes/clinics.$clinicId.tsx:355-380`

```typescript
// After apiRequests batch completes, these are sequential:
let mrnSettings = null;
try {
  mrnSettings = await apiRequest(...);
} catch (err) { ... }

let patientCountSettings = null;
try {
  patientCountSettings = await apiRequest(...);
} catch (err) { ... }
```

**Issue:** MRN settings and patient count settings are fetched sequentially after the main batch.

**Recommendation:** Include in parallel batch:

```typescript
const [clinic, patients, clinicians, invites, mrnSettings, patientCountSettings] =
  await Promise.all([
    apiRequestSafe(apiRoutes.clinic.get(clinicId)),
    apiRequestSafe(apiRoutes.clinic.getPatients(...)),
    // ... include settings in parallel
  ]);
```

### 3.2 Sequential API Calls in User Profile

**File:** `app/routes/users.$userId.tsx:118-264`

**Issue:** Many API calls made sequentially rather than in parallel:

```typescript
const clinicsRawState = await apiRequestSafe<...>(...);
// Then later...
const dataSetsRawState = await apiRequestSafe<...>(...);
const dataSourcesRawState = await apiRequestSafe<...>(...);
```

**Recommendation:** Use `Promise.all` for independent requests.

### 3.3 Fetching All Clinicians Without Server Pagination

**File:** `app/routes/clinics.$clinicId.tsx:262, 340`

```typescript
const cliniciansFetchLimit = 1000;
apiRoutes.clinic.getClinicians(clinicId, { limit: cliniciansFetchLimit }),
```

**Issue:** Fetches up to 1000 clinicians at once and does client-side pagination.

**Recommendation:** Implement server-side pagination if the API supports it.

### 3.4 Cache-Control on Mutable Data

**Files:** `app/routes/clinics.$clinicId.tsx:474`, `app/routes/clinics.$clinicId.patients.$patientId.tsx:326`

```typescript
headers: {
  'Cache-Control': 'public, s-maxage=60',
}
```

**Issue:** Using `public` cache for authenticated, mutable data.

**Recommendation:** Use `private` for authenticated data:

```typescript
'Cache-Control': 'private, max-age=60'
```

### 3.5 Context Value Not Memoized

**File:** `app/components/Clinic/RecentItemsContext.tsx:70-79`

```typescript
<RecentItemsContext.Provider
  value={{
    recentPatients,
    recentClinicians,
    addRecentPatient,
    addRecentClinician,
    updateRecentPatients,
    updateRecentClinicians,
  }}
>
```

**Issue:** Context value object is created on every render, causing all consumers to re-render.

**Recommendation:**

```typescript
const contextValue = useMemo(
  () => ({
    recentPatients,
    recentClinicians,
    addRecentPatient,
    addRecentClinician,
    updateRecentPatients,
    updateRecentClinicians,
  }),
  [recentPatients, recentClinicians, addRecentPatient, addRecentClinician, updateRecentPatients, updateRecentClinicians]
);

return (
  <RecentItemsContext.Provider value={contextValue}>
    {children}
  </RecentItemsContext.Provider>
);
```

### 3.6 Large Reports Action Fetches

**File:** `app/routes/reports._index.tsx:70-81`

**Issue:** Fetches up to 1000 patients and clinicians for both source and target clinics in a single action.

**Recommendation:** Consider implementing pagination or streaming for large data exports, or add progress feedback.

---

## 4. Medium: Accessibility Improvements

### 4.1 Missing aria-expanded in CollapsibleTableWrapper ✓ Already Fixed

**File:** `app/components/CollapsibleTableWrapper.tsx:65`

The component correctly implements `aria-expanded` and `aria-controls`:

```typescript
aria-expanded={isExpanded}
aria-controls={`${title.toLowerCase().replace(/\s+/g, '-')}-table-content`}
```

### 4.2 Loading Overlay Missing Role

**File:** `app/layouts/Dashboard.tsx:94-99`

```typescript
<div
  className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center"
  aria-label="Loading content"
>
```

**Issue:** The loading overlay has an aria-label but no role. Screen readers may not announce it properly.

**Recommendation:**

```typescript
<div
  role="status"
  aria-live="polite"
  aria-label="Loading content"
  className="..."
>
```

### 4.3 Home Breadcrumb Missing Label

**File:** `app/layouts/Dashboard.tsx:115-117`

```typescript
<BreadcrumbItem href="/">
  <Home className="w-4" />
</BreadcrumbItem>
```

**Issue:** Icon-only breadcrumb item lacks accessible text.

**Recommendation:**

```typescript
<BreadcrumbItem href="/" aria-label="Home">
  <Home className="w-4" aria-hidden="true" />
</BreadcrumbItem>
```

### 4.4 ChevronDown Icon Not Hidden from Screen Readers

**File:** `app/components/CollapsibleTableWrapper.tsx:75-79`

```typescript
<ChevronDown
  className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
/>
```

**Issue:** Decorative icon should be hidden from screen readers.

**Recommendation:**

```typescript
<ChevronDown
  className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
  aria-hidden="true"
/>
```

### 4.5 Missing Error Boundaries on Routes

**Files:**

- `app/routes/clinics._index.tsx`
- `app/routes/clinics.$clinicId.clinicians.$clinicianId.tsx`
- `app/routes/clinics.$clinicId.patients.$patientId.tsx`
- `app/routes/clinics.$clinicId.prescriptions.$prescriptionId.tsx`
- `app/routes/users._index.tsx`
- `app/routes/users.$userId.tsx`
- `app/routes/users.$userId.export.tsx`
- `app/routes/reports._index.tsx`

**Issue:** These routes lack their own ErrorBoundary, relying on root boundary.

**Recommendation:** Add route-specific ErrorBoundary components for better error isolation and contextual error messages.

---

## 5. Low: Code Reuse Opportunities

### 5.1 Repeated Status Color Pattern

**File:** `app/utils/statusColors.ts:58-81`

Four nearly identical functions:

- `getPrescriptionStateColor`
- `getInviteStatusColor`
- `getDataSourceStateColor`
- `getRoleColor`

**Recommendation:** Create a generic factory:

```typescript
function createStatusColorGetter(colorMap: Record<string, ChipColor>) {
  return (status: string | null | undefined): ChipColor =>
    colorMap[status?.toLowerCase() ?? ''] ?? 'default';
}

export const getPrescriptionStateColor = createStatusColorGetter(
  prescriptionStateColors,
);
export const getInviteStatusColor = createStatusColorGetter(inviteStatusColors);
// etc.
```

### 5.2 Duplicate Recent Items Session Logic

**Files:**

- `app/routes/clinics.$clinicId.tsx`
- `app/routes/clinics.$clinicId.patients.$patientId.tsx`
- `app/routes/clinics.$clinicId.clinicians.$clinicianId.tsx`

**Issue:** Session-based recent items logic is duplicated.

**Recommendation:** Extract to a shared utility:

```typescript
// app/utils/recentItems.server.ts
export async function getAndUpdateRecentItems<T extends { id: string }>(
  session: CookieSessionStorage,
  sessionKey: string,
  cookieName: string,
  newItem: T,
  maxItems: number = 10,
): Promise<{ items: T[]; headers: Headers }> {
  const cookie = request.headers.get('Cookie');
  const sessionData = await session.getSession(cookie);
  // ... shared logic
}
```

### 5.3 Similar Zod Schema Patterns

**File:** `app/schemas/index.ts:73-100`

Repeated connection request shape:

```typescript
connectionRequests: z.object({
  twiist: z.array(z.object({ createdTime: z.string(), providerName: z.enum([...]) })),
  dexcom: z.array(z.object({ createdTime: z.string(), providerName: z.enum([...]) })),
  abbott: z.array(z.object({ createdTime: z.string(), providerName: z.enum([...]) })),
}),
```

**Recommendation:**

```typescript
const ConnectionRequestSchema = z.object({
  createdTime: z.string(),
  providerName: z.enum(['dexcom', 'twiist', 'abbott']),
});

const connectionRequests = z
  .object({
    twiist: z.array(ConnectionRequestSchema).optional(),
    dexcom: z.array(ConnectionRequestSchema).optional(),
    abbott: z.array(ConnectionRequestSchema).optional(),
  })
  .optional();
```

### 5.4 Consider DataTable Composite Component

**Files:** `CliniciansTable`, `PatientsTable`, `ClinicsTable`, `PrescriptionsTable`, `DataSetsTable`, `DataSourcesTable`

**Issue:** All tables follow the same pattern: Filter → Table → Pagination.

**Recommendation:** Consider a `DataTable` wrapper component that combines common functionality.

---

## 6. Low: Code Quality & Maintainability

### 6.1 Magic Numbers

**File:** `app/routes/clinics.$clinicId.tsx:260-262`

```typescript
const recentClinicsMax = 10;
const defaultPageSize = 10;
const cliniciansFetchLimit = 1000;
```

**Recommendation:** Move to a shared constants file:

```typescript
// app/constants.ts
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  RECENT_ITEMS_MAX: 10,
  CLINICIANS_FETCH_LIMIT: 1000,
} as const;
```

### 6.2 Unused Import

**File:** `app/routes/users.$userId.tsx:28`

```typescript
import {
  apiRequest,
  apiRequests, // Never used
  apiRoutes,
  apiRequestSafe,
} from '~/api.server';
```

**Recommendation:** Remove unused `apiRequests` import.

### 6.3 Type Duplication

**Files:** `app/schemas/index.ts` and `app/api.types.ts`

**Issue:** Types are defined in both places, potentially diverging.

**Recommendation:** Use Zod-inferred types as the single source of truth:

```typescript
// api.types.ts
import type { z } from 'zod';
import type { ClinicSchema, PatientSchema } from '~/schemas';

export type Clinic = z.infer<typeof ClinicSchema>;
export type Patient = z.infer<typeof PatientSchema>;
```

### 6.4 Inconsistent Type Assertions in Status Colors

**File:** `app/utils/statusColors.ts:58-60`

```typescript
export function getPrescriptionStateColor(state: string): ChipColor {
  return prescriptionStateColors[state?.toLowerCase()] ?? 'default';
}
```

**Issue:** Signature says `state: string` but uses optional chaining, suggesting null could be passed.

**Recommendation:** Update type signature to be accurate:

```typescript
export function getPrescriptionStateColor(
  state: string | null | undefined,
): ChipColor;
```

### 6.5 TODO Comment with Typos

**File:** `app/utils/getLocale.ts:12-14`

```typescript
// TODO: implement way to detect rtl. React-aria porvider does this automatically,
// but doesn't work properly - perhap can leverage their detection utility
```

**Issue:** Typos "porvider" and "perhap", and incomplete RTL support.

### 6.6 Toast ID Generation

**File:** `app/contexts/ToastContext.tsx:25`

```typescript
const id = Math.random().toString(36).substring(7);
```

**Issue:** Could produce collisions. While unlikely to cause issues in practice, using `crypto.randomUUID()` is safer.

**Recommendation:**

```typescript
const id = crypto.randomUUID();
```

---

## 7. Summary & Prioritized Action Items

### Critical (Address Immediately)

| #   | Issue                             | File                   | Effort |
| --- | --------------------------------- | ---------------------- | ------ |
| 1   | Hardcoded default session secret  | `sessions.server.ts:9` | Low    |
| 2   | Add route-level auth verification | All routes             | Medium |
| 3   | Fix silent auth failure           | `auth.server.ts:34-36` | Low    |

### High Priority

| #   | Issue                                | File                            | Effort |
| --- | ------------------------------------ | ------------------------------- | ------ |
| 4   | Fix apiRequests silent failure       | `api.server.ts:429-431`         | Low    |
| 5   | Add error handling to clinic loader  | `clinics.$clinicId.tsx:480-482` | Medium |
| 6   | Add schema validation to API calls   | Multiple routes                 | Medium |
| 7   | Validate form data JSON.parse        | `clinicians.$clinicianId.tsx`   | Low    |
| 8   | Add input validation to export route | `users.$userId.export.tsx`      | Low    |

### Medium Priority

| #   | Issue                            | File                                         | Effort |
| --- | -------------------------------- | -------------------------------------------- | ------ |
| 9   | Parallelize sequential API calls | `clinics.$clinicId.tsx`, `users.$userId.tsx` | Medium |
| 10  | Fix Cache-Control headers        | Multiple routes                              | Low    |
| 11  | Memoize RecentItemsContext value | `RecentItemsContext.tsx`                     | Low    |
| 12  | Add route-level ErrorBoundary    | 8 routes                                     | Medium |
| 13  | Fix accessibility issues         | Multiple components                          | Low    |

### Low Priority

| #   | Issue                           | File                       | Effort |
| --- | ------------------------------- | -------------------------- | ------ |
| 14  | Refactor status color functions | `statusColors.ts`          | Low    |
| 15  | Extract recent items utilities  | Multiple routes            | Medium |
| 16  | Extract schema patterns         | `schemas/index.ts`         | Low    |
| 17  | Create constants file           | Multiple files             | Low    |
| 18  | Remove unused imports           | `users.$userId.tsx`        | Low    |
| 19  | Consolidate type definitions    | `api.types.ts`, `schemas/` | Medium |

---

## Architecture Observations

### Strengths

- **Clean component architecture** with good separation between UI primitives (`app/components/ui/`) and domain components
- **Consistent use of Zod schemas** for API response validation where applied
- **Well-implemented reusable components** like `RecentItemsTable`, `ProfileHeader`, `SectionPanel`
- **Proper use of React Router patterns** for data loading and actions
- **Good accessibility foundation** with most interactive elements having proper ARIA attributes
- **Type safety** with TypeScript throughout the codebase

### Areas for Improvement

- **Error handling consistency** - need standardized patterns across all routes
- **Authentication defense-in-depth** - add server-side verification beyond proxy
- **API response validation** - apply Zod schemas consistently to all API calls
- **Performance optimization** - parallelize independent API calls
- **Type consolidation** - single source of truth for shared types
