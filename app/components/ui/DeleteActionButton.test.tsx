import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import DeleteActionButton from './DeleteActionButton';
import { X } from 'lucide-react';

describe('DeleteActionButton', () => {
  const defaultProps = {
    tooltip: 'Delete item',
    ariaLabel: 'Delete item',
    onPress: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders a button with the default Trash2 icon', () => {
      render(<DeleteActionButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /delete item/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with the correct aria-label', () => {
      render(
        <DeleteActionButton {...defaultProps} ariaLabel="Remove clinician" />,
      );

      const button = screen.getByRole('button', { name: /remove clinician/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with a custom icon', () => {
      render(<DeleteActionButton {...defaultProps} icon={X} />);

      const button = screen.getByRole('button', { name: /delete item/i });
      expect(button).toBeInTheDocument();
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onPress when clicked', async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      render(<DeleteActionButton {...defaultProps} onPress={onPress} />);

      const button = screen.getByRole('button', { name: /delete item/i });
      await user.click(button);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      render(
        <DeleteActionButton {...defaultProps} onPress={onPress} isDisabled />,
      );

      const button = screen.getByRole('button', { name: /delete item/i });
      await user.click(button);

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('is disabled when isDisabled is true', () => {
      render(<DeleteActionButton {...defaultProps} isDisabled />);

      const button = screen.getByRole('button', { name: /delete item/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label', () => {
      render(
        <DeleteActionButton {...defaultProps} ariaLabel="Revoke invitation" />,
      );

      const button = screen.getByRole('button', { name: /revoke invitation/i });
      expect(button).toHaveAttribute('aria-label', 'Revoke invitation');
    });

    it('icon has aria-hidden attribute', () => {
      render(<DeleteActionButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /delete item/i });
      const svg = button.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
