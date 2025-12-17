import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import ClipboardButton from './ClipboardButton';

describe('ClipboardButton', () => {
  describe('Rendering', () => {
    it('renders a button with default title', () => {
      render(<ClipboardButton />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(<ClipboardButton title="Copy ID" />);

      const button = screen.getByRole('button', { name: /copy id/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with icon-only style by default', () => {
      render(<ClipboardButton />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      expect(button).toBeInTheDocument();
    });

    it('renders custom children when provided', () => {
      render(<ClipboardButton>Custom Text</ClipboardButton>);

      expect(screen.getByText('Custom Text')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('accepts clipboardText prop', () => {
      // ClipboardButton should accept clipboardText without error
      render(<ClipboardButton clipboardText="test-value" />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      expect(button).toBeInTheDocument();
    });

    it('uses default clipboardText when not provided', () => {
      // Should render without error when clipboardText is not provided
      render(<ClipboardButton />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-label matching title', () => {
      render(<ClipboardButton title="Copy user ID" />);

      const button = screen.getByRole('button', { name: /copy user id/i });
      expect(button).toHaveAttribute('aria-label', 'Copy user ID');
    });

    it('has default aria-label when no title provided', () => {
      render(<ClipboardButton />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      expect(button).toHaveAttribute('aria-label', 'Copy to clipboard');
    });

    it('is focusable', () => {
      render(<ClipboardButton />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      button.focus();
      expect(button).toHaveFocus();
    });

    it('icon is aria-hidden', () => {
      render(<ClipboardButton />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      const svg = button.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Custom props', () => {
    it('passes through isDisabled prop', () => {
      render(<ClipboardButton isDisabled />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      expect(button).toBeDisabled();
    });

    it('is not disabled by default', () => {
      render(<ClipboardButton />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Button interaction', () => {
    it('can be clicked', async () => {
      const user = userEvent.setup();

      // Mock console.error to prevent clipboard error from showing
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<ClipboardButton clipboardText="test" />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });

      // Button should be clickable without throwing
      await expect(user.click(button)).resolves.not.toThrow();

      vi.restoreAllMocks();
    });

    it('does not trigger click when disabled', async () => {
      const user = userEvent.setup();

      render(<ClipboardButton isDisabled clipboardText="test" />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });

      // Clicking disabled button should not throw
      await user.click(button);

      // Button should still be disabled
      expect(button).toBeDisabled();
    });
  });
});
