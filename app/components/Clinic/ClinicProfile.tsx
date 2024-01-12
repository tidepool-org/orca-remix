import Well from '~/partials/Well';
import { intlFormat } from 'date-fns';

import type { Clinic } from './types';
import useLocale from '~/hooks/useLocale';
import ClipboardButton from '../ClipboardButton';

export type ClinicProfileProps = {
  clinic: Clinic;
};

export default function ClinicProfile({ clinic }: ClinicProfileProps) {
  const { id, shareCode, name, createdTime, canMigrate, tier } = clinic;
  const { locale } = useLocale();

  const clinicDetails = [
    {
      label: 'Share Code',
      value: shareCode,
      copy: true,
    },
    {
      label: 'Clinic ID',
      value: id,
      copy: true,
    },
    { label: 'Clinic Tier', value: tier },
    { label: 'Can Migrate', value: canMigrate.toString() },
    {
      label: 'Created On',
      value: intlFormat(
        new Date(createdTime),
        {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        },
        { locale },
      ),
    },
  ];
  return (
    <Well>
      <p className="text-xl">{name}</p>

      <div className="text-small">
        {clinicDetails.map(({ label, value, copy }, i) => (
          <div key={i} className="flex justify-start flex-nowrap gap-3">
            <strong>{label}:</strong>
            <p>{value}</p>
            {copy && <ClipboardButton clipboardText={value} />}
          </div>
        ))}
      </div>
    </Well>
  );
}
