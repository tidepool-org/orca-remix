import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import ToastContainer from './ToastContainer';
import { type Toast, type ToastType } from '~/contexts/ToastContext';

// Mock the ToastContext
vi.mock('~/contexts/ToastContext', async () => {
  return {
    useToast: vi.fn(),
  };
});

import { useToast } from '~/contexts/ToastContext';

const mockUseToast = vi.mocked(useToast);

describe('ToastContainer', () => {
  const mockHideToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when there are no toasts', () => {
      mockUseToast.mockReturnValue({
        toasts: [],
        showToast: vi.fn(),
        hideToast: mockHideToast,
      });

      render(<ToastContainer />);

      // No toast messages should be present
      expect(
        screen.queryByRole('button', { name: /close notification/i }),
      ).not.toBeInTheDocument();
    });

    it('renders toast messages', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'info', message: 'Test message' },
      ];
      mockUseToast.mockReturnValue({
        toasts,
        showToast: vi.fn(),
        hideToast: mockHideToast,
      });

      render(<ToastContainer />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders multiple toasts', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'info', message: 'First message' },
        { id: '2', type: 'success', message: 'Second message' },
        { id: '3', type: 'error', message: 'Third message' },
      ];
      mockUseToast.mockReturnValue({
        toasts,
        showToast: vi.fn(),
        hideToast: mockHideToast,
      });

      render(<ToastContainer />);

      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('Third message')).toBeInTheDocument();
    });

    it('renders close button for each toast', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'info', message: 'Test message' },
      ];
      mockUseToast.mockReturnValue({
        toasts,
        showToast: vi.fn(),
        hideToast: mockHideToast,
      });

      render(<ToastContainer />);

      expect(
        screen.getByRole('button', { name: /close notification/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Toast types', () => {
    it.each<[ToastType, string]>([
      ['success', 'Success message'],
      ['error', 'Error message'],
      ['warning', 'Warning message'],
      ['info', 'Info message'],
    ])('renders %s toast with message', (type, message) => {
      const toasts: Toast[] = [{ id: '1', type, message }];
      mockUseToast.mockReturnValue({
        toasts,
        showToast: vi.fn(),
        hideToast: mockHideToast,
      });

      render(<ToastContainer />);

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('renders icon for each toast type', () => {
      const types: ToastType[] = ['success', 'error', 'warning', 'info'];

      types.forEach((type) => {
        const toasts: Toast[] = [{ id: '1', type, message: 'Test' }];
        mockUseToast.mockReturnValue({
          toasts,
          showToast: vi.fn(),
          hideToast: mockHideToast,
        });

        const { container, unmount } = render(<ToastContainer />);

        // Each toast should have an icon (SVG)
        const icons = container.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(0);

        unmount();
      });
    });
  });

  describe('User Interactions', () => {
    it('calls hideToast when close button is clicked', async () => {
      const user = userEvent.setup();
      const toasts: Toast[] = [
        { id: 'toast-123', type: 'info', message: 'Test message' },
      ];
      mockUseToast.mockReturnValue({
        toasts,
        showToast: vi.fn(),
        hideToast: mockHideToast,
      });

      render(<ToastContainer />);

      await user.click(
        screen.getByRole('button', { name: /close notification/i }),
      );

      expect(mockHideToast).toHaveBeenCalledWith('toast-123');
    });

    it('calls hideToast with correct id for multiple toasts', async () => {
      const user = userEvent.setup();
      const toasts: Toast[] = [
        { id: 'toast-1', type: 'info', message: 'First' },
        { id: 'toast-2', type: 'success', message: 'Second' },
      ];
      mockUseToast.mockReturnValue({
        toasts,
        showToast: vi.fn(),
        hideToast: mockHideToast,
      });

      render(<ToastContainer />);

      const closeButtons = screen.getAllByRole('button', {
        name: /close notification/i,
      });

      // Click the second toast's close button
      await user.click(closeButtons[1]);

      expect(mockHideToast).toHaveBeenCalledWith('toast-2');
    });
  });

  describe('Accessibility', () => {
    it('close button has aria-label', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'info', message: 'Test message' },
      ];
      mockUseToast.mockReturnValue({
        toasts,
        showToast: vi.fn(),
        hideToast: mockHideToast,
      });

      render(<ToastContainer />);

      const closeButton = screen.getByRole('button', {
        name: /close notification/i,
      });
      expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
    });

    it('close button is focusable', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'info', message: 'Test message' },
      ];
      mockUseToast.mockReturnValue({
        toasts,
        showToast: vi.fn(),
        hideToast: mockHideToast,
      });

      render(<ToastContainer />);

      const closeButton = screen.getByRole('button', {
        name: /close notification/i,
      });
      closeButton.focus();
      expect(closeButton).toHaveFocus();
    });
  });
});
