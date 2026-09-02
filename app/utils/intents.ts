/** Every form `intent` an `action` accepts; the strings are what routes match on. */
export const intents = {
  verifyEmail: 'verify-email',
  passwordReset: 'password-reset',
  sendConfirmation: 'send-confirmation',
  resendConfirmation: 'resend-confirmation',
  deleteUserData: 'delete-user-data',
  deleteAccount: 'delete-account',
  deleteDataSet: 'delete-dataset',
  clearDataSetData: 'clear-dataset-data',
  disconnectDataSource: 'disconnect-data-source',
  sendConnectRequest: 'send-connect-request',
  updateRoles: 'update-roles',
} as const;

export type Intent = (typeof intents)[keyof typeof intents];

export const userAccountIntents = [
  intents.verifyEmail,
  intents.passwordReset,
  intents.sendConfirmation,
  intents.resendConfirmation,
  intents.deleteUserData,
  intents.deleteAccount,
] as const;

export type UserAccountIntent = (typeof userAccountIntents)[number];

export const dataSetIntents = [
  intents.deleteDataSet,
  intents.clearDataSetData,
] as const;

export type DataSetIntent = (typeof dataSetIntents)[number];

/** Accepted by `/users/:userId`. */
export const userRouteIntents = [
  ...userAccountIntents,
  ...dataSetIntents,
  intents.disconnectDataSource,
] as const;

/** Accepted by `/clinics/:clinicId/patients/:patientId`. */
export const patientRouteIntents = [
  intents.sendConnectRequest,
  ...dataSetIntents,
] as const;

/** Accepted by `/clinics/:clinicId/clinicians/:clinicianId`. */
export const clinicianRouteIntents = [intents.updateRoles] as const;

export function isIntent<T extends Intent>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return (
    typeof value === 'string' && (allowed as readonly string[]).includes(value)
  );
}
