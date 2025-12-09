# UX Architecture Plan: Tidepool ORCA Admin Site

This document outlines the information architecture and UX layout for the Tidepool ORCA admin site, accounting for all features being migrated from the legacy admin-site.

---

## Executive Summary

The ORCA admin site serves as an internal tool for Tidepool support agents to manage users and clinics. The current architecture has two main sections (User Management, Clinic Management) which provide a solid foundation. This plan extends that foundation to accommodate all remaining features while maintaining workflow efficiency for support agents.

### Design Principles

1. **Task-Oriented Navigation** - Organize features by what support agents need to accomplish
2. **Contextual Information** - Show related data where it's needed most
3. **Minimal Friction** - Reduce clicks and page navigation to complete common tasks
4. **Consistent Patterns** - Reuse UI patterns across similar features
5. **Progressive Disclosure** - Show summary information first, details on demand

---

## Current State Analysis

### Existing Structure
```
├── Dashboard (Home)
│   ├── User Lookup
│   ├── Clinic Lookup
│   ├── Recently Viewed Users
│   └── Recently Viewed Clinics
│
├── User Management (/users)
│   └── User Profile (/users/:userId)
│       ├── User Details (name, email, ID, account type, etc.)
│       ├── Account Actions (verify email, password reset, etc.)
│       ├── Clinics (membership list)
│       ├── Data Uploads (for patient accounts)
│       └── Data Sources (connected devices)
│
└── Clinic Management (/clinics)
    └── Clinic Profile (/clinics/:clinicId)
        ├── Clinic Details (name, share code, ID, tier, etc.)
        ├── Patients (paginated, searchable)
        ├── Pending Patient Invites
        ├── Clinicians (paginated, searchable)
        ├── Recently Viewed Patients
        └── Recently Viewed Clinicians
        │
        ├── Patient Profile (/clinics/:clinicId/patients/:patientId)
        │   ├── Patient Details
        │   └── Clinics (patient's clinic memberships)
        │
        └── Clinician Profile (/clinics/:clinicId/clinicians/:clinicianId)
            ├── Clinician Details
            └── Clinics (clinician's clinic memberships)
```

### What's Working Well
- Two-column dashboard with parallel User/Clinic lookup
- "Recently Viewed" lists for quick access to recent work
- Collapsible table sections for organizing related data
- Breadcrumb navigation for context
- Nested routes for patient/clinician profiles within clinic context

### Gaps to Address
- No dedicated data management features (export, device settings)
- No data sharing/invite visibility
- No clinic reports functionality
- No agent-specific features (action logs)
- Limited upload management (view only, no actions)
- No prescription viewing

---

## Proposed Architecture

### Primary Navigation (Sidebar)

```
├── User Management          (existing)
├── Clinic Management        (existing)
├── Reports                  (NEW)
└── Agent Info               (NEW - optional, can be in header)
```

**Rationale:** Keep the sidebar focused on the two primary workflows. Reports and Agent Info are secondary concerns that shouldn't clutter the main navigation but need dedicated access points.

---

## Section 1: Dashboard (Home)

### Current Layout (Keep)
```
┌─────────────────────────────────┬─────────────────────────────────┐
│ User Lookup                     │ Clinic Lookup                   │
│ [Search field]                  │ [Search field]                  │
│ [Search button]                 │ [Search button]                 │
├─────────────────────────────────┼─────────────────────────────────┤
│ Recently Viewed Users           │ Recently Viewed Clinics         │
│ [Table: Name, Email]            │ [Table: Name, Share Code]       │
└─────────────────────────────────┴─────────────────────────────────┘
```

### Enhancement: Quick Actions
Consider adding a "Quick Actions" section below the lookup areas for common tasks that don't require navigating to a specific user/clinic first:
- Generate Clinic Report (all clinics)
- View Action Logs

**Route:** `/` (no change)

---

## Section 2: User Management

### 2.1 User Lookup Page (`/users`)

**Current:** Search redirects to user profile  
**Enhancement:** Add advanced search options

```
┌─────────────────────────────────────────────────────────────────────┐
│ User Lookup                                                         │
│ [Search field: User ID or Email Address]                            │
│ [Search button]                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Recently Viewed Users                                               │
│ [Table: Name, Email Address]                                        │
└─────────────────────────────────────────────────────────────────────┘
```

**Route:** `/users` (no change)

---

### 2.2 User Profile Page (`/users/:userId`)

This is the primary workspace for user-related tasks. Organize as a single scrollable page with collapsible sections.

```
┌─────────────────────────────────────────────────────────────────────┐
│ [User Name]                                                         │
│ Email: [email] [copy]                                               │
│ User ID: [id] [copy]                                                │
│ Account Type: [patient/clinician]                                   │
│ Account Verified: [true/false]                                      │
│ Member Since: [date]                                                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Account Actions                                                     │
│ [Verify Email] [Send Password Reset] [Send Confirmation]            │
│ [Resend Confirmation]                                               │
│                                                                     │
│ ⚠️ Danger Zone                                                      │
│ [Delete User Data] [Delete Account]                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Data Sharing (NEW - for patient accounts)                         │
│   ├── Accounts Shared with User (people sharing data TO this user)  │
│   │   [Table: Name, Email, Permissions]                             │
│   ├── Accounts User Shares With (people this user shares data WITH) │
│   │   [Table: Name, Email, Permissions]                             │
│   ├── Sent Invites (pending outbound)                               │
│   │   [Table: Invitee Email, Type, Sent Date]                       │
│   └── Received Invites (pending inbound)                            │
│       [Table: Inviter Name, Type, Received Date]                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Clinics ([count])                                                 │
│   [Table: Clinic Name, Role, Permissions]                           │
│   Click row → Navigate to clinic profile                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Data Uploads ([count]) (for patient accounts)                     │
│   [Search/Filter by Upload ID]                                      │
│   [Table: Device, Model, Serial, Upload Date, Actions]              │
│   Actions: [View Details] [Delete Dataset] [Delete Data from DS]    │
│                                                                     │
│   Expanded row shows:                                               │
│   - Upload ID, Version, Uploaded By                                 │
│   - Created Time                                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Data Export (NEW - for patient accounts)                          │
│   Date Range: [All] [Last 90 days] [Last 30 days] [Custom]          │
│   Format: [Excel (.xlsx)] [JSON]                                    │
│   BG Units: [mg/dL] [mmol/L]                                        │
│   [ ] Anonymize Data                                                │
│   [Export Data]                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Device Settings (NEW - for patient accounts)                      │
│   [Select Device/Upload]                                            │
│   BG Units Toggle: [mg/dL] [mmol/L]                                 │
│                                                                     │
│   Basal Schedules                                                   │
│   [Table: Schedule Name, Times, Rates]                              │
│                                                                     │
│   BG Targets                                                        │
│   [Table: Time Range, Target Range]                                 │
│                                                                     │
│   Carb Ratios                                                       │
│   [Table: Time Range, Ratio]                                        │
│                                                                     │
│   Insulin Sensitivity                                               │
│   [Table: Time Range, Factor]                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Connected Devices / Data Sources ([count]) (for patient accounts) │
│   [Table: Provider, State, Status, Last Import, Earliest/Latest]    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Prescriptions (NEW - for patient accounts)                        │
│   [Table: Prescriber, Status, Created, Expiration, Activation #]    │
└─────────────────────────────────────────────────────────────────────┘
```

**Route:** `/users/:userId` (no change)

**API Endpoints Needed:**
- Data Sharing: `/api/v1/shared/users/{userID}`, `/api/v1/confirm/invite/{userID}`, `/api/v1/confirm/invitations/{userID}`
- Data Export: `/api/v1/export/{userID}` (with query params)
- Device Settings: `/api/v1/device/settings/{userID}`
- Prescriptions: `/api/v1/prescription/{userID}`
- Upload Actions: DELETE `/api/v1/delete/dataset/{userID}/{dataSetID}`, DELETE `/api/v1/delete/dataset/data/{userID}/{dataSetID}`

---

## Section 3: Clinic Management

### 3.1 Clinic Lookup Page (`/clinics`)

**Current:** Search redirects to clinic profile  
**Keep as-is** with minor enhancements

```
┌─────────────────────────────────────────────────────────────────────┐
│ Clinic Lookup                                                       │
│ [Search field: Clinic ID or Share Code]                             │
│ [Search button]                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Recently Viewed Clinics                                             │
│ [Table: Name, Share Code]                                           │
└─────────────────────────────────────────────────────────────────────┘
```

**Route:** `/clinics` (no change)

---

### 3.2 Clinic Profile Page (`/clinics/:clinicId`)

Enhance the existing layout to include migration and reporting features.

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Clinic Name]                                                       │
│ Share Code: [code] [copy]                                           │
│ Clinic ID: [id] [copy]                                              │
│ Clinic Tier: [tier] [edit]                                          │
│ Can Migrate: [true/false]                                           │
│ Created On: [date]                                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Clinic Actions (NEW)                                                │
│ [Generate User Report] [Generate Merge Report]                      │
│                                                                     │
│ Migration Actions (if applicable)                                   │
│ [Merge Patient List] (opens modal with source clinic selection)     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Patients ([count])                                                │
│   [Search] [Sort dropdown]                                          │
│   [Table: Name, Email, Birth Date, MRN, Status]                     │
│   [Pagination]                                                      │
│   Click row → /clinics/:clinicId/patients/:patientId                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Pending Patient Invites ([count])                                 │
│   [Table: Email, Invited Date, Status]                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Clinicians ([count])                                              │
│   [Search]                                                          │
│   [Table: Name, Email, Role]                                        │
│   [Pagination]                                                      │
│   Click row → /clinics/:clinicId/clinicians/:clinicianId            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Pending Clinician Invites (NEW - [count])                         │
│   [Table: Email, Role, Invited Date]                                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┬───────────┐
│ Recently Viewed Patients                                │ Recently  │
│ [Table: Name, Email]                                    │ Viewed    │
│                                                         │ Clinicians│
└─────────────────────────────────────────────────────────┴───────────┘
```

**Route:** `/clinics/:clinicId` (no change)

**New API Endpoints Needed:**
- Merge Patient List: POST `/api/v1/clinics/{clinicID}/migrations`
- Generate Merge Report: POST `/api/v1/clinics/{clinicID}/reports/merge`
- Clinician Invites: Filter from existing clinicians endpoint

---

### 3.3 Clinic Patient Profile (`/clinics/:clinicId/patients/:patientId`)

This shows patient details in the context of their clinic membership. Keep existing layout.

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Patient Name]                                                      │
│ Email: [email] [copy]                                               │
│ Patient ID: [id] [copy]                                             │
│ MRN: [mrn]                                                          │
│ Birth Date: [date]                                                  │
│ Added: [date]                                                       │
│ Last Updated: [date]                                                │
│ Tags: [tag badges]                                                  │
│ Permissions: [View] [Upload] [Note]                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Quick Actions (NEW)                                                 │
│ [View Full User Profile] → links to /users/:userId                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Clinics ([count])                                                 │
│   [Table: Clinic Name, Share Code]                                  │
│   Click row → Navigate to clinic profile                            │
└─────────────────────────────────────────────────────────────────────┘
```

**Route:** `/clinics/:clinicId/patients/:patientId` (no change)

**Enhancement:** Add a link to navigate to the full User Profile for deeper investigation.

---

### 3.4 Clinic Clinician Profile (`/clinics/:clinicId/clinicians/:clinicianId`)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Clinician Name or Email]                                           │
│ Email: [email] [copy]                                               │
│ Clinician ID: [id] [copy]                                           │
│ Role: [CLINIC_ADMIN/CLINIC_MEMBER]                                  │
│ Added to Clinic: [date]                                             │
│ Last Updated: [date]                                                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Quick Actions (NEW)                                                 │
│ [View Full User Profile] → links to /users/:userId                  │
│ [Migrate to Clinic Account] (if legacy clinician)                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Clinics ([count])                                                 │
│   [Table: Clinic Name, Share Code, Role]                            │
│   Click row → Navigate to clinic profile                            │
└─────────────────────────────────────────────────────────────────────┘
```

**Route:** `/clinics/:clinicId/clinicians/:clinicianId` (no change)

**New API Endpoints Needed:**
- Migrate Clinician: POST `/api/v1/clinicians/{userID}/migrate`

---

## Section 4: Reports (NEW Section)

Add a new "Reports" section to the sidebar for generating reports that aren't tied to a specific user or clinic.

### 4.1 Reports Index (`/reports`)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Reports                                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Clinic Users Report                                             │ │
│ │ Generate an Excel report of clinic users                        │ │
│ │                                                                 │ │
│ │ Created From: [date picker]                                     │ │
│ │ Created To: [date picker]                                       │ │
│ │ Ignored Usernames: [text input - comma separated]               │ │
│ │                                                                 │ │
│ │ [Generate Report]                                               │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Clinic Merge Report                                             │ │
│ │ Generate a merge analysis report between two clinics            │ │
│ │                                                                 │ │
│ │ Source Clinic ID: [text input]                                  │ │
│ │ Target Clinic ID: [text input]                                  │ │
│ │                                                                 │ │
│ │ [Generate Merge Report]                                         │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Route:** `/reports`

**API Endpoints:**
- Clinic Report: GET `/api/v1/clinic/report`
- Merge Report: POST `/api/v1/clinics/{clinicID}/reports/merge`

---

## Section 5: Agent Info (NEW Section)

Agent-specific features can be added to the header user menu or as a dedicated sidebar item.

### Option A: Header User Menu (Recommended)
Add agent-related options to the existing user menu in the header:
- View Action Logs (links to Sumo Logic)
- Agent Profile

### Option B: Sidebar Item
```
├── User Management
├── Clinic Management
├── Reports
└── Agent Info (NEW)
    └── Action Logs
```

### Agent Info Content

If we create a dedicated page:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Agent Information                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Name: [Agent Name]                                                  │
│ Email: [Agent Email]                                                │
│ [Profile Picture]                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ [View Action Logs] → Opens Sumo Logic in new tab                    │
│ (Environment-specific URL: QA2 vs Production)                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Route:** `/agent` or as part of header menu

---

## Navigation Flow Summary

```
Home (/)
├── Quick lookup for users and clinics
├── Recently viewed items for quick access
│
├── User Management (/users)
│   └── User Profile (/users/:userId)
│       ├── All user data and actions in one view
│       ├── Data sharing, exports, device settings
│       └── Link to clinics navigates to Clinic Management
│
├── Clinic Management (/clinics)
│   └── Clinic Profile (/clinics/:clinicId)
│       ├── Clinic details and actions
│       ├── Patients → Patient Profile → Link to User Profile
│       ├── Clinicians → Clinician Profile → Link to User Profile
│       └── Recently viewed for quick access within clinic
│
├── Reports (/reports)
│   ├── Clinic Users Report
│   └── Clinic Merge Report
│
└── Agent Info (header menu or /agent)
    └── Action Logs link
```

---

## Implementation Priority

### Phase 1: Core Feature Completion (High Priority)
1. **Data Sharing Management** on User Profile
   - View accounts shared with user
   - View accounts user shares with
   - View sent/received invites
   - API: `/api/v1/shared/users/{userID}`, invite endpoints

2. **Upload Actions** on User Profile
   - Delete individual dataset
   - Delete data from dataset
   - Upload filtering by ID
   - API: DELETE endpoints for datasets

3. **Clinician Invites** on Clinic Profile
   - Display pending clinician invites
   - Filter from existing endpoint

### Phase 2: Device & Data Features (Medium Priority)
4. **Data Export** on User Profile
   - Date range selection
   - Format selection (Excel/JSON)
   - BG units selection
   - Anonymization option
   - API: `/api/v1/export/{userID}`

5. **Device Settings** on User Profile
   - View pump settings
   - BG unit conversion toggle
   - Display basal schedules, BG targets, carb ratios, insulin sensitivity
   - API: `/api/v1/device/settings/{userID}`

6. **Enhanced Connected Devices**
   - Add connection status details
   - Add error information display
   - Add revision tracking

### Phase 3: Clinic Operations (Medium Priority)
7. **Clinic Actions**
   - Migrate to clinic account (clinician profile)
   - Merge patient list (clinic profile)
   - API: `/api/v1/clinicians/{userID}/migrate`, `/api/v1/clinics/{clinicID}/migrations`

8. **Reports Section**
   - Create `/reports` route and page
   - Clinic users report form
   - Clinic merge report form
   - API: `/api/v1/clinic/report`, `/api/v1/clinics/{clinicID}/reports/merge`

### Phase 4: Additional Features (Lower Priority)
9. **Prescriptions** on User Profile
   - Display prescriptions table
   - API: `/api/v1/prescription/{userID}`

10. **Agent Info**
    - Add action logs link (Sumo Logic)
    - Environment-specific URL handling

### Phase 5: Cross-Linking & Polish
11. **Navigation Improvements**
    - Add "View Full User Profile" links from clinic patient/clinician profiles
    - Ensure bidirectional navigation between User and Clinic contexts

---

## UI Component Patterns

### Collapsible Sections
Use the existing `CollapsibleTableWrapper` pattern for all expandable sections:
- Default collapsed for less-frequently used sections
- Show item count in header
- Persist expand/collapse state per session

### Tables
- Use existing HeroUI table components
- Consistent column widths
- Sortable columns where applicable
- Search/filter where data sets are large
- Pagination for large datasets

### Actions
- Primary actions as filled buttons
- Secondary actions as outlined buttons
- Destructive actions in "Danger Zone" with confirmation modals
- Copy buttons for IDs and emails

### Forms
- Use HeroUI form components
- Inline validation
- Loading states during submission
- Success/error toasts for feedback

---

## Sidebar Updates

```tsx
const links = [
  {
    icon: UserCircle2Icon,
    text: 'User Management',
    href: '/users',
  },
  {
    icon: Cross, // or Building2 for better semantics
    text: 'Clinic Management',
    href: '/clinics',
  },
  {
    icon: FileText, // or FileBarChart
    text: 'Reports',
    href: '/reports',
  },
];
```

---

## File Structure for New Features

```
app/
├── routes/
│   ├── reports._index.tsx          (NEW - reports landing page)
│   ├── reports.clinic.tsx          (NEW - clinic users report)
│   ├── reports.merge.tsx           (NEW - merge report)
│   └── agent.tsx                   (NEW - agent info page, optional)
│
├── components/
│   ├── User/
│   │   ├── DataSharingSection.tsx  (NEW)
│   │   ├── DataExportSection.tsx   (NEW)
│   │   ├── DeviceSettingsSection.tsx (NEW)
│   │   ├── PrescriptionsTable.tsx  (NEW)
│   │   └── UploadActions.tsx       (NEW - enhance DataSetsTable)
│   │
│   ├── Clinic/
│   │   ├── ClinicActions.tsx       (NEW)
│   │   ├── ClinicianInvitesTable.tsx (NEW)
│   │   └── MergePatientListModal.tsx (NEW)
│   │
│   └── Reports/
│       ├── ClinicUsersReportForm.tsx (NEW)
│       └── MergeReportForm.tsx     (NEW)
```

---

## Summary

This architecture plan:
1. **Preserves** the existing two-column User/Clinic structure
2. **Extends** user and clinic profiles with additional sections
3. **Adds** a Reports section for standalone report generation
4. **Maintains** workflow efficiency with progressive disclosure and quick actions
5. **Enables** cross-navigation between user and clinic contexts

The phased implementation approach allows for incremental delivery while maintaining a cohesive user experience throughout the migration process.
