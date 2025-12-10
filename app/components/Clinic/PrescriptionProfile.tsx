import Well from '~/partials/Well';
import { intlFormat } from 'date-fns';
import { Chip } from '@heroui/react';
import { Link } from 'react-router';

import type { Prescription, PrescriptionState, Clinician } from './types';
import useLocale from '~/hooks/useLocale';
import ClipboardButton from '../ClipboardButton';

export type PrescriptionProfileProps = {
  prescription: Prescription;
  prescriber?: Clinician | null;
  clinicId: string;
};

const getStateColor = (
  state: PrescriptionState,
): 'success' | 'warning' | 'danger' | 'default' | 'primary' | 'secondary' => {
  switch (state) {
    case 'active':
      return 'success';
    case 'claimed':
      return 'success';
    case 'submitted':
      return 'primary';
    case 'pending':
      return 'warning';
    case 'draft':
      return 'default';
    case 'inactive':
      return 'secondary';
    case 'expired':
      return 'danger';
    default:
      return 'default';
  }
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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    return intlFormat(
      new Date(dateStr),
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
      { locale },
    );
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    return intlFormat(
      new Date(dateStr),
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      },
      { locale },
    );
  };

  const patientName =
    attrs.firstName && attrs.lastName
      ? `${attrs.firstName} ${attrs.lastName}`
      : attrs.firstName || attrs.lastName || 'Unknown Patient';

  const prescriptionDetails: Array<{
    label: string;
    value?: string;
    copy?: boolean;
    component?: React.ReactNode;
  }> = [
    {
      label: 'Prescription ID',
      value: id,
      copy: true,
    },
    {
      label: 'State',
      component: (
        <Chip
          color={getStateColor(state)}
          variant="flat"
          size="sm"
          className="capitalize"
        >
          {state}
        </Chip>
      ),
    },
    {
      label: 'Created',
      value: formatDateTime(createdTime) || 'N/A',
    },
    {
      label: 'Last Modified',
      value: formatDateTime(modifiedTime) || 'N/A',
    },
    {
      label: 'Expires',
      value: formatDate(expirationTime) || 'N/A',
    },
  ];

  const patientDetails: Array<{
    label: string;
    value?: string;
    copy?: boolean;
    component?: React.ReactNode;
  }> = [
    {
      label: 'Patient User ID',
      value: patientUserId || 'Not claimed',
      copy: !!patientUserId,
    },
    {
      label: 'Email',
      value: attrs.email || 'N/A',
      copy: !!attrs.email,
    },
    {
      label: 'Birthday',
      value: attrs.birthday
        ? formatDate(attrs.birthday) || attrs.birthday
        : 'N/A',
    },
    {
      label: 'MRN',
      value: attrs.mrn || 'N/A',
      copy: !!attrs.mrn,
    },
    {
      label: 'Sex',
      value: attrs.sex
        ? attrs.sex.charAt(0).toUpperCase() + attrs.sex.slice(1)
        : 'N/A',
    },
  ];

  if (attrs.phoneNumber) {
    patientDetails.push({
      label: 'Phone',
      value: `${attrs.phoneNumber.countryCode} ${attrs.phoneNumber.number}`,
    });
  }

  if (attrs.weight) {
    patientDetails.push({
      label: 'Weight',
      value: `${attrs.weight.value} ${attrs.weight.units}`,
    });
  }

  if (attrs.yearOfDiagnosis) {
    patientDetails.push({
      label: 'Year of Diagnosis',
      value: attrs.yearOfDiagnosis.toString(),
    });
  }

  const prescriberDetails: Array<{
    label: string;
    value?: string;
    copy?: boolean;
    component?: React.ReactNode;
  }> = [
    {
      label: 'Prescriber User ID',
      value: prescriberUserId || 'N/A',
      copy: !!prescriberUserId,
      component: prescriberUserId ? (
        <div className="flex items-center gap-2">
          <Link
            to={`/clinics/${clinicId}/clinicians/${prescriberUserId}`}
            className="text-primary hover:underline"
          >
            {prescriberUserId}
          </Link>
          <ClipboardButton clipboardText={prescriberUserId} />
        </div>
      ) : undefined,
    },
  ];

  if (prescriber) {
    prescriberDetails.push({
      label: 'Prescriber Name',
      value: prescriber.name || 'N/A',
    });
    prescriberDetails.push({
      label: 'Prescriber Email',
      value: prescriber.email || 'N/A',
      copy: !!prescriber.email,
    });
  }

  const therapyDetails: Array<{
    label: string;
    value?: string;
  }> = [];

  if (attrs.training) {
    therapyDetails.push({
      label: 'Training',
      value: attrs.training === 'inPerson' ? 'In Person' : 'In Module',
    });
  }

  if (attrs.therapySettings) {
    therapyDetails.push({
      label: 'Therapy Settings',
      value:
        attrs.therapySettings === 'initial'
          ? 'Initial'
          : 'Transfer Pump Settings',
    });
  }

  if (attrs.accountType) {
    therapyDetails.push({
      label: 'Account Type',
      value:
        attrs.accountType.charAt(0).toUpperCase() + attrs.accountType.slice(1),
    });
  }

  if (latestRevision?.revisionId !== undefined) {
    therapyDetails.push({
      label: 'Revision',
      value: latestRevision.revisionId.toString(),
    });
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <Well>
        <h1 className="text-xl">Prescription for {patientName}</h1>

        <div className="text-sm">
          {prescriptionDetails.map(({ label, value, copy, component }) => (
            <div
              key={label}
              className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8"
            >
              <strong>{label}:</strong>
              {component || <p>{value}</p>}
              {copy && value && !component && (
                <ClipboardButton clipboardText={value} />
              )}
            </div>
          ))}
        </div>
      </Well>

      <Well>
        <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
        <div className="text-sm">
          {patientDetails.map(({ label, value, copy, component }) => (
            <div
              key={label}
              className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8"
            >
              <strong>{label}:</strong>
              {component || <p>{value}</p>}
              {copy && value && !component && (
                <ClipboardButton clipboardText={value} />
              )}
            </div>
          ))}
        </div>
      </Well>

      <Well>
        <h2 className="text-lg font-semibold mb-4">Prescriber Information</h2>
        <div className="text-sm">
          {prescriberDetails.map(({ label, value, copy, component }) => (
            <div
              key={label}
              className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8"
            >
              <strong>{label}:</strong>
              {component || <p>{value}</p>}
              {copy && value && !component && (
                <ClipboardButton clipboardText={value} />
              )}
            </div>
          ))}
        </div>
      </Well>

      {therapyDetails.length > 0 && (
        <Well>
          <h2 className="text-lg font-semibold mb-4">Therapy Details</h2>
          <div className="text-sm">
            {therapyDetails.map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8"
              >
                <strong>{label}:</strong>
                <p>{value}</p>
              </div>
            ))}
          </div>
        </Well>
      )}

      {attrs.initialSettings && (
        <Well>
          <h2 className="text-lg font-semibold mb-4">Initial Settings</h2>
          <div className="text-sm space-y-2">
            {attrs.initialSettings.bloodGlucoseUnits && (
              <div className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8">
                <strong>Blood Glucose Units:</strong>
                <p>{attrs.initialSettings.bloodGlucoseUnits}</p>
              </div>
            )}
            {attrs.initialSettings.insulinModel && (
              <div className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8">
                <strong>Insulin Model:</strong>
                <p>
                  {attrs.initialSettings.insulinModel === 'rapidChild'
                    ? 'Rapid Child'
                    : 'Rapid Adult'}
                </p>
              </div>
            )}
            {attrs.initialSettings.pumpId && (
              <div className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8">
                <strong>Pump ID:</strong>
                <p>{attrs.initialSettings.pumpId}</p>
              </div>
            )}
            {attrs.initialSettings.cgmId && (
              <div className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8">
                <strong>CGM ID:</strong>
                <p>{attrs.initialSettings.cgmId}</p>
              </div>
            )}
          </div>
        </Well>
      )}
    </div>
  );
}
