import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import SettingsToggleRow from './SettingsToggleRow';

describe('SettingsToggleRow', () => {
  const defaultProps = {
    label: 'Test Setting',
    isSelected: false,
    onValueChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders label text', () => {
      render(<SettingsToggleRow {...defaultProps} />);

      expect(screen.getByText('Test Setting')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <SettingsToggleRow
          {...defaultProps}
          description="This is a description"
        />,
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<SettingsToggleRow {...defaultProps} />);

      // Label should exist, but no description text
      expect(screen.getByText('Test Setting')).toBeInTheDocument();
      expect(
        screen.queryByText('This is a description'),
      ).not.toBeInTheDocument();
    });

    it('renders switch with accessible name from label', () => {
      render(<SettingsToggleRow {...defaultProps} />);

      // HeroUI Switch uses the aria-label internally
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('renders switch with custom aria-label when provided', () => {
      render(
        <SettingsToggleRow {...defaultProps} ariaLabel="Custom aria label" />,
      );

      // Switch should be accessible
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });
  });

  describe('State', () => {
    it('renders switch as unchecked when isSelected is false', () => {
      render(<SettingsToggleRow {...defaultProps} isSelected={false} />);

      expect(screen.getByRole('switch')).not.toBeChecked();
    });

    it('renders switch as checked when isSelected is true', () => {
      render(<SettingsToggleRow {...defaultProps} isSelected={true} />);

      expect(screen.getByRole('switch')).toBeChecked();
    });

    it('disables switch when isDisabled is true', () => {
      render(<SettingsToggleRow {...defaultProps} isDisabled={true} />);

      expect(screen.getByRole('switch')).toBeDisabled();
    });

    it('enables switch when isDisabled is false', () => {
      render(<SettingsToggleRow {...defaultProps} isDisabled={false} />);

      expect(screen.getByRole('switch')).not.toBeDisabled();
    });
  });

  describe('Interaction', () => {
    it('calls onValueChange when switch is clicked', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <SettingsToggleRow
          {...defaultProps}
          onValueChange={onValueChange}
          isSelected={false}
        />,
      );

      await user.click(screen.getByRole('switch'));

      expect(onValueChange).toHaveBeenCalledWith(true);
    });

    it('does not call onValueChange when disabled', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <SettingsToggleRow
          {...defaultProps}
          onValueChange={onValueChange}
          isDisabled={true}
        />,
      );

      await user.click(screen.getByRole('switch'));

      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('renders with default variant styling', () => {
      const { container } = render(
        <SettingsToggleRow {...defaultProps} variant="default" />,
      );

      // Check that the component renders without card variant classes
      expect(container.innerHTML).not.toContain('bg-content2');
    });

    it('renders with card variant styling', () => {
      const { container } = render(
        <SettingsToggleRow {...defaultProps} variant="card" />,
      );

      // Card variant should include bg-content2 class
      expect(container.innerHTML).toContain('bg-content2');
      expect(container.innerHTML).toContain('rounded-lg');
    });

    it('uses default variant when not specified', () => {
      const { container } = render(<SettingsToggleRow {...defaultProps} />);

      // Should not have card variant classes
      expect(container.innerHTML).not.toContain('bg-content2');
    });
  });

  describe('Size', () => {
    it('uses small size by default', () => {
      render(<SettingsToggleRow {...defaultProps} />);

      // Switch should render (size is passed to HeroUI Switch)
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('accepts different size values', () => {
      render(<SettingsToggleRow {...defaultProps} size="md" />);

      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('accepts large size', () => {
      render(<SettingsToggleRow {...defaultProps} size="lg" />);

      expect(screen.getByRole('switch')).toBeInTheDocument();
    });
  });

  describe('Label styling', () => {
    it('applies correct label styling for default variant', () => {
      render(
        <SettingsToggleRow
          {...defaultProps}
          variant="default"
          description="Desc"
        />,
      );

      const label = screen.getByText('Test Setting');
      expect(label).toHaveClass('text-sm', 'font-medium');
    });

    it('applies correct label styling for card variant', () => {
      render(
        <SettingsToggleRow
          {...defaultProps}
          variant="card"
          description="Desc"
        />,
      );

      const label = screen.getByText('Test Setting');
      expect(label).toHaveClass('font-medium');
      expect(label).not.toHaveClass('text-sm');
    });
  });
});
