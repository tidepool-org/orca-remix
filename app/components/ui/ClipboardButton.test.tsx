import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '~/test-utils';
import ClipboardButton from './ClipboardButton';

const mockWriteText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  mockWriteText.mockReset().mockResolvedValue(undefined);
});

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

    it('renders custom children when provided', () => {
      render(<ClipboardButton>Custom Text</ClipboardButton>);

      expect(screen.getByText('Custom Text')).toBeInTheDocument();
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

  describe('Clipboard behavior', () => {
    it('writes clipboardText to clipboard on click', async () => {
      render(<ClipboardButton clipboardText="hello-world" />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('hello-world');
      });
    });

    it('shows loading state after copy then reverts', async () => {
      render(<ClipboardButton clipboardText="test" />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });

      // Click to trigger copy — writeText resolves immediately, sets isLoading=true
      await act(async () => {
        fireEvent.click(button);
      });

      // Wait for the async copyContent to complete and state to update
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('test');
      });

      // HeroUI Button sets data-loading="true" and disables when isLoading=true
      await waitFor(() => {
        expect(button).toHaveAttribute('data-loading', 'true');
      });

      // Now switch to fake timers to control debounce
      vi.useFakeTimers();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      vi.useRealTimers();

      // After debounce, loading state should revert
      await waitFor(() => {
        expect(button).not.toHaveAttribute('data-loading', 'true');
      });
    });

    it('logs error when clipboard write fails', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard fail'));

      render(<ClipboardButton clipboardText="test" />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to copy: ',
          expect.any(Error),
        );
      });
    });

    it('does not trigger click when disabled', async () => {
      render(<ClipboardButton isDisabled clipboardText="test" />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockWriteText).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });
  });
});
