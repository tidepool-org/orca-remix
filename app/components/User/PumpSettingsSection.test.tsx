import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '~/test-utils';
import PumpSettingsSection from './PumpSettingsSection';
import type { PumpSettings } from './types';

// The compare toggle reads a cookie-backed context in the app; in isolation,
// back it with local state so the on/off interactions still exercise.
vi.mock('~/contexts/PumpSettingsCompareContext', async () => {
  const react = await import('react');
  return {
    usePumpSettingsCompare: () => {
      const [compareToPrevious, setCompareToPrevious] = react.useState(true);
      return { compareToPrevious, setCompareToPrevious };
    },
  };
});

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

  // Multi-device fixture: device A (Insulet, active, 3 versions) + device B
  // (Tandem, inactive, single version).
  const deviceA_v0: PumpSettings = {
    id: 'a0',
    type: 'pumpSettings',
    time: '2026-03-01T00:00:00Z',
    deviceId: 'A',
    serialNumber: 'SN-A',
    manufacturers: ['Insulet'],
    model: 'Omnipod 5',
    activeSchedule: 'Weekday',
    basalSchedules: { Weekday: [{ start: 0, rate: 0.85 }] },
  };
  const deviceA_v1: PumpSettings = {
    id: 'a1',
    type: 'pumpSettings',
    time: '2026-01-01T00:00:00Z',
    deviceId: 'A',
    serialNumber: 'SN-A',
    manufacturers: ['Insulet'],
    model: 'Omnipod 5',
    activeSchedule: 'Weekday',
    // rate change at 0 vs v0, plus an extra entry at 720 that is gone in v0.
    basalSchedules: {
      Weekday: [
        { start: 0, rate: 0.8 },
        { start: 720, rate: 1.0 },
      ],
    },
  };
  const deviceA_v2: PumpSettings = {
    id: 'a2',
    type: 'pumpSettings',
    time: '2025-11-01T00:00:00Z',
    deviceId: 'A',
    serialNumber: 'SN-A',
    manufacturers: ['Insulet'],
    model: 'Omnipod 5',
    activeSchedule: 'Weekday',
    basalSchedules: { Weekday: [{ start: 0, rate: 0.7 }] },
  };
  const deviceB_v0: PumpSettings = {
    id: 'b0',
    type: 'pumpSettings',
    time: '2026-02-01T00:00:00Z',
    deviceId: 'B',
    serialNumber: 'SN-B',
    manufacturers: ['Tandem'],
    model: 't:slim X2',
    activeSchedule: 'Standard',
    basalSchedules: { Standard: [{ start: 0, rate: 0.75 }] },
  };
  const multiDevice = [deviceA_v0, deviceA_v1, deviceB_v0, deviceA_v2];

  describe('Rendering (multi-device)', () => {
    it('defaults to the active device and its newest version, comparing to the previous', () => {
      render(<PumpSettingsSection pumpSettings={multiDevice} />);

      // Active device A drives the meta strip (manufacturer shown verbatim).
      expect(screen.getByText('Insulet')).toBeInTheDocument();
      expect(screen.getByText('Active device')).toBeInTheDocument();

      // Compare is on by default and a previous version exists.
      expect(screen.getByText(/Changes from/)).toBeInTheDocument();
    });

    it('renders a removed schedule row with a Removed tag', () => {
      render(<PumpSettingsSection pumpSettings={multiDevice} />);

      // The 720-min entry exists only in the previous version.
      expect(screen.getByText('Removed')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('switches devices: selecting device B updates the meta strip and disables Compare', async () => {
      const user = userEvent.setup();
      render(<PumpSettingsSection pumpSettings={multiDevice} />);

      await user.click(screen.getByRole('button', { name: 'Select device' }));
      const option = await screen.findByRole('menuitemradio', {
        name: /t:slim X2/,
      });
      await user.click(option);

      await waitFor(() => {
        expect(screen.getByText('Tandem')).toBeInTheDocument();
      });
      // Single-version device ⇒ earliest, Compare disabled + message.
      expect(
        screen.getByText(/Earliest recorded settings/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('switch', { name: 'Compare to previous' }),
      ).toBeDisabled();
    });

    it('switches versions: selecting the earliest version shows the earliest message', async () => {
      const user = userEvent.setup();
      render(<PumpSettingsSection pumpSettings={multiDevice} />);

      await user.click(
        screen.getByRole('button', { name: 'View settings from' }),
      );
      const items = await screen.findAllByRole('menuitemradio');
      // Oldest version is the last item.
      await user.click(items[items.length - 1]);

      await waitFor(() => {
        expect(
          screen.getByText(/Earliest recorded settings/),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Conditional States', () => {
    it('turning Compare off removes the change summary', async () => {
      const user = userEvent.setup();
      render(<PumpSettingsSection pumpSettings={multiDevice} />);

      expect(screen.getByText(/Changes from/)).toBeInTheDocument();

      await user.click(
        screen.getByRole('switch', { name: 'Compare to previous' }),
      );

      await waitFor(() => {
        expect(screen.queryByText(/Changes from/)).not.toBeInTheDocument();
      });
      // Plain rows: the removed-only row no longer appears.
      expect(screen.queryByText('Removed')).not.toBeInTheDocument();
    });

    it('a single-version device disables Compare and shows the earliest message', () => {
      render(<PumpSettingsSection pumpSettings={[deviceB_v0]} />);

      expect(
        screen.getByText(/Earliest recorded settings/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('switch', { name: 'Compare to previous' }),
      ).toBeDisabled();
    });
  });

  describe('BG target columns', () => {
    it('shows only the BG-target columns present for the device', async () => {
      const user = userEvent.setup();
      // Omnipod-style entry: target + high (no low, no range).
      const omnipod: PumpSettings = {
        id: 'op',
        type: 'pumpSettings',
        time: '2026-04-01T00:00:00Z',
        deviceId: 'OP',
        manufacturers: ['Insulet'],
        model: 'Omnipod 5',
        activeSchedule: 'Default',
        bgTarget: [{ start: 0, target: 110, high: 120 }],
      };
      render(<PumpSettingsSection pumpSettings={[omnipod]} />);

      await user.click(screen.getByRole('tab', { name: /BG Targets/ }));

      expect(
        await screen.findByRole('columnheader', { name: 'Target' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'High' }),
      ).toBeInTheDocument();
      // Fields the device does not use are trimmed.
      expect(
        screen.queryByRole('columnheader', { name: 'Low' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('columnheader', { name: 'Range' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('exposes accessible names for both dropdowns and the toggles', () => {
      render(<PumpSettingsSection pumpSettings={multiDevice} />);

      expect(
        screen.getByRole('button', { name: 'Select device' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'View settings from' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('switch', { name: 'Compare to previous' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('switch', { name: 'Toggle BG units' }),
      ).toBeInTheDocument();
    });
  });
});
