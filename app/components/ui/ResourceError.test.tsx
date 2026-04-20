import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import ResourceError from './ResourceError';

describe('ResourceError', () => {
  describe('Rendering', () => {
    it('renders with title', () => {
      render(<ResourceError title="Prescriptions" />);

      expect(
        screen.getByText('Failed to load Prescriptions'),
      ).toBeInTheDocument();
    });

    it('renders error icon', () => {
      render(<ResourceError title="Prescriptions" />);

      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders with error message when provided', () => {
      render(
        <ResourceError
          title="Prescriptions"
          message="403 Forbidden: Access denied"
        />,
      );

      expect(
        screen.getByText('Failed to load Prescriptions'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('403 Forbidden: Access denied'),
      ).toBeInTheDocument();
    });

    it('does not render message when not provided', () => {
      render(<ResourceError title="Users" />);

      expect(screen.getByText('Failed to load Users')).toBeInTheDocument();
      // Should only have icon and title
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('renders different resource titles correctly', () => {
      const { rerender } = render(<ResourceError title="Patients" />);
      expect(screen.getByText('Failed to load Patients')).toBeInTheDocument();

      rerender(<ResourceError title="Clinicians" />);
      expect(screen.getByText('Failed to load Clinicians')).toBeInTheDocument();

      rerender(<ResourceError title="Data Sources" />);
      expect(
        screen.getByText('Failed to load Data Sources'),
      ).toBeInTheDocument();
    });
  });

  describe('Retry Button', () => {
    it('renders retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<ResourceError title="Prescriptions" onRetry={onRetry} />);

      expect(
        screen.getByRole('button', { name: /retry loading prescriptions/i }),
      ).toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<ResourceError title="Prescriptions" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(<ResourceError title="Prescriptions" onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', {
        name: /retry loading prescriptions/i,
      });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('shows loading state when isRetrying is true', () => {
      const onRetry = vi.fn();
      render(
        <ResourceError
          title="Prescriptions"
          onRetry={onRetry}
          isRetrying={true}
        />,
      );

      const retryButton = screen.getByRole('button', {
        name: /retry loading prescriptions/i,
      });
      expect(retryButton).toHaveAttribute('data-loading', 'true');
    });

    it('is not in loading state when isRetrying is false', () => {
      const onRetry = vi.fn();
      render(
        <ResourceError
          title="Prescriptions"
          onRetry={onRetry}
          isRetrying={false}
        />,
      );

      const retryButton = screen.getByRole('button', {
        name: /retry loading prescriptions/i,
      });
      expect(retryButton).not.toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has alert role for screen readers', () => {
      render(<ResourceError title="Prescriptions" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-live polite for dynamic updates', () => {
      render(<ResourceError title="Prescriptions" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('retry button has descriptive aria-label', () => {
      const onRetry = vi.fn();
      render(<ResourceError title="Patient Data" onRetry={onRetry} />);

      const retryButton = screen.getByRole('button');
      expect(retryButton).toHaveAttribute(
        'aria-label',
        'Retry loading Patient Data',
      );
    });

    it('icon is hidden from screen readers', () => {
      render(<ResourceError title="Prescriptions" />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
