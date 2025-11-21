import { useRouteLoaderData } from '@remix-run/react';
import { useCallback } from 'react';
import Well from '~/partials/Well';
import { intlFormat } from 'date-fns';

import type { Patient } from './types';
import useLocale from '~/hooks/useLocale';
import ClipboardButton from '../ClipboardButton';

export type PatientProfileProps = {
  patient: Patient;
  clinic?: {
    patientTags?: {
      id: string;
      name: string;
    }[];
  };
};

export default function PatientProfile({ patient, clinic }: PatientProfileProps) {
  const { id, fullName, email, birthDate, mrn, createdTime, updatedTime, tags, permissions } = patient;
  const { locale } = useLocale();

  // Try to get clinic data from parent route if not provided as prop
  const parentRouteData = useRouteLoaderData('routes/clinics.$clinicId') as { clinic?: { patientTags?: { id: string; name: string; }[]; } } | undefined;
  const clinicData = clinic || parentRouteData?.clinic;

  // Helper function to map tag ID to tag name
  const getTagName = useCallback((tagId: string): string => {
    const tag = clinicData?.patientTags?.find(t => t.id === tagId);
    return tag?.name || tagId; // Fallback to ID if name not found
  }, [clinicData?.patientTags]);

  const patientDetails = [
    {
      label: 'Email',
      value: email,
      copy: true,
    },
    {
      label: 'Patient ID',
      value: id,
      copy: true,
    },
    {
      label: 'MRN',
      value: mrn || '—',
      copy: !!mrn,
    },
    {
      label: 'Birth Date',
      value: birthDate
        ? intlFormat(
            new Date(birthDate),
            { year: 'numeric', month: 'long', day: 'numeric' },
            { locale }
          )
        : '—',
      copy: false,
    },
    {
      label: 'Added',
      value: intlFormat(
        new Date(createdTime),
        { year: 'numeric', month: 'long', day: 'numeric' },
        { locale }
      ),
      copy: false,
    },
    {
      label: 'Last Updated',
      value: intlFormat(
        new Date(updatedTime),
        { year: 'numeric', month: 'long', day: 'numeric' },
        { locale }
      ),
      copy: false,
    },
  ];

  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:gap-8">
      <Well>
        <div className="flex flex-col gap-4">
          <div className="border-b border-content2 pb-4">
            <h1 className="text-2xl font-bold text-content1-foreground">
              {fullName}
            </h1>
            <p className="text-content2-foreground">Patient Profile</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patientDetails.map(({ label, value, copy }) => (
              <div key={label} className="flex flex-col gap-1">
                <p className="text-sm font-medium text-content2-foreground">
                  {label}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-content1-foreground font-mono text-sm">
                    {value}
                  </p>
                  {copy && <ClipboardButton clipboardText={value} />}
                </div>
              </div>
            ))}
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-content2-foreground">
                Tags
              </p>
              <div className="flex gap-2 flex-wrap">
                {tags.map((tagId, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                  >
                    {getTagName(tagId)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {permissions && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-content2-foreground">
                Permissions
              </p>
              <div className="flex gap-2 flex-wrap">
                {permissions.view && (
                  <span className="px-2 py-1 bg-success/10 text-success rounded-md text-xs">
                    View
                  </span>
                )}
                {permissions.upload && (
                  <span className="px-2 py-1 bg-warning/10 text-warning rounded-md text-xs">
                    Upload
                  </span>
                )}
                {permissions.note && (
                  <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-md text-xs">
                    Note
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Well>
    </div>
  );
}
