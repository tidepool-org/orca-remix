export type Clinic = {
  shareCode: string;
  id: string;
  name: string;
  createdTime: string;
  canMigrate: boolean;
  tier: string;
};

export type RecentClinic = Pick<Clinic, 'shareCode' | 'id' | 'name'>;

export type Patient = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  birthDate?: string;
  mrn?: string;
  createdTime: string;
  updatedTime: string;
  tags?: string[];
  permissions?: {
    view?: boolean;
    upload?: boolean;
    note?: boolean;
  };
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
  userId: string;
  fullName: string;
  email: string;
  role: string;
  createdTime: string;
  updatedTime: string;
  permissions?: {
    view?: boolean;
    upload?: boolean;
    note?: boolean;
  };
};

export type RecentClinician = Pick<Clinician, 'id' | 'fullName' | 'email' | 'role'> & {
  lastViewedAt: string;
};

export type RecentPatient = Pick<Patient, 'id' | 'fullName' | 'email'>;
