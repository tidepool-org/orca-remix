import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import SettingRow from './SettingRow';

describe('SettingRow', () => {
  describe('Rendering', () => {
    it('renders the label and description', () => {
      render(
        <SettingRow
          label="Require MRN"
          description="Require a Medical Record Number when adding patients."
        />,
      );

      expect(screen.getByText('Require MRN')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Require a Medical Record Number when adding patients.',
        ),
      ).toBeInTheDocument();
    });

    it('renders the control slot', () => {
      render(
        <SettingRow
          label="Tier"
          control={<button type="button">the control</button>}
        />,
      );

      expect(
        screen.getByRole('button', { name: 'the control' }),
      ).toBeInTheDocument();
    });
  });

  describe('Conditional States', () => {
    it('omits the description when none is provided', () => {
      render(<SettingRow label="Share Code" />);

      // Only the label paragraph should be present.
      expect(screen.getByText('Share Code')).toBeInTheDocument();
      expect(screen.getByText('Share Code').tagName).toBe('P');
    });

    it('wires the hairline divider so it shows on non-first rows and is suppressed on the first', () => {
      render(<SettingRow label="Timezone" />);
      const row = screen.getByText('Timezone').closest('.py-3') as HTMLElement;

      expect(row.className).toContain('border-t');
      expect(row.className).toContain('first:border-t-0');
    });
  });

  describe('Accessibility', () => {
    it('associates the label with a control via htmlFor when provided', () => {
      render(
        <SettingRow
          label="Timezone"
          htmlFor="tz-input"
          control={<input id="tz-input" aria-label="Timezone" />}
        />,
      );

      const label = screen.getByText('Timezone');
      expect(label.tagName).toBe('LABEL');
      expect(label).toHaveAttribute('for', 'tz-input');
    });
  });
});
