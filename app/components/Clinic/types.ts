export type Clinic = {
  shareCode: string;
  id: string;
  name: string;
  createdTime: string;
  canMigrate: boolean;
  tier: string;
  timezone?: string;
  patientTags?: {
    id: string;
    name: string;
  }[];
  sites?: {
    id: string;
    name: string;
  }[];
};

// MRN settings for a clinic
export type ClinicMrnSettings = {
  required: boolean;
  unique: boolean;
};

// Patient count limit configuration
export type PatientCountLimit = {
  plan?: number;
  startDate?: string;
  endDate?: string;
};

// Patient count settings for a clinic
export type ClinicPatientCountSettings = {
  hardLimit?: PatientCountLimit;
  softLimit?: PatientCountLimit;
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
  dataSources?:
    | {
        state?: string;
        providerName?: string;
        modifiedTime?: string;
        expirationTime?: string;
      }[]
    | null;
  lastUploadReminderTime?: string;
  reviews?:
    | {
        clinicianId?: string;
        time?: string;
      }[]
    | null;
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

export type ClinicianInvite = {
  inviteId: string;
  email: string;
  roles: string[];
  clinicId: string;
  clinicName?: string;
  invitedBy?: string;
  createdTime: string;
  modifiedTime?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
};

export type RecentClinician = Pick<
  Clinician,
  'id' | 'name' | 'email' | 'roles'
> & {
  lastViewedAt: string;
};

export type RecentPatient = Pick<Patient, 'id' | 'fullName' | 'email'>;

// API response types for clinician-clinic relationships
export type ClinicianClinicMembership = {
  clinic: Clinic;
  clinician: {
    id: string;
    roles: string[];
  };
};

// API response types for patient-clinic relationships
export type PatientClinicMembership = {
  clinic: Clinic;
  patient: {
    id: string;
    permissions?: {
      custodian?: Record<string, unknown>;
      view?: Record<string, unknown>;
      note?: Record<string, unknown>;
      upload?: Record<string, unknown>;
    };
  };
};

// Prescription types
export type PrescriptionState =
  | 'draft'
  | 'pending'
  | 'submitted'
  | 'claimed'
  | 'active'
  | 'inactive'
  | 'expired';

export type PrescriptionRevisionAttributes = {
  firstName?: string;
  lastName?: string;
  birthday?: string;
  mrn?: string;
  email?: string;
  sex?: 'male' | 'female' | 'undisclosed';
  weight?: {
    value: number;
    units: string;
  };
  yearOfDiagnosis?: number;
  phoneNumber?: {
    countryCode: string;
    number: string;
  };
  initialSettings?: {
    bloodGlucoseUnits?: string;
    basalRateSchedule?: Array<{
      rate: number;
      start: number;
    }>;
    bloodGlucoseTargetSchedule?: Array<{
      start: number;
      low?: number;
      high?: number;
    }>;
    carbohydrateRatioSchedule?: Array<{
      amount: number;
      start: number;
    }>;
    insulinSensitivitySchedule?: Array<{
      amount: number;
      start: number;
    }>;
    basalRateMaximum?: {
      value: number;
      units: string;
    };
    bolusAmountMaximum?: {
      value: number;
      units: string;
    };
    bloodGlucoseSuspendThreshold?: {
      value: number;
      units: string;
    };
    insulinModel?: 'rapidChild' | 'rapidAdult';
    pumpId?: string;
    cgmId?: string;
  };
  training?: 'inPerson' | 'inModule';
  therapySettings?: 'initial' | 'transferPumpSettings';
  prescriberTermsAccepted?: boolean;
  calculator?: {
    method: 'weight' | 'totalDailyDose' | 'totalDailyDoseAndWeight';
    weight?: number;
    weightUnits?: 'kg' | 'lbs';
    totalDailyDoseScaleFactor?: number;
    totalDailyDose?: number;
    recommendedBasalRate: number;
    recommendedInsulinSensitivity: number;
    recommendedCarbohydrateRatio: number;
  };
  revisionHash?: string;
  caregiverFirstName?: string;
  caregiverLastName?: string;
  accountType?: 'patient' | 'caregiver';
};

export type PrescriptionRevision = {
  revisionId?: number;
  attributes: PrescriptionRevisionAttributes;
};

export type Prescription = {
  id: string;
  clinicId: string;
  patientUserId?: string;
  prescriberUserId?: string;
  state: PrescriptionState;
  createdTime: string;
  createdUserId: string;
  modifiedTime: string;
  modifiedUserId: string;
  expirationTime?: string;
  deletedTime?: string;
  deletedUserId?: string;
  latestRevision: PrescriptionRevision;
};
