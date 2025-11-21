export type Clinic = {
  shareCode: string;
  id: string;
  name: string;
  createdTime: string;
  canMigrate: boolean;
  tier: string;
  patientTags?: {
    id: string;
    name: string;
  }[];
  sites?: {
    id: string;
    name: string;
  }[];
};

export type RecentClinic = Pick<Clinic, 'shareCode' | 'id' | 'name'>;

export type Patient = {
  id: string;
  email?: string;
  fullName: string;
  birthDate: string;
  mrn?: string;
  tags?: string[] | null;
  targetDevices?: string[];
  permissions?: {
    custodian?: Record<string, unknown>;
    view?: Record<string, unknown>;
    note?: Record<string, unknown>;
    upload?: Record<string, unknown>;
  };
  createdTime: string;
  updatedTime: string;
  attestationSubmitted?: boolean;
  dataSources?: {
    state?: string;
    providerName?: string;
    modifiedTime?: string;
    expirationTime?: string;
  }[] | null;
  lastUploadReminderTime?: string;
  reviews?: {
    clinicianId?: string;
    time?: string;
  }[] | null;
  connectionRequests: {
    twiist: {
      createdTime: string;
      providerName: 'dexcom' | 'twiist' | 'abbott';
    }[];
    dexcom: {
      createdTime: string;
      providerName: 'dexcom' | 'twiist' | 'abbott';
    }[];
    abbott: {
      createdTime: string;
      providerName: 'dexcom' | 'twiist' | 'abbott';
    }[];
  };
  sites?: {
    id?: string;
    name?: string;
  }[];
};

export type PatientInvite = {
  key: string;
  type: string;
  email: string;
  clinicId: string;
  creatorId: string;
  creator: {
    profile: {
      fullName: string;
      patient: {
        birthday: string;
        diagnosisDate: string;
        isOtherPerson: boolean;
        fullName: string;
      };
    };
    userid: string;
  };
  context: {
    note?: Record<string, unknown>;
    upload?: Record<string, unknown>;
    view?: Record<string, unknown>;
  };
  created: string;
  modified: string;
  status: 'pending' | 'accepted' | 'declined';
  expiresAt: string;
  restrictions: unknown;
};

export type Clinician = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  createdTime: string;
  updatedTime: string;
};

export type RecentClinician = Pick<Clinician, 'id' | 'name' | 'email' | 'roles'> & {
  lastViewedAt: string;
};

export type RecentPatient = Pick<Patient, 'id' | 'fullName' | 'email'>;
