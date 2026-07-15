import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import PumpSettingsSection from './PumpSettingsSection';
import type { PumpSettings } from './types';

describe('PumpSettingsSection', () => {
  const baseSettings: PumpSettings = {
    id: 'ps-1',
    type: 'pumpSettings',
    time: '2024-03-01T14:30:00Z',
    serialNumber: 'SN-9',
    manufacturers: ['Tandem'],
    model: '982',
  };

  describe('Friendly device names', () => {
    it('renders the manufacturer verbatim and the friendly model name', () => {
      render(
        <PumpSettingsSection
          pumpSettings={[{ ...baseSettings, name: 'ReliOn Platinum' }]}
        />,
      );

      // Manufacturer is shown as-is (not remapped to a product brand).
      expect(screen.getByText('Tandem')).toBeInTheDocument();
      // Friendly platform name wins for the Model field.
      expect(screen.getByText('ReliOn Platinum')).toBeInTheDocument();
    });

    it('derives a manufacturer + model label for the Model when no name is present', () => {
      render(<PumpSettingsSection pumpSettings={[baseSettings]} />);

      expect(screen.getByText('Tandem')).toBeInTheDocument();
      expect(screen.getByText('Tandem 982')).toBeInTheDocument();
    });

    it('labels the manufacturer from the app service for Loop devices', () => {
      render(
        <PumpSettingsSection
          pumpSettings={[
            {
              ...baseSettings,
              manufacturers: ['Tidepool'],
              model: 'Insulin Delivery Pump',
              origin: { name: 'org.tidepool.Loop' },
            },
          ]}
        />,
      );

      // Manufacturer surfaces the service, not the raw "Tidepool".
      expect(screen.getByText('Tidepool Loop')).toBeInTheDocument();
    });
  });
});
