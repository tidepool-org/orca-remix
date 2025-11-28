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
