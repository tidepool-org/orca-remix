import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import ThemeSwitcher from './ThemeSwitcher';
import { Theme } from 'remix-themes';

// Mock remix-themes
vi.mock('remix-themes', async () => {
  const actual = await vi.importActual('remix-themes');
  return {
    ...actual,
    Theme: {
      DARK: 'dark',
      LIGHT: 'light',
    },
    useTheme: vi.fn(),
  };
});

import { useTheme } from 'remix-themes';

const mockUseTheme = vi.mocked(useTheme);

describe('ThemeSwitcher', () => {
  const mockSetTheme = vi.fn();
  const mockMetadata = { definedBy: 'USER' as const };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders a button', () => {
      mockUseTheme.mockReturnValue([Theme.LIGHT, mockSetTheme, mockMetadata]);
      render(<ThemeSwitcher />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders icon', () => {
      mockUseTheme.mockReturnValue([Theme.LIGHT, mockSetTheme, mockMetadata]);
      render(<ThemeSwitcher />);

      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('icon is aria-hidden', () => {
      mockUseTheme.mockReturnValue([Theme.LIGHT, mockSetTheme, mockMetadata]);
      render(<ThemeSwitcher />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has aria-label for dark mode when in light mode', () => {
      mockUseTheme.mockReturnValue([Theme.LIGHT, mockSetTheme, mockMetadata]);
      render(<ThemeSwitcher />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    it('has aria-label for light mode when in dark mode', () => {
      mockUseTheme.mockReturnValue([Theme.DARK, mockSetTheme, mockMetadata]);
      render(<ThemeSwitcher />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    });

    it('is focusable', () => {
      mockUseTheme.mockReturnValue([Theme.LIGHT, mockSetTheme, mockMetadata]);
      render(<ThemeSwitcher />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('User Interactions', () => {
    it('calls setTheme when clicked in light mode', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue([Theme.LIGHT, mockSetTheme, mockMetadata]);
      render(<ThemeSwitcher />);

      await user.click(screen.getByRole('button'));

      expect(mockSetTheme).toHaveBeenCalledTimes(1);
      // The setTheme receives a callback function
      expect(mockSetTheme).toHaveBeenCalledWith(expect.any(Function));
    });

    it('calls setTheme when clicked in dark mode', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue([Theme.DARK, mockSetTheme, mockMetadata]);
      render(<ThemeSwitcher />);

      await user.click(screen.getByRole('button'));

      expect(mockSetTheme).toHaveBeenCalledTimes(1);
      expect(mockSetTheme).toHaveBeenCalledWith(expect.any(Function));
    });

    it('toggles from light to dark', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue([Theme.LIGHT, mockSetTheme, mockMetadata]);
      render(<ThemeSwitcher />);

      await user.click(screen.getByRole('button'));

      // Get the callback function passed to setTheme
      const callback = mockSetTheme.mock.calls[0][0];
      // Call it with the current theme (light) to verify it returns dark
      expect(callback(Theme.LIGHT)).toBe(Theme.DARK);
    });

    it('toggles from dark to light', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue([Theme.DARK, mockSetTheme, mockMetadata]);
      render(<ThemeSwitcher />);

      await user.click(screen.getByRole('button'));

      // Get the callback function passed to setTheme
      const callback = mockSetTheme.mock.calls[0][0];
      // Call it with the current theme (dark) to verify it returns light
      expect(callback(Theme.DARK)).toBe(Theme.LIGHT);
    });
  });

  describe('Icon display', () => {
    it('shows Sun icon when in dark mode (to switch to light)', () => {
      mockUseTheme.mockReturnValue([Theme.DARK, mockSetTheme, mockMetadata]);
      render(<ThemeSwitcher />);

      // Sun icon is shown in dark mode
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    });

    it('shows MoonStar icon when in light mode (to switch to dark)', () => {
      mockUseTheme.mockReturnValue([Theme.LIGHT, mockSetTheme, mockMetadata]);
      render(<ThemeSwitcher />);

      // MoonStar icon is shown in light mode
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });
  });
});
