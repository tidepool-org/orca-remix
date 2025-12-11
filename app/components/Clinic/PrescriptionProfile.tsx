import { useState } from 'react';
import Well from '~/partials/Well';
import { intlFormat } from 'date-fns';
import { Chip } from '@heroui/react';
import { Link } from 'react-router';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
        month: 'short',
        day: 'numeric',
      },
      { locale },
    );
  };

  const patientName =
    attrs.firstName && attrs.lastName
      ? `${attrs.firstName} ${attrs.lastName}`
      : attrs.firstName || attrs.lastName || 'Unknown Patient';

  // Collapsible details state
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Prescription Header - Collapsible layout */}
      <Well className="!gap-0">
        {/* Row 1: Title with state chip on left, toggle button on right */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">
              Prescription for {patientName}
            </h1>
            <Chip
              color={getStateColor(state)}
              variant="flat"
              size="sm"
              className="capitalize"
            >
              {state}
            </Chip>
          </div>
          <button
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary-600 transition-colors"
            aria-expanded={isDetailsExpanded}
            aria-label={isDetailsExpanded ? 'Hide details' : 'Show details'}
          >
            <span>{isDetailsExpanded ? 'Hide Details' : 'Show Details'}</span>
            {isDetailsExpanded ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Row 2: Copyable identifiers */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-1">
          <span className="flex items-center gap-1 text-default-500">
            <span className="text-default-400">ID:</span>
            <span className="font-mono text-xs">{id}</span>
            <ClipboardButton clipboardText={id} />
          </span>
          {patientUserId && (
            <span className="flex items-center gap-1 text-default-500">
              <span className="text-default-400">Patient:</span>
              <span className="font-mono text-xs">{patientUserId}</span>
              <ClipboardButton clipboardText={patientUserId} />
            </span>
          )}
        </div>

        {/* Collapsible details section */}
        {isDetailsExpanded && (
          <div className="mt-4 pt-4 border-t border-divider">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
              <div>
                <span className="text-default-400 block text-xs">Created</span>
                <span className="text-default-600">
                  {formatDate(createdTime) || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-default-400 block text-xs">Modified</span>
                <span className="text-default-600">
                  {formatDate(modifiedTime) || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-default-400 block text-xs">Expires</span>
                <span className="text-default-600">
                  {formatDate(expirationTime) || 'N/A'}
                </span>
              </div>
              {latestRevision?.revisionId !== undefined && (
                <div>
                  <span className="text-default-400 block text-xs">
                    Revision
                  </span>
                  <span className="text-default-600">
                    {latestRevision.revisionId}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </Well>

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
                  ? formatDate(attrs.birthday) || attrs.birthday
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
