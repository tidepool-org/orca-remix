import Well from '~/partials/Well';
import { Link } from 'react-router';

import type { Prescription, Clinician } from './types';
import useLocale from '~/hooks/useLocale';
import ClipboardButton from '../ClipboardButton';
import ProfileHeader from '~/components/ui/ProfileHeader';
import StatusChip from '~/components/ui/StatusChip';
import { formatShortDate } from '~/utils/dateFormatters';

export type PrescriptionProfileProps = {
  prescription: Prescription;
  prescriber?: Clinician | null;
  clinicId: string;
};

export default function PrescriptionProfile({
  prescription,
  prescriber,
  clinicId,
}: PrescriptionProfileProps) {
  const { locale } = useLocale();
  const {
    id,
    state,
    createdTime,
    modifiedTime,
    expirationTime,
    patientUserId,
    prescriberUserId,
    latestRevision,
  } = prescription;

  const attrs = latestRevision?.attributes || {};

  const patientName =
    attrs.firstName && attrs.lastName
      ? `${attrs.firstName} ${attrs.lastName}`
      : attrs.firstName || attrs.lastName || 'Unknown Patient';

  // ProfileHeader configuration
  const prescriptionIdentifiers = [
    { label: 'ID:', value: id, monospace: true },
    ...(patientUserId
      ? [{ label: 'Patient:', value: patientUserId, monospace: true }]
      : []),
  ];

  const prescriptionDetailFields = [
    { label: 'Created', value: formatShortDate(createdTime, locale) || 'N/A' },
    {
      label: 'Modified',
      value: formatShortDate(modifiedTime, locale) || 'N/A',
    },
    {
      label: 'Expires',
      value: formatShortDate(expirationTime, locale) || 'N/A',
    },
    ...(latestRevision?.revisionId !== undefined
      ? [{ label: 'Revision', value: String(latestRevision.revisionId) }]
      : []),
  ];

  const stateChip = <StatusChip status={state} type="prescription" />;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Prescription Header - Using ProfileHeader */}
      <ProfileHeader
        title={`Prescription for ${patientName}`}
        titleRowExtra={stateChip}
        identifiers={prescriptionIdentifiers}
        detailFields={prescriptionDetailFields}
      />

      {/* Patient & Prescriber Info - Side by side on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Information */}
        <Well>
          <h2 className="text-lg font-semibold mb-3">Patient Information</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="text-default-400 block text-xs">Email</span>
              <span className="flex items-center gap-1 text-default-600">
                {attrs.email || 'N/A'}
                {attrs.email && <ClipboardButton clipboardText={attrs.email} />}
              </span>
            </div>
            <div>
              <span className="text-default-400 block text-xs">Birthday</span>
              <span className="text-default-600">
                {attrs.birthday
                  ? formatShortDate(attrs.birthday, locale) || attrs.birthday
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-default-400 block text-xs">MRN</span>
              <span className="flex items-center gap-1 text-default-600">
                {attrs.mrn || 'N/A'}
                {attrs.mrn && <ClipboardButton clipboardText={attrs.mrn} />}
              </span>
            </div>
            <div>
              <span className="text-default-400 block text-xs">Sex</span>
              <span className="text-default-600">
                {attrs.sex
                  ? attrs.sex.charAt(0).toUpperCase() + attrs.sex.slice(1)
                  : 'N/A'}
              </span>
            </div>
            {attrs.phoneNumber && (
              <div>
                <span className="text-default-400 block text-xs">Phone</span>
                <span className="text-default-600">
                  {attrs.phoneNumber.countryCode} {attrs.phoneNumber.number}
                </span>
              </div>
            )}
            {attrs.weight && (
              <div>
                <span className="text-default-400 block text-xs">Weight</span>
                <span className="text-default-600">
                  {attrs.weight.value} {attrs.weight.units}
                </span>
              </div>
            )}
            {attrs.yearOfDiagnosis && (
              <div>
                <span className="text-default-400 block text-xs">
                  Year of Diagnosis
                </span>
                <span className="text-default-600">
                  {attrs.yearOfDiagnosis}
                </span>
              </div>
            )}
          </div>
        </Well>

        {/* Prescriber Information */}
        <Well>
          <h2 className="text-lg font-semibold mb-3">Prescriber Information</h2>
          <div className="grid grid-cols-1 gap-y-2 text-sm">
            <div>
              <span className="text-default-400 block text-xs">
                Prescriber ID
              </span>
              {prescriberUserId ? (
                <span className="flex items-center gap-1">
                  <Link
                    to={`/clinics/${clinicId}/clinicians/${prescriberUserId}`}
                    className="text-primary hover:underline font-mono"
                  >
                    {prescriberUserId}
                  </Link>
                  <ClipboardButton clipboardText={prescriberUserId} />
                </span>
              ) : (
                <span className="text-default-600">N/A</span>
              )}
            </div>
            {prescriber && (
              <>
                <div>
                  <span className="text-default-400 block text-xs">Name</span>
                  <span className="text-default-600">
                    {prescriber.name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-default-400 block text-xs">Email</span>
                  <span className="flex items-center gap-1 text-default-600">
                    {prescriber.email || 'N/A'}
                    {prescriber.email && (
                      <ClipboardButton clipboardText={prescriber.email} />
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
        </Well>
      </div>

      {/* Therapy Details & Initial Settings - Side by side */}
      {(attrs.training ||
        attrs.therapySettings ||
        attrs.accountType ||
        attrs.initialSettings) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Therapy Details */}
          {(attrs.training || attrs.therapySettings || attrs.accountType) && (
            <Well>
              <h2 className="text-lg font-semibold mb-3">Therapy Details</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {attrs.training && (
                  <div>
                    <span className="text-default-400 block text-xs">
                      Training
                    </span>
                    <span className="text-default-600">
                      {attrs.training === 'inPerson'
                        ? 'In Person'
                        : 'In Module'}
                    </span>
                  </div>
                )}
                {attrs.therapySettings && (
                  <div>
                    <span className="text-default-400 block text-xs">
                      Therapy Settings
                    </span>
                    <span className="text-default-600">
                      {attrs.therapySettings === 'initial'
                        ? 'Initial'
                        : 'Transfer Pump Settings'}
                    </span>
                  </div>
                )}
                {attrs.accountType && (
                  <div>
                    <span className="text-default-400 block text-xs">
                      Account Type
                    </span>
                    <span className="text-default-600">
                      {attrs.accountType.charAt(0).toUpperCase() +
                        attrs.accountType.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </Well>
          )}

          {/* Initial Settings */}
          {attrs.initialSettings && (
            <Well>
              <h2 className="text-lg font-semibold mb-3">Initial Settings</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {attrs.initialSettings.bloodGlucoseUnits && (
                  <div>
                    <span className="text-default-400 block text-xs">
                      BG Units
                    </span>
                    <span className="text-default-600">
                      {attrs.initialSettings.bloodGlucoseUnits}
                    </span>
                  </div>
                )}
                {attrs.initialSettings.insulinModel && (
                  <div>
                    <span className="text-default-400 block text-xs">
                      Insulin Model
                    </span>
                    <span className="text-default-600">
                      {attrs.initialSettings.insulinModel === 'rapidChild'
                        ? 'Rapid Child'
                        : 'Rapid Adult'}
                    </span>
                  </div>
                )}
                {attrs.initialSettings.pumpId && (
                  <div>
                    <span className="text-default-400 block text-xs">
                      Pump ID
                    </span>
                    <span className="text-default-600">
                      {attrs.initialSettings.pumpId}
                    </span>
                  </div>
                )}
                {attrs.initialSettings.cgmId && (
                  <div>
                    <span className="text-default-400 block text-xs">
                      CGM ID
                    </span>
                    <span className="text-default-600">
                      {attrs.initialSettings.cgmId}
                    </span>
                  </div>
                )}
              </div>
            </Well>
          )}
        </div>
      )}
    </div>
  );
}
