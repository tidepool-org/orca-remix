import { z } from 'zod';

/**
 * Core domain schemas
 */

export const ClinicSchema = z.object({
  id: z.string(),
  name: z.string(),
  shareCode: z.string(),
  tier: z.string(),
  timezone: z.string().optional(),
  createdTime: z.string(),
  canMigrate: z.boolean(),
  patientTags: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .optional(),
  sites: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .optional(),
});

export const PatientSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email().optional(),
  birthDate: z.string(),
  mrn: z.string().optional(),
  tags: z.array(z.string()).nullable().optional(),
  targetDevices: z.array(z.string()).optional(),
  permissions: z
    .object({
      custodian: z.record(z.unknown()).optional(),
      view: z.record(z.unknown()).optional(),
      note: z.record(z.unknown()).optional(),
      upload: z.record(z.unknown()).optional(),
    })
    .optional(),
  createdTime: z.string(),
  updatedTime: z.string(),
  attestationSubmitted: z.boolean().optional(),
  dataSources: z
    .array(
      z.object({
        state: z.string().optional(),
        providerName: z.string().optional(),
        modifiedTime: z.string().optional(),
        expirationTime: z.string().optional(),
      }),
    )
    .nullable()
    .optional(),
  lastUploadReminderTime: z.string().optional(),
  reviews: z
    .array(
      z.object({
        clinicianId: z.string().optional(),
        time: z.string().optional(),
      }),
    )
    .nullable()
    .optional(),
  connectionRequests: z.object({
    twiist: z.array(
      z.object({
        createdTime: z.string(),
        providerName: z.enum(['dexcom', 'twiist', 'abbott']),
      }),
    ),
    dexcom: z.array(
      z.object({
        createdTime: z.string(),
        providerName: z.enum(['dexcom', 'twiist', 'abbott']),
      }),
    ),
    abbott: z.array(
      z.object({
        createdTime: z.string(),
        providerName: z.enum(['dexcom', 'twiist', 'abbott']),
      }),
    ),
  }),
  sites: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().optional(),
      }),
    )
    .optional(),
});

export const ClinicianSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  roles: z.array(z.string()),
  createdTime: z.string(),
  updatedTime: z.string(),
});

export const PatientInviteSchema = z.object({
  key: z.string(),
  type: z.string(),
  email: z.string().email(),
  clinicId: z.string(),
  creatorId: z.string(),
  creator: z.object({
    profile: z.object({
      fullName: z.string(),
      patient: z.object({
        birthday: z.string(),
        diagnosisDate: z.string(),
        isOtherPerson: z.boolean(),
        fullName: z.string(),
      }),
    }),
    userid: z.string(),
  }),
  context: z.object({
    note: z.record(z.unknown()).optional(),
    upload: z.record(z.unknown()).optional(),
    view: z.record(z.unknown()).optional(),
  }),
  created: z.string(),
  modified: z.string(),
  status: z.enum(['pending', 'accepted', 'declined']),
  expiresAt: z.string(),
  restrictions: z.unknown(),
});

// User schema - some fields are optional to support unclaimed/custodial accounts
// Unclaimed accounts are created by clinicians for patients who haven't verified their email yet
export const UserSchema = z.object({
  emailVerified: z.boolean().optional(),
  emails: z.array(z.string()).optional(),
  passwordExists: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
  termsAccepted: z.string().optional(),
  userid: z.string(),
  username: z.string().optional(),
});

export const ProfileSchema = z.object({
  email: z.string().email(),
  fullName: z.string().optional(),
  patient: z
    .object({
      birthday: z.string(),
      emails: z.array(z.string()),
    })
    .optional(),
  clinic: z
    .object({
      role: z.string(),
    })
    .optional(),
});

/**
 * API Response schemas
 */

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      count: z.number(),
      offset: z.number().optional(),
      limit: z.number().optional(),
    }),
  });

export const ClinicianClinicMembershipSchema = z.object({
  clinic: ClinicSchema,
  clinician: z.object({
    id: z.string(),
    roles: z.array(z.string()),
  }),
});

// Response schemas for specific endpoints
export const GetPatientsResponseSchema = PaginatedResponseSchema(PatientSchema);
export const GetCliniciansResponseSchema =
  PaginatedResponseSchema(ClinicianSchema);
export const GetPatientInvitesResponseSchema = z.array(PatientInviteSchema);

// Handle union type for clinics endpoint (can return array or paginated object)
export const GetClinicsForClinicianResponseSchema = z.union([
  z.array(ClinicianClinicMembershipSchema),
  PaginatedResponseSchema(ClinicianClinicMembershipSchema),
]);

/**
 * Form/Input validation schemas
 */

export const UserSearchSchema = z.object({
  search: z
    .string()
    .min(1, 'Search term is required')
    .refine(
      (val) => {
        // Must be valid email OR valid user ID (UUID format or alphanumeric)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const userIdRegex = /^[a-zA-Z0-9]+$/;
        return (
          emailRegex.test(val) || uuidRegex.test(val) || userIdRegex.test(val)
        );
      },
      {
        message: 'Must be a valid email address or user ID',
      },
    ),
});

export const ClinicSearchSchema = z.object({
  search: z
    .string()
    .min(1, 'Search term is required')
    .refine(
      (val) => {
        // Must be clinic ID (UUID format or 10+ hex chars) or share code (uppercase letters/numbers, no vowels/0/1)
        const clinicIdRegex = /^[0-9a-f]{10,}$/i; // 10 or more hex chars, case insensitive
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; // UUID format
        const shareCodeRegex =
          /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;
        return (
          clinicIdRegex.test(val) ||
          uuidRegex.test(val) ||
          shareCodeRegex.test(val)
        );
      },
      {
        message: 'Must be a valid clinic ID or share code',
      },
    ),
});

export const UpdateTierSchema = z.object({
  tier: z.enum(['tier0100', 'tier0200', 'tier0300', 'tier0400'], {
    errorMap: () => ({ message: 'Invalid tier selected' }),
  }),
});

// MRN settings schema
export const MrnSettingsSchema = z.object({
  required: z.boolean(),
  unique: z.boolean(),
});

// Patient count limit schema
export const PatientCountLimitSchema = z.object({
  plan: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Patient count settings schema
export const PatientCountSettingsSchema = z.object({
  hardLimit: PatientCountLimitSchema.optional(),
  softLimit: PatientCountLimitSchema.optional(),
});

// Update clinic timezone schema
export const UpdateTimezoneSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
});

/**
 * Infer TypeScript types from schemas
 */
export type Clinic = z.infer<typeof ClinicSchema>;
export type Patient = z.infer<typeof PatientSchema>;
export type Clinician = z.infer<typeof ClinicianSchema>;
export type PatientInvite = z.infer<typeof PatientInviteSchema>;
export type User = z.infer<typeof UserSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ClinicianClinicMembership = z.infer<
  typeof ClinicianClinicMembershipSchema
>;
export type MrnSettings = z.infer<typeof MrnSettingsSchema>;
export type PatientCountLimit = z.infer<typeof PatientCountLimitSchema>;
export type PatientCountSettings = z.infer<typeof PatientCountSettingsSchema>;
