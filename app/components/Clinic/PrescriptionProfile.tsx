import Well from '~/partials/Well';
import { Link } from 'react-router';

import type { Prescription, Clinician } from './types';
import useLocale from '~/hooks/useLocale';
import ProfileHeader from '~/components/ui/ProfileHeader';
import StatusChip from '~/components/ui/StatusChip';
import CopyableIdentifier from '~/components/ui/CopyableIdentifier';
import DetailGrid from '~/components/ui/DetailGrid';
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
          <DetailGrid
            fields={[
              {
                label: 'Email',
                value: attrs.email ? (
                  <CopyableIdentifier value={attrs.email} />
                ) : (
                  'N/A'
                ),
              },
              {
                label: 'Birthday',
                value: attrs.birthday
                  ? formatShortDate(attrs.birthday, locale) || attrs.birthday
                  : 'N/A',
              },
              {
                label: 'MRN',
                value: attrs.mrn ? (
                  <CopyableIdentifier value={attrs.mrn} monospace />
                ) : (
                  'N/A'
                ),
              },
              {
                label: 'Sex',
                value: attrs.sex
                  ? attrs.sex.charAt(0).toUpperCase() + attrs.sex.slice(1)
                  : 'N/A',
              },
              {
                label: 'Phone',
                value:
                  `${attrs.phoneNumber?.countryCode || ''} ${attrs.phoneNumber?.number || ''}`.trim(),
                hidden: !attrs.phoneNumber,
              },
              {
                label: 'Weight',
                value:
                  `${attrs.weight?.value || ''} ${attrs.weight?.units || ''}`.trim(),
                hidden: !attrs.weight,
              },
              {
                label: 'Year of Diagnosis',
                value: String(attrs.yearOfDiagnosis),
                hidden: !attrs.yearOfDiagnosis,
              },
            ]}
            columns={{ default: 2, md: 2 }}
          />
        </Well>

        {/* Prescriber Information */}
        <Well>
          <h2 className="text-lg font-semibold mb-3">Prescriber Information</h2>
          <DetailGrid
            fields={[
              {
                label: 'Prescriber ID',
                value: prescriberUserId ? (
                  <CopyableIdentifier value={prescriberUserId}>
                    <Link
                      to={`/clinics/${clinicId}/clinicians/${prescriberUserId}`}
                      className="text-primary hover:underline font-mono"
                    >
                      {prescriberUserId}
                    </Link>
                  </CopyableIdentifier>
                ) : (
                  'N/A'
                ),
              },
              {
                label: 'Name',
                value: prescriber?.name || 'N/A',
                hidden: !prescriber,
              },
              {
                label: 'Email',
                value: prescriber?.email ? (
                  <CopyableIdentifier value={prescriber.email} />
                ) : (
                  'N/A'
                ),
                hidden: !prescriber,
              },
            ]}
            columns={{ default: 1 }}
          />
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
              <DetailGrid
                fields={[
                  {
                    label: 'Training',
                    value:
                      attrs.training === 'inPerson' ? 'In Person' : 'In Module',
                    hidden: !attrs.training,
                  },
                  {
                    label: 'Therapy Settings',
                    value:
                      attrs.therapySettings === 'initial'
                        ? 'Initial'
                        : 'Transfer Pump Settings',
                    hidden: !attrs.therapySettings,
                  },
                  {
                    label: 'Account Type',
                    value: attrs.accountType
                      ? attrs.accountType.charAt(0).toUpperCase() +
                        attrs.accountType.slice(1)
                      : '',
                    hidden: !attrs.accountType,
                  },
                ]}
                columns={{ default: 2 }}
              />
            </Well>
          )}

          {/* Initial Settings */}
          {attrs.initialSettings && (
            <Well>
              <h2 className="text-lg font-semibold mb-3">Initial Settings</h2>
              <DetailGrid
                fields={[
                  {
                    label: 'BG Units',
                    value: attrs.initialSettings.bloodGlucoseUnits || '',
                    hidden: !attrs.initialSettings.bloodGlucoseUnits,
                  },
                  {
                    label: 'Insulin Model',
                    value:
                      attrs.initialSettings.insulinModel === 'rapidChild'
                        ? 'Rapid Child'
                        : 'Rapid Adult',
                    hidden: !attrs.initialSettings.insulinModel,
                  },
                  {
                    label: 'Pump ID',
                    value: attrs.initialSettings.pumpId || '',
                    hidden: !attrs.initialSettings.pumpId,
                  },
                  {
                    label: 'CGM ID',
                    value: attrs.initialSettings.cgmId || '',
                    hidden: !attrs.initialSettings.cgmId,
                  },
                ]}
                columns={{ default: 2 }}
              />
            </Well>
          )}
        </div>
      )}
    </div>
  );
}
