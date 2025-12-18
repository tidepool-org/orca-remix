import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import ErrorStack from './ErrorStack';

// Mock react-router's useRouteError hook
vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useRouteError: vi.fn(),
}));

import { useRouteError } from 'react-router';

const mockUseRouteError = vi.mocked(useRouteError);

describe('ErrorStack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error in tests since ErrorStack logs errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Rendering', () => {
    it('renders error name and message', () => {
      const error = new Error('Something went wrong');
      error.name = 'TestError';
      mockUseRouteError.mockReturnValue(error);

      render(<ErrorStack />);

      expect(screen.getByText('TestError')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders with default Error name', () => {
      const error = new Error('Default error');
      mockUseRouteError.mockReturnValue(error);

      render(<ErrorStack />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Default error')).toBeInTheDocument();
    });

    it('renders within an accordion', () => {
      const error = new Error('Test error');
      mockUseRouteError.mockReturnValue(error);

      render(<ErrorStack />);

      // The accordion item should be present
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible accordion button', () => {
      const error = new Error('Test error');
      mockUseRouteError.mockReturnValue(error);

      render(<ErrorStack />);

      // The accordion item should have a button that can be interacted with
      const accordionButton = screen.getByRole('button');
      expect(accordionButton).toBeInTheDocument();
      // Verify the button is part of an accordion structure
      expect(accordionButton).toHaveAttribute('aria-expanded');
    });

    it('accordion button is focusable', () => {
      const error = new Error('Test error');
      mockUseRouteError.mockReturnValue(error);

      render(<ErrorStack />);

      const accordionButton = screen.getByRole('button');
      accordionButton.focus();
      expect(accordionButton).toHaveFocus();
    });
  });

  describe('Stack trace display', () => {
    it('displays stack trace when accordion is expanded', async () => {
      const user = userEvent.setup();
      const error = new Error('Test error');
      error.stack =
        'Error: Test error\nat functionA (file.js:10:5)\nat functionB (file.js:20:10)';
      mockUseRouteError.mockReturnValue(error);

      render(<ErrorStack />);

      // Click to expand the accordion
      const accordionButton = screen.getByRole('button');
      await user.click(accordionButton);

      // Stack trace items should be visible
      expect(screen.getByText(/functionA/)).toBeInTheDocument();
      expect(screen.getByText(/functionB/)).toBeInTheDocument();
    });

    it('handles error without stack trace', () => {
      const error = new Error('No stack error');
      error.stack = undefined;
      mockUseRouteError.mockReturnValue(error);

      // Should render without crashing
      render(<ErrorStack />);

      expect(screen.getByText('No stack error')).toBeInTheDocument();
    });

    it('handles error with empty stack trace', () => {
      const error = new Error('Empty stack error');
      error.stack = '';
      mockUseRouteError.mockReturnValue(error);

      // Should render without crashing
      render(<ErrorStack />);

      expect(screen.getByText('Empty stack error')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('expands accordion on click', async () => {
      const user = userEvent.setup();
      const error = new Error('Test error');
      error.stack = 'Error: Test\nat test (test.js:1:1)';
      mockUseRouteError.mockReturnValue(error);

      render(<ErrorStack />);

      const accordionButton = screen.getByRole('button');

      // Initially collapsed - check aria-expanded
      expect(accordionButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      await user.click(accordionButton);

      // Should now be expanded
      expect(accordionButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('collapses accordion on second click', async () => {
      const user = userEvent.setup();
      const error = new Error('Test error');
      error.stack = 'Error: Test\nat test (test.js:1:1)';
      mockUseRouteError.mockReturnValue(error);

      render(<ErrorStack />);

      const accordionButton = screen.getByRole('button');

      // Click to expand
      await user.click(accordionButton);
      expect(accordionButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      await user.click(accordionButton);
      expect(accordionButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Error logging', () => {
    it('logs error to console', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Logged error');
      mockUseRouteError.mockReturnValue(error);

      render(<ErrorStack />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('Different error types', () => {
    it('handles TypeError', () => {
      const error = new TypeError('Cannot read property of undefined');
      mockUseRouteError.mockReturnValue(error);

      render(<ErrorStack />);

      expect(screen.getByText('TypeError')).toBeInTheDocument();
      expect(
        screen.getByText('Cannot read property of undefined'),
      ).toBeInTheDocument();
    });

    it('handles ReferenceError', () => {
      const error = new ReferenceError('variable is not defined');
      mockUseRouteError.mockReturnValue(error);

      render(<ErrorStack />);

      expect(screen.getByText('ReferenceError')).toBeInTheDocument();
      expect(screen.getByText('variable is not defined')).toBeInTheDocument();
    });

    it('handles custom error with custom name', () => {
      const error = new Error('Custom message');
      error.name = 'CustomAPIError';
      mockUseRouteError.mockReturnValue(error);

      render(<ErrorStack />);

      expect(screen.getByText('CustomAPIError')).toBeInTheDocument();
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });
  });
});
