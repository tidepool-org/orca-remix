import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent, within } from '~/test-utils';
import ClinicProfile from './ClinicProfile';
import type { Clinic } from './types';

// Avoid the ProfileExpandedContext (which pulls in useFetcher / a router) —
// the header's expand state is irrelevant to the Settings-tab behavior here.
vi.mock('~/hooks/useProfileExpanded', () => ({
  default: () => ({ defaultExpanded: false, onExpandedChange: vi.fn() }),
}));

const baseClinic: Clinic = {
  id: 'clinic-1',
  shareCode: 'ABCD-EFGH-IJKL',
  name: 'Test Clinic',
  createdTime: '2022-03-21T00:00:00.000Z',
  canMigrate: false,
  tier: 'tier0100',
  timezone: 'America/Los_Angeles',
  country: 'US',
};

function renderSettings(
  overrides: Partial<React.ComponentProps<typeof ClinicProfile>> = {},
) {
  const onSaveClinicSettings = vi.fn();
  const onDeleteClinic = vi.fn();
  render(
    <ClinicProfile
      clinic={baseClinic}
      selectedTab="settings"
      mrnSettings={{ required: true, unique: true }}
      patientCountSettings={null}
      onSaveClinicSettings={onSaveClinicSettings}
      onDeleteClinic={onDeleteClinic}
      {...overrides}
    />,
  );
  return { onSaveClinicSettings, onDeleteClinic };
}

describe('ClinicProfile — Settings tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dirty detection + footer', () => {
    it('disables Save Changes until a setting is changed', async () => {
      const user = userEvent.setup();
      renderSettings();

      const save = screen.getByRole('button', { name: /save changes/i });
      expect(save).toBeDisabled();

      await user.click(screen.getByRole('switch', { name: 'Require MRN' }));

      expect(save).toBeEnabled();
    });

    it('Reset reverts a staged change and re-disables Save', async () => {
      const user = userEvent.setup();
      renderSettings();

      const requireMrn = screen.getByRole('switch', { name: 'Require MRN' });
      const save = screen.getByRole('button', { name: /save changes/i });

      await user.click(requireMrn);
      expect(requireMrn).not.toBeChecked();
      expect(save).toBeEnabled();

      await user.click(screen.getByRole('button', { name: /^reset$/i }));

      expect(requireMrn).toBeChecked();
      expect(save).toBeDisabled();
    });

    it('Save dispatches one combined save carrying only the changed fields', async () => {
      const user = userEvent.setup();
      const { onSaveClinicSettings } = renderSettings();

      await user.click(screen.getByRole('switch', { name: 'Require MRN' }));
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(onSaveClinicSettings).toHaveBeenCalledOnce();
      expect(onSaveClinicSettings).toHaveBeenCalledWith('clinic-1', {
        mrnRequired: false,
        mrnUnique: true,
      });
    });
  });

  describe('Conditional states', () => {
    it('disables the Patient Limit input for a non-tier0100 clinic', () => {
      renderSettings({ clinic: { ...baseClinic, tier: 'tier0200' } });

      expect(
        screen.getByRole('spinbutton', { name: 'Maximum patients' }),
      ).toBeDisabled();
    });

    it('enables the Patient Limit input for a US-based tier0100 clinic', () => {
      renderSettings();

      expect(
        screen.getByRole('spinbutton', { name: 'Maximum patients' }),
      ).toBeEnabled();
    });

    it('disables the Patient Limit input for a non-US tier0100 clinic', () => {
      renderSettings({ clinic: { ...baseClinic, country: 'CA' } });

      expect(
        screen.getByRole('spinbutton', { name: 'Maximum patients' }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', {
          name: 'Set patient limit to default of 250',
        }),
      ).toBeDisabled();
    });

    it('Set default populates the patient limit with 250 and marks it dirty', async () => {
      const user = userEvent.setup();
      renderSettings();

      const limit = screen.getByRole('spinbutton', {
        name: 'Maximum patients',
      });
      expect(limit).toHaveValue(null);

      await user.click(
        screen.getByRole('button', {
          name: 'Set patient limit to default of 250',
        }),
      );

      expect(limit).toHaveValue(250);
      expect(
        screen.getByRole('button', { name: /save changes/i }),
      ).toBeEnabled();
    });

    it('reads a limit stored under the legacy `patientCount` field', () => {
      renderSettings({
        patientCountSettings: { hardLimit: { patientCount: 300 } },
      });

      expect(
        screen.getByRole('spinbutton', { name: 'Maximum patients' }),
      ).toHaveValue(300);
    });

    it('disables Set default when the limit is already 250', () => {
      renderSettings({
        patientCountSettings: { hardLimit: { plan: 250 } },
      });

      expect(
        screen.getByRole('button', {
          name: 'Set patient limit to default of 250',
        }),
      ).toBeDisabled();
    });

    it('renders both MRN switches and toggles them independently', async () => {
      const user = userEvent.setup();
      renderSettings();

      const requireMrn = screen.getByRole('switch', { name: 'Require MRN' });
      const uniqueMrn = screen.getByRole('switch', { name: 'Unique MRN' });

      expect(requireMrn).toBeChecked();
      expect(uniqueMrn).toBeChecked();

      await user.click(uniqueMrn);

      expect(uniqueMrn).not.toBeChecked();
      expect(requireMrn).toBeChecked();
    });
  });

  describe('Patient limit validation', () => {
    it('clearing the limit submits null to remove it', async () => {
      const user = userEvent.setup();
      const { onSaveClinicSettings } = renderSettings({
        patientCountSettings: { hardLimit: { plan: 250 } },
      });

      const limit = screen.getByRole('spinbutton', {
        name: 'Maximum patients',
      });
      expect(limit).toHaveValue(250);

      await user.clear(limit);
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(onSaveClinicSettings).toHaveBeenCalledOnce();
      expect(onSaveClinicSettings).toHaveBeenCalledWith('clinic-1', {
        hardLimitPlan: null,
      });
    });

    it('submits a valid integer limit as a number', async () => {
      const user = userEvent.setup();
      const { onSaveClinicSettings } = renderSettings();

      const limit = screen.getByRole('spinbutton', {
        name: 'Maximum patients',
      });
      await user.type(limit, '100');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(onSaveClinicSettings).toHaveBeenCalledWith('clinic-1', {
        hardLimitPlan: 100,
      });
    });

    // Exponent notation ('2e3') is also rejected by the same integer check, but
    // jsdom's number input normalizes it away, so it can't be exercised here —
    // the server action test boundary covers that malformed shape instead.
    it.each([
      ['a decimal', '2.5'],
      ['a negative number', '-5'],
    ])(
      'blocks saving %s instead of truncating or removing the limit',
      async (_label, input) => {
        const user = userEvent.setup();
        const { onSaveClinicSettings } = renderSettings();

        const limit = screen.getByRole('spinbutton', {
          name: 'Maximum patients',
        });
        await user.type(limit, input);

        // Save stays disabled and no coerced/removal payload is dispatched.
        expect(
          screen.getByRole('button', { name: /save changes/i }),
        ).toBeDisabled();
        expect(onSaveClinicSettings).not.toHaveBeenCalled();
      },
    );
  });

  describe('Danger Zone', () => {
    it('opens the Delete Clinic confirmation modal', async () => {
      const user = userEvent.setup();
      renderSettings();

      // Danger Zone is collapsed by default — expand it first.
      await user.click(screen.getByRole('button', { name: /danger zone/i }));
      await user.click(screen.getByRole('button', { name: 'Delete Clinic' }));

      // "Delete Clinic Workspace" also labels the danger-zone card, so scope
      // the assertion to the modal dialog.
      const dialog = await screen.findByRole('dialog');
      expect(
        within(dialog).getByText('Delete Clinic Workspace'),
      ).toBeInTheDocument();
    });
  });
});
