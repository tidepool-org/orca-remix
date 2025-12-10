**Additional: Include???**

@Rea Rostosky@William Zeller To consider: if we can build in a way to send a one-off email via some sort of command line, this would allow Support to re-initiate the process for a specific user if asked through our Zendesk tickets. Until this capability is built in ORCA 2.0, it would be helpful to consider some other sort of on-demand capability if a high-priority request comes in that won’t wait for the recurring email send to take place once a month. cc @Dave Cintron 

# **Data Table Specs**

# Patient / Personal User Tables

## **1\) Identity Overview**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| userId | string | No |  |  |
| name | string | No | `Alex Garcia` |  |
| birthDate | date | No | `1991-03-22` |  |
| diagnosisDate | date | Yes | `2016-11-01` |  |
| email | string (email) | Yes | `alex@example.com` |  |

## **2\) Account Metadata**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| userId | string | No |  |  |
| custodialStatus | Enum (`custodial`, `claimed`) | No | `custodial` |  |
| accountCreatedAt | datetime | No | `2025-10-15T09:33:04Z` |  |
| accountVerifiedAt | datetime | Yes | `2025-10-16T12:10:00Z` |  |
| termsAcceptedAt | datetime | Yes | `2025-10-16T12:11:00Z` |  |
| creatorUserId (FK→Clinician.userId) | string | Yes |  |  |

## **3\) Shares (Outgoing → People)**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| toUserId | string | Yes |  |  |
| toName | string | Yes | `Taylor Reed` |  |
| toEmail | string | Yes | `taylor@example.com` |  |
| inviteStatus | enum(`invited,accepted`,`revoked`,`expired`) | No | `accepted` |  |
| statusDate | datetime | No | `2025-10-20T09:00:00Z` |  |
| accessLevel | enum (`read`,`write`) | No | `read` |  |

## **4\) Shares (Incoming ← People)**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| fromUserId | string | No |  |  |
| fromName | string | No | `Taylor Reed` |  |
| fromEmail | string | No | `taylor@example.com` |  |
| inviteStatus | enum(`invited`,`accepted`,`revoked`,`expired`) | No | `accepted` |  |
| statusDate | datetime | No | `2025-10-19T10:00:00Z` |  |
| accessLevel | enum(`read`,`write`) | No | `read` |  |

## **5\) Shares (Outgoing → Clinics)**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| clinicId | string | No |  | Clinic Service |
| clinicShareCode | string | No | `ABCD-1234` | Clinic Service |
| inviteStatus | Enum (`pending`,`accepted`,`null`) | Yes | `accepted` | Clinic Service |
| statusDate | datetime | Yes | `2025-10-22T09:00:00Z` | Clinic Service |
| createdAsCustodial | bool | No | `true` | Clinic Service |

**6\) Uploads**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| userId | string | No |  | Data / Upload Service |
| uploadId | string | No |  | Data / Upload Service |
| deviceName | string | No | `Dexcom G6` | Upload Metadata |
| deviceSerial | string | No | `G6-123456` | Upload Metadata |
| uploaderVersion | string | No | `2.86.0` | Upload Metadata |
| uploadedAt | datetime | No | `2025-10-24T09:00:00Z` | Data / Upload Service |
| uploadedByEmail | string | Yes | `nurse@clinic.org` | Upload Metadata |
| uploadedByuserId | string | Yes |  |  |

**7\) Cloud / Passive Connections**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| userId | string | No |  | Connections Service |
| source | enum(`Dexcom`,`LibreView`,`TidepoolMobile`,…) | No | `Dexcom` | Connections Service |
| initiatedAt | datetime | No | `2025-09-30T09:00:00Z` | Connections Service |
| lastUploadAt | datetime | Yes | `2025-10-25T09:00:00Z` | Connections Service |
| status | enum(`active`,`paused`,`error`,`disconnected`) | No | `active` | Connections Service |

# Clinician User Tables

## **1\) Identity Overview**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| userId | string (ULID/UUID) | No |  | Auth / User Service |
| name | string | No | `Jordan Kim, MD` | User Service |
| email | string (email) | No | `jordan.kim@clinic.org` | Auth / User Service |
| jobTitle | string | Yes | `Endocrinologist` | User Profile |
| npi | string | Yes | `1234567890` | User Profile / Admin Data |

## **2\) Account Metadata**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| userId | string | No |  | User Service |
| accountCreatedAt | datetime | No | `2025-10-15T09:33:04Z` | Auth Service |
| accountVerifiedAt | datetime | Yes | `2025-10-16T12:10:00Z` | Auth Service |
| termsAcceptedAt | datetime | Yes | `2025-10-16T12:11:00Z` | Auth Service |

## **3\) Workspace Membership**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| userId | string | No |  | Clinic Service |
| clinicId | string | No |  | Clinic Service |
| workspaceName | string | Yes | `UCSF Diabetes Center` | Clinic Service |
| inviteStatus | Enum (`invited,accepted`,`declined,accessRevoked`) | Yes | `accepted` | Clinic Service |
| statusDate | datetime | Yes | `2025-10-22T09:00:00Z` | Clinic Service |
| Role | Enum (`Member, Admin`) | No | `Member` | Clinic Service |
| LastLoginDate | datetime | No | `2025-10-22T09:00:00Z` |  |

# 

# Clinic Account Tables

## **1\) Clinic Workspace — Overview**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| clinicId | string | No | `cl_555…` | Clinic Service |
| workspaceName | string | No | `UCSF Diabetes Center` | Clinic Service |
| patientCount | integer | Yes | `842` | Clinic Service / Analytics |
| tier | enum(`Basic`,`Plus`,`Enterprise`, …) | No | `Plus` | Clinic Service |
| preferredUnits | enum(`mg/dL`,`mmol/L`) | Yes | `mg/dL` | Clinic Service |
| timeZone | string (IANA) | Yes | `America/Los_Angeles` | Clinic Service |
| ssoEnabled | boolean | No | `true` | Auth / Admin Config |
| redoxIntegration | boolean | No | `true` |  |
| xealthIntegration | boolean | No | `false` |  |
| directConnectIntegration | boolean | No | `false` |  |
| mrnRequired | boolean | No | `true` | Clinic Settings Service |

**2\) Clinic Workspace — Clinician Accounts**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| clinicId | string | No |  | Clinic Service |
| userId (clinician) | string | No |  | Clinic Service |
| name | string | No | `Jordan Kim, MD` | User Service |
| email | string (email) | No | `jordan.kim@clinic.org` | Auth / User Service |
| role | enum(`member,admin`) | No | `admin` | Clinic Service |
| InviteStatus | enum(`invited`,`accepted`,`declined`,`expired`) | Yes | `invited` |  |
| lastLoginAt | datetime | Yes | `2025-10-20T15:05:00Z` | Auth / Analytics Service |

## **4\) Clinic Workspace — Patient → Clinic Invites (Pending)**

*(Patients who have invited this clinic to view their data.)*

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| clinicId | string | No | `cl_555…` | Share / Invite Service |
| userId (patient) | string | No |  | Share / Invite Service |
| patientName | string | Yes | `Alex Garcia` | User Service |
| patientEmail | string | Yes | `alex@example.com` | User Service |
| sentAt | datetime | No | `2025-10-25T09:00:00Z` | Share / Invite Service |

## **5\) Clinic Workspace — Connected Patients**

*(Patients whose data is currently shared with this clinic workspace.)*

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| userId (patient) | string | No | `u_01HF…` | Clinic Service |
| clinicId | string | No | `cl_555…` | Clinic Service |
| patientName | string | No | `Alex Garcia` | User Service |
| patientEmail | string | Yes | `alex@example.com` | User Service |
| birthDate | date | No | `1991-03-22` | User Profile |
| mrn | string | Yes | `1234567` | Clinic Service / EHR |
| diabeteType | enum | Yes |  |  |
| custodialStatus | enum(`none`,`custodial`,`claimed`) | No | `custodial` | User / Clinic Service |
| dateAdded | datetime | No | `2025-10-26T08:40:00Z` |  |
| lastUploadAt | datetime | Yes | `2025-10-26T08:40:00Z` |  |
| assignedSites | string | Yes |  |  |
| assignedTags | string | Yes |  |  |
| assignedTargetRange | string | Yes |  |  |

**6\) Clinic Workspace — Uploads**

| Column | Type | Nullable | Example | Source of Truth |
| ----- | ----- | ----- | ----- | ----- |
| clinicId | string | No |  | Clinic Service |
| userId (clinician, user that uploaded) | string | No |  | Clinic Service |
| uploadId | string | No |  | Data / Upload Service |
| deviceName | string | No | `Dexcom G6` | Upload Metadata |
| deviceSerial | string | No | `G6-123456` | Upload Metadata |
| uploaderVersion | string | No | `2.86.0` | Upload Metadata |
| uploadedAt | datetime | No | `2025-10-24T09:00:00Z` | Data / Upload Service |
| uploadedForEmail | string | Yes | `patient@clinic.org` | Upload Metadata |
| uploadedForuserId | string | Yes |  | Upload Metadata |

# **Tasks & Logging Requirements**

### **A. Session & Search**

| Action | Feature Status | Notes / Context |
| ----- | ----- | ----- |
| Log when a Tidepool team member accesses ORCA | Probably not needed | Does **not** require logging – long-lived tokens; not a true login. |
| Perform a search (email / user ID / clinic ID) | Existing | Low-value telemetry only; logging optional. |
| View recent searches | New | Local, user-specific convenience – **no log needed**. |
| Sort / filter table data | New | Client-side only – **no log needed**. |
| Switch between production / test environments | Existing | Environment context should appear automatically in all logged actions. |
| Confirm bulk or high-impact action (e.g., merge, delete all) | New | Must be logged with actor \+ scope. |

### **B. User Account & Credentials**

| Action | Feature Status | Notes / Context |
| ----- | ----- | ----- |
| Manually verify a user account | Existing | Logged today. |
| Resend verification email (personal) | Existing | Logged today. |
| Resend verification email (custodial claim) | Existing | Logged today. |
| Send password-reset email | Existing | Logged today. |
| Delete patient or clinician account | Existing | Logged today. |

**C. Uploads & Data Exports**

| Action | Feature Status | Notes / Context |
| ----- | ----- | ----- |
| Delete single upload | Existing | Logged today. |
| Delete all uploads for a user | New | Data-destruction event; must be logged. |
| Export user data (XLSX / JSON) | Existing (partial) | Should log export type \+ date range. |
| Download raw upload blob (AWS) | New | Security-sensitive; must be logged. |

### **D. Cloud / Passive Connections**

| Action | Feature Status | Notes / Context |
| ----- | ----- | ----- |
| Disconnect user’s cloud / passive connection | New | New troubleshooting action; must track source disconnected. |

**E. Clinic Workspace Configuration & Lifecycle**

| Action | Feature Status | Notes / Context |
| ----- | ----- | ----- |
| Change clinic Tidepool+ tier | Existing | Logged today. |
| Remove/Add Patient Limit | New | Should be logged. |
| Update MRN-required setting | New | Compliance impact; should be logged. |
| Update clinic timezone | New | Compliance impact; should be logged. |
| Delete clinic workspace | New | Post-merge cleanup; must be logged. |
| Merge two clinic workspaces | New (post-MVP) | High-impact operation; must be logged. |

**F. Clinic Membership, Invites & Permissions**  
(NEEDED?????)

| Action | Feature Status | Notes / Context |
| ----- | ----- | ----- |
| Revoke pending clinician invitation | New | Prevents unauthorized access; should be logged. |
| Remove clinician from clinic workspace | New | Removes PHI access; should be logged. |
| Revoke pending patient → clinic invite | New | Security-related; should be logged. |

