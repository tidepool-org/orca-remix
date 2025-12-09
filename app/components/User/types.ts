export type User = {
  emailVerified: boolean;
  emails: string[];
  passwordExists: boolean;
  roles: string[];
  termsAccepted: string;
  userid: string;
  username: string;
};

export type Profile = {
  email: string;
  fullName?: string;
  patient?: {
    birthday: string;
    emails: string[];
  };
  clinic?: {
    role: string;
  };
};

export type RecentUser = Pick<User, 'username' | 'userid'> &
  Pick<Profile, 'fullName'>;

export type DataSet = {
  uploadId: string;
  byUser?: string;
  computerTime?: string;
  conversionOffset?: number;
  dataSetType: string;
  deviceId?: string;
  deviceManufacturers?: string[];
  deviceModel?: string;
  deviceSerialNumber?: string;
  deviceTags?: string[];
  deviceTime?: string;
  time: string;
  timezoneOffset?: number;
  version?: string;
};

export type DataSource = {
  dataSourceId: string;
  providerName: string;
  providerType?: string;
  state?: string;
  modifiedTime?: string;
  expirationTime?: string;
  lastImportTime?: string;
  earliestDataTime?: string;
  latestDataTime?: string;
  dataSetIds?: string[];
};

export type DataSetsResponse =
  | DataSet[]
  | { data: DataSet[]; meta?: { count: number } };
export type DataSourcesResponse =
  | DataSource[]
  | { data: DataSource[]; meta?: { count: number } };

// Data Sharing Types
// Permissions object representing access rights
export type Permissions = {
  root?: Record<string, never>; // Owner
  custodian?: Record<string, never>; // Custodian
  view?: Record<string, never>; // View
  note?: Record<string, never>; // Notes
  upload?: Record<string, never>; // Upload
};

// Response from GET /access/groups/{userId} - accounts that share with user
// Response from GET /access/{userId} - users who have access to this user's data
export type AccessPermissionsMap = Record<string, Permissions>;

// Care team invite (confirmation)
export type ShareInvite = {
  key: string;
  type:
    | 'password_reset'
    | 'careteam_invitation'
    | 'clinician_invitation'
    | 'signup_confirmation'
    | 'no_account';
  status: 'pending' | 'completed' | 'canceled' | 'declined';
  email: string;
  creatorId: string;
  created: string;
  modified?: string;
  creator?: {
    userid: string;
    profile?: {
      fullName?: string;
    };
  };
  context?: string;
  restrictions?: {
    canAccept?: boolean;
    requiredIdp?: string;
  };
  expiresAt?: string;
};
