# Comprehensive Feature Breakdown: admin-site (Tidepool Orca Admin Site)

This document provides a detailed analysis of the legacy admin-site repository features to track migration progress to orca-remix.

## Overview

The admin-site is an internal Tidepool tool for customer support and issue diagnosis. It enables Tidepool employees to view, retrieve, analyze, and potentially modify user data stored in Tidepool's cloud platform.

**Technology Stack:**

- **Backend:** Go (Golang) with Gorilla Mux router
- **Frontend:** React with Redux, React-Bootstrap, React-Router-DOM
- **Authentication:** Pomerium SSO integration with Tidepool token auth middleware

---

## Migration Progress Tracker

| Category          | Feature              | Status | Notes                                                    |
| ----------------- | -------------------- | ------ | -------------------------------------------------------- |
| User Management   | User Lookup          | [x]    |                                                          |
| User Management   | User Profile Display | [x]    |                                                          |
| User Management   | Account Actions      | [x]    |                                                          |
| Data Management   | Upload Viewing       | [x]    |                                                          |
| Data Management   | Data Export          | [x]    |                                                          |
| Device Management | Device Settings      | [x]    |                                                          |
| Device Management | Connected Devices    | [x]    |                                                          |
| Clinic Management | Clinic Viewing       | [x]    |                                                          |
| Clinic Management | Clinician Management | [x]    |                                                          |
| Clinic Management | Patient Management   | [x]    |                                                          |
| Clinic Management | Clinic Reports       | [-]    | Removed - API endpoint not accessible in this deployment |
| Agent Management  | Agent Info           | [x]    |                                                          |
| Agent Management  | Action Logs          | [ ]    |                                                          |

---

## 1. User Management

### User Lookup & Profile Viewing

| Feature                     | Description                                                                                      | API Endpoint                        | Migrated |
| --------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------- | -------- |
| Search by Email/UserID      | Look up users by email address or Tidepool user ID                                               | `/api/v1/user/{userID}`             | [x]      |
| User Profile Display        | View user's full name, email, account ID, account type (user/patient/clinician/legacy clinician) | `/api/v1/metadata/profile/{userID}` | [x]      |
| Account Verification Status | View if email is verified, terms accepted date                                                   | User info response                  | [x]      |
| Patient Info                | View birthday, diagnosis date, MRN for patient accounts                                          | Profile metadata                    | [x]      |
| Account Role Detection      | Identifies account types: user, patient, clinician, migrated clinician, legacy clinician         | Based on roles array                | [x]      |

### User Account Actions

| Feature                   | Description                                     | API Endpoint                                   | Migrated |
| ------------------------- | ----------------------------------------------- | ---------------------------------------------- | -------- |
| Verify User Email         | Manually verify a user's email address          | `/api/v1/signup/confirm/{userID}/{confirmKey}` | [x]      |
| Password Reset            | Send password reset email to user               | `/api/v1/password/reset/{email}`               | [x]      |
| Resend Confirmation Email | Resend account confirmation email               | `/api/v1/resend/confirm/account/{email}`       | [x]      |
| Send Confirmation Email   | Send new account confirmation                   | `/api/v1/send/confirm/account/{userID}`        | [x]      |
| Delete User Account       | Permanently delete user account and all data    | `/api/v1/delete/user/{userID}`                 | [x]      |
| Delete User Data          | Delete all user upload data (preserves account) | `/api/v1/delete/data/{userID}`                 | [x]      |

### Data Sharing Management

| Feature                        | Description                                              | API Endpoint                           | Migrated |
| ------------------------------ | -------------------------------------------------------- | -------------------------------------- | -------- |
| View Accounts Shared With User | See all accounts that share data with the looked-up user | `/api/v1/shared/users/{userID}`        | [x]      |
| View Accounts User Shares With | See all accounts the user shares their data with         | Part of shared users response          | [x]      |
| View Sent Invites              | See pending invites sent by user                         | `/api/v1/confirm/invite/{userID}`      | [x]      |
| View Received Invites          | See pending invites received by user                     | `/api/v1/confirm/invitations/{userID}` | [x]      |
| Custodial Account Count        | Displays count of custodial accounts                     | Calculated from shared data            | [x]      |

---

## 2. Data & Uploads Management

### Upload Viewing

| Feature          | Description                                            | API Endpoint               | Migrated |
| ---------------- | ------------------------------------------------------ | -------------------------- | -------- |
| View All Uploads | List all user data uploads with details                | `/api/v1/uploads/{userID}` | [x]      |
| Upload Details   | Device manufacturer, model, serial number, device type | Upload metadata            | [x]      |
| Upload Metadata  | Created time, upload ID, version, uploaded by          | Upload metadata            | [x]      |
| Upload Filtering | Filter uploads by Upload ID                            | Client-side filter         | [x]      |

### Upload Actions

| Feature                   | Description                           | API Endpoint                                       | Migrated |
| ------------------------- | ------------------------------------- | -------------------------------------------------- | -------- |
| Delete Individual Dataset | Delete a specific upload/dataset      | `/api/v1/delete/dataset/{userID}/{dataSetID}`      | [x]      |
| Delete Data From Dataset  | Delete data from a continuous dataset | `/api/v1/delete/dataset/data/{userID}/{dataSetID}` | [x]      |

### Data Export

| Feature              | Description                                   | API Endpoint              | Migrated |
| -------------------- | --------------------------------------------- | ------------------------- | -------- |
| Export User Data     | Export user data to file                      | `/api/v1/export/{userID}` | [x]      |
| Date Range Selection | All data, last 90/30/14 days, or custom range | Query params              | [x]      |
| Format Selection     | Excel (.xlsx) or JSON                         | `format` param            | [x]      |
| BG Units Selection   | mg/dL or mmol/L                               | `bgUnits` param           | [x]      |

---

## 3. Device Management

### Device Settings

| Feature             | Description                              | API Endpoint                       | Migrated |
| ------------------- | ---------------------------------------- | ---------------------------------- | -------- |
| View Pump Settings  | Display pump settings for user's devices | `/data/{userId}?type=pumpSettings` | [x]      |
| Basal Schedules     | View basal rate schedules with times     | Parsed from pump settings          | [x]      |
| BG Targets          | View blood glucose target settings       | Parsed from pump settings          | [x]      |
| Carb Ratios         | View carbohydrate ratio settings         | Parsed from pump settings          | [x]      |
| Insulin Sensitivity | View insulin sensitivity factors         | Parsed from pump settings          | [x]      |
| Unit Conversion     | Toggle between mg/dL and mmol/L display  | Client-side                        | [x]      |

### Connected Devices

| Feature                | Description                                    | API Endpoint                      | Migrated |
| ---------------------- | ---------------------------------------------- | --------------------------------- | -------- |
| View Connected Devices | List all connected data sources                | `/v1/users/{userId}/data_sources` | [x]      |
| Connection Status      | Provider name, connection state, error details | Device connection data            | [x]      |
| Data Timing            | Earliest data, latest data, last import time   | Device connection data            | [x]      |
| Revision Tracking      | Connection revision count                      | Device connection data            | [x]      |

### Prescriptions

| Feature                    | Description                                       | API Endpoint                                | Migrated |
| -------------------------- | ------------------------------------------------- | ------------------------------------------- | -------- |
| View Clinic Prescriptions  | Display prescriptions for clinic (table view)     | `/v1/clinics/{clinicId}/prescriptions`      | [x]      |
| View Patient Prescriptions | Display prescriptions for patient (table view)    | `/v1/patients/{userId}/prescriptions`       | [x]      |
| Prescription Details       | Patient ID, prescriber, status, activation number | `/v1/clinics/{clinicId}/prescriptions/{id}` | [x]      |
| Prescription Dates         | Created date, modified date, expiration           | Prescription data                           | [x]      |

---

## 4. Clinic Management

### Clinic Viewing

| Feature                    | Description                                   | API Endpoint                          | Migrated |
| -------------------------- | --------------------------------------------- | ------------------------------------- | -------- |
| View Clinics for Clinician | List clinics where user is a clinician        | `/api/v1/clinicians/{userID}/clinics` | [x]      |
| View Clinics for Patient   | List clinics where user is a patient          | `/api/v1/patients/{userID}/clinics`   | [x]      |
| Clinic Details             | Clinic ID, name, share code, user permissions | Clinic data                           | [x]      |
| Clinic Selection           | Select clinic to view details                 | Client-side state                     | [x]      |

### Clinician Management

| Feature                | Description                          | API Endpoint                                    | Migrated |
| ---------------------- | ------------------------------------ | ----------------------------------------------- | -------- |
| View Clinic Clinicians | List all clinicians in a clinic      | `/api/v1/clinics/{clinicID}/clinicians`         | [x]      |
| Clinician Details      | ID, name, email, role (Admin/Member) | Clinician data                                  | [x]      |
| View Clinician Invites | List pending clinician invites       | `/api/v1/clinics/{clinicID}/invites/clinicians` | [x]      |

### Patient Management

| Feature              | Description                                   | API Endpoint                                  | Migrated |
| -------------------- | --------------------------------------------- | --------------------------------------------- | -------- |
| View Clinic Patients | Paginated list of clinic patients             | `/api/v1/clinics/{clinicID}/patients`         | [x]      |
| Patient Details      | ID, name, email, birth date, custodial status | Patient data                                  | [x]      |
| View Patient Invites | List patient -> clinic invites                | `/api/v1/clinics/{clinicID}/invites/patients` | [x]      |
| Patient Count        | Total patient count for clinic                | Meta response                                 | [x]      |

### Clinic Actions

| Feature                   | Description                                  | API Endpoint                               | Migrated |
| ------------------------- | -------------------------------------------- | ------------------------------------------ | -------- |
| Migrate to Clinic Account | Migrate legacy clinic user to clinic account | `/api/v1/clinicians/{userID}/migrate`      | [ ]      |
| Merge Patient List        | Merge patient list to a clinic               | `/api/v1/clinics/{clinicID}/migrations`    | [ ]      |
| Update Clinic Tier        | Change clinic tier (tier0100-tier0400)       | `/api/v1/clinics/{clinicID}/tier`          | [x]      |
| Generate Merge Report     | Create clinic merge report (Excel)           | `/api/v1/clinics/{clinicID}/reports/merge` | [ ]      |

### Clinic Reports

| Feature            | Description                                         | API Endpoint                      | Migrated |
| ------------------ | --------------------------------------------------- | --------------------------------- | -------- |
| Clinic Report      | Generate CSV report of clinic users                 | `/api/v1/clinic/report`           | [-]      |
| Date Filtering     | Filter by creation date range                       | `createdFrom`, `createdTo` params | [-]      |
| Username Filtering | Ignore test/automated usernames                     | `ignoredUsernames` param          | [-]      |
| Report Contents    | User ID, username, email, clinic info, created time | CSV columns                       | [-]      |

### Clinic Merge Report

| Feature               | Description                        | Page             | Migrated |
| --------------------- | ---------------------------------- | ---------------- | -------- |
| Source/Target Input   | Enter source and target clinic IDs | `/reports`       | [x]      |
| Merge Report Download | Download merge analysis text file  | POST to generate | [x]      |

---

## 5. Agent (Admin User) Management

### Agent Information

| Feature           | Description                                 | API Endpoint     | Migrated |
| ----------------- | ------------------------------------------- | ---------------- | -------- |
| Get Current Agent | Retrieve current admin user info            | `/api/v1/agent/` | [x]      |
| Pomerium Headers  | Extract JWT assertion, email, name, picture | Request headers  | [x]      |

### Agent Action Logging

| Feature                   | Description                                            | Location              | Migrated |
| ------------------------- | ------------------------------------------------------ | --------------------- | -------- |
| Action Logs               | Link to Sumo Logic logs for agent actions              | `/agentInfo/logs`     | [ ]      |
| Environment-Specific Logs | Different Sumo Logic URLs for QA2 vs Production        | Conditional rendering | [ ]      |
| Logged Actions            | All API calls log agent email, action, and target user | Backend logging       | [ ]      |

---

## 6. Authentication & Security

### Authentication

| Feature                  | Description                                   | File                              | Migrated |
| ------------------------ | --------------------------------------------- | --------------------------------- | -------- |
| Tidepool Auth Middleware | Validates Tidepool authentication tokens      | `tidepoolAuthMiddleware.go`       | [x]      |
| Server Token Management  | Auto-refreshes server token every 10 minutes  | `getServerToken.go`               | [x]      |
| Pomerium SSO Integration | Uses Pomerium headers for user identification | Request headers                   | [x]      |
| Permission Middleware    | Permission checking (partially implemented)   | `tidepoolPermissionMiddleware.go` | [x]      |

---

## 7. UI/Navigation Structure

### Main Navigation (Sidebar)

```
- Homepage (Dashboard)
- User Management
  - User Profile Page
  - Accounts Shared with User
  - User Uploads
  - Device Settings
  - Connected Devices
  - Prescriptions
- Agent Management
  - Agent Action Logs
- Clinic Management
  - Report
  - Merge Report
```

### User Profile Sub-Navigation

```
- Uploads (data uploads list)
- Device Settings (pump settings)
- Connected Devices (data sources)
- Prescriptions
- Clinics (clinic associations)
```

---

## 8. API Endpoints Summary

### User APIs

| Method | Endpoint                            | Description      | Migrated |
| ------ | ----------------------------------- | ---------------- | -------- |
| GET    | `/api/v1/user/{userID}`             | Get user info    | [ ]      |
| GET    | `/api/v1/metadata/profile/{userID}` | Get user profile | [ ]      |
| DELETE | `/api/v1/delete/user/{userID}`      | Delete user      | [ ]      |
| DELETE | `/api/v1/delete/data/{userID}`      | Delete user data | [ ]      |
| POST   | `/api/v1/password/reset/{email}`    | Password reset   | [ ]      |
| POST   | `/api/v1/token/{userID}`            | Get user token   | [ ]      |
| GET    | `/api/v1/export/{userID}`           | Export user data | [ ]      |

### Upload/Device APIs

| Method | Endpoint                                           | Description              | Migrated |
| ------ | -------------------------------------------------- | ------------------------ | -------- |
| GET    | `/api/v1/uploads/{userID}`                         | Get user uploads         | [ ]      |
| DELETE | `/api/v1/delete/dataset/{userID}/{dataSetID}`      | Delete dataset           | [ ]      |
| DELETE | `/api/v1/delete/dataset/data/{userID}/{dataSetID}` | Delete data from dataset | [ ]      |
| GET    | `/api/v1/device/settings/{userID}`                 | Get device settings      | [ ]      |
| GET    | `/api/v1/connected/devices/{userID}`               | Get connected devices    | [ ]      |

### Sharing APIs

| Method | Endpoint                               | Description          | Migrated |
| ------ | -------------------------------------- | -------------------- | -------- |
| GET    | `/api/v1/shared/users/{userID}`        | Get shared users     | [ ]      |
| GET    | `/api/v1/shared/users/id/{userID}`     | Get shared user IDs  | [ ]      |
| GET    | `/api/v1/confirm/invite/{userID}`      | Get sent invites     | [ ]      |
| GET    | `/api/v1/confirm/invitations/{userID}` | Get received invites | [ ]      |

### Clinic APIs

| Method | Endpoint                                      | Description               | Migrated |
| ------ | --------------------------------------------- | ------------------------- | -------- |
| GET    | `/api/v1/clinicians/{userID}/clinics`         | Get clinics for clinician | [ ]      |
| GET    | `/api/v1/patients/{userID}/clinics`           | Get clinics for patient   | [ ]      |
| GET    | `/api/v1/clinics/{clinicID}/clinicians`       | Get clinicians for clinic | [ ]      |
| GET    | `/api/v1/clinics/{clinicID}/patients`         | Get patients for clinic   | [ ]      |
| GET    | `/api/v1/clinics/{clinicID}/invites/patients` | Get patient invites       | [ ]      |
| POST   | `/api/v1/clinicians/{userID}/migrate`         | Migrate to clinic account | [ ]      |
| POST   | `/api/v1/clinics/{clinicID}/migrations`       | Merge patient list        | [ ]      |
| POST   | `/api/v1/clinics/{clinicID}/tier`             | Update clinic tier        | [ ]      |
| GET    | `/api/v1/clinic/report`                       | Generate clinic report    | [ ]      |
| POST   | `/api/v1/clinics/{clinicID}/reports/merge`    | Generate merge report     | [ ]      |

### Auth/Agent APIs

| Method | Endpoint                                       | Description            | Migrated |
| ------ | ---------------------------------------------- | ---------------------- | -------- |
| GET    | `/api/v1/agent/`                               | Get current agent info | [ ]      |
| GET    | `/api/v1/signup/key/{userID}`                  | Get signup key         | [ ]      |
| PUT    | `/api/v1/signup/confirm/{userID}/{confirmKey}` | Confirm signup         | [ ]      |
| POST   | `/api/v1/send/confirm/account/{userID}`        | Send confirmation      | [ ]      |
| POST   | `/api/v1/resend/confirm/account/{email}`       | Resend confirmation    | [ ]      |

---

## 9. Configuration & Environment

| File                                 | Purpose                     | Migrated |
| ------------------------------------ | --------------------------- | -------- |
| `.env`                               | Environment variables       | [ ]      |
| `.env.{environment}`                 | Environment-specific config | [ ]      |
| `webpack.dev.js` / `webpack.prod.js` | Build configuration         | [ ]      |
| `postcss.config.js`                  | CSS processing              | [ ]      |

---

## Notes

- Features marked with `[ ]` are not yet migrated
- Features marked with `[x]` have been migrated to orca-remix
- Features marked with `[-]` are intentionally not being migrated (deprecated/not needed)

## References

- Legacy admin-site repository: `../admin-site`
- Tidepool API documentation: <https://tidepool.redocly.app/tidepool-apis>
- Clinic API: <https://tidepool.redocly.app/reference/clinic.v1>

---

## 10. Planned New Features (from Orca 2.0 Product Planning)

These features are identified as "New" in the product planning document and need to be implemented.

### Implementation Status Legend

- `[ ]` - Not started
- `[~]` - In progress
- `[x]` - Completed

### Phase 1: Core User Management Actions (High Priority)

| Feature | Description | API Endpoint | Status | Logging Required |
|---------|-------------|--------------|--------|------------------|
| Delete All Uploads for User | Bulk delete all uploads for a user | New bulk endpoint needed | [ ] | Yes |
| Disconnect Cloud Connection | Disconnect user's passive/cloud data connection | DELETE `/v1/users/{userId}/data_sources/{id}` | [ ] | Yes |

### Phase 2: Clinic Configuration (High Priority)

| Feature | Description | API Endpoint | Status | Logging Required |
|---------|-------------|--------------|--------|------------------|
| Update MRN-Required Setting | Toggle MRN requirement for clinic | PATCH `/v1/clinics/{clinicId}` | [ ] | Yes |
| Update Clinic Timezone | Change clinic timezone setting | PATCH `/v1/clinics/{clinicId}` | [ ] | Yes |
| Add/Remove Patient Limit | Modify patient limit for clinic | PATCH `/v1/clinics/{clinicId}` | [ ] | Yes |
| Delete Clinic Workspace | Delete entire clinic workspace | DELETE `/v1/clinics/{clinicId}` | [ ] | Yes |

### Phase 3: Clinic Membership Management (Medium Priority)

| Feature | Description | API Endpoint | Status | Logging Required |
|---------|-------------|--------------|--------|------------------|
| Revoke Clinician Invitation | Cancel pending clinician invite | DELETE `/v1/clinics/{clinicId}/invites/clinicians/{inviteId}` | [ ] | Yes |
| Remove Clinician from Clinic | Remove clinician access from workspace | DELETE `/v1/clinics/{clinicId}/clinicians/{clinicianId}` | [ ] | Yes |
| Revoke Patient Invitation | Cancel pending patient invite | DELETE `/v1/clinics/{clinicId}/invites/patients/{inviteId}` | [ ] | Yes |

### Phase 4: UX Enhancements (Lower Priority)

| Feature | Description | Implementation | Status | Logging Required |
|---------|-------------|----------------|--------|------------------|
| View Recent Searches | Show user's recent search history | Local storage (already implemented via RecentItemsContext) | [x] | No |
| Sort/Filter Table Data | Enhanced table sorting and filtering | Client-side (partially implemented) | [~] | No |
| Confirm Bulk Actions | Confirmation modal for high-impact actions | UI component (ConfirmationModal exists) | [~] | Yes |

### Phase 5: Advanced Features (Post-MVP)

| Feature | Description | API Endpoint | Status | Logging Required |
|---------|-------------|--------------|--------|------------------|
| Download Raw Upload Blob | Download raw data from AWS S3 | Presigned URL endpoint needed | [ ] | Yes |
| Merge Clinic Workspaces | Combine two clinic workspaces into one | Complex orchestration endpoint | [ ] | Yes |

---

## 11. Implementation Notes

### API Documentation References

- **Clinic API**: https://tidepool.redocly.app/reference/clinic.v1
- **Export API**: https://tidepool.redocly.app/reference/export.v1
- **Full API docs**: https://tidepool.redocly.app/tidepool-apis

### Implementation Considerations

1. **Logging Requirements**: All destructive actions (delete, disconnect, revoke) must be logged with:
   - Agent email (who performed the action)
   - Target resource (user ID, clinic ID, etc.)
   - Timestamp
   - Action type

2. **Confirmation Modals**: High-impact actions should use the existing `ConfirmationModal` component with clear warning text.

3. **API Integration**: New endpoints should follow the existing pattern in `app/api.server.ts`.

4. **Error Handling**: Use existing error utilities from `app/utils/errors.ts`.
