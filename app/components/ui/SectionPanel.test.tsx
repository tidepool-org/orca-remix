import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '~/test-utils';
import { Settings } from 'lucide-react';
import SectionPanel from './SectionPanel';

describe('SectionPanel', () => {
  describe('Basic Rendering', () => {
    it('renders with title and icon', () => {
      render(
        <SectionPanel
          icon={<Settings data-testid="icon" />}
          title="Test Section"
        >
          <p>Content</p>
        </SectionPanel>,
      );

      expect(screen.getByText('Test Section')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      render(
        <SectionPanel
          icon={<Settings />}
          title="Test Section"
          subtitle="This is a description"
        >
          <p>Content</p>
        </SectionPanel>,
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('does not render subtitle when not provided', () => {
      render(
        <SectionPanel icon={<Settings />} title="Test Section">
          <p>Content</p>
        </SectionPanel>,
      );

      expect(
        screen.queryByText('This is a description'),
      ).not.toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <SectionPanel icon={<Settings />} title="Test Section">
          <div data-testid="child-content">
            <p>Child paragraph</p>
            <button>Child button</button>
          </div>
        </SectionPanel>,
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Child paragraph')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Child button' }),
      ).toBeInTheDocument();
    });

    it('renders without icon when icon prop is not provided', () => {
      render(
        <SectionPanel title="Test Section">
          <p>Content</p>
        </SectionPanel>,
      );

      expect(screen.getByText('Test Section')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders title and subtitle without icon', () => {
      render(
        <SectionPanel title="Settings Panel" subtitle="Configure your settings">
          <p>Settings content</p>
        </SectionPanel>,
      );

      expect(screen.getByText('Settings Panel')).toBeInTheDocument();
      expect(screen.getByText('Configure your settings')).toBeInTheDocument();
      expect(screen.getByText('Settings content')).toBeInTheDocument();
    });
  });

  describe('Header Controls', () => {
    it('renders header controls when provided', () => {
      render(
        <SectionPanel
          icon={<Settings />}
          title="Test Section"
          headerControls={<button>Toggle</button>}
        >
          <p>Content</p>
        </SectionPanel>,
      );

      expect(
        screen.getByRole('button', { name: 'Toggle' }),
      ).toBeInTheDocument();
    });
  });

  describe('Non-Collapsible Mode (default)', () => {
    it('does not render toggle button by default', () => {
      render(
        <SectionPanel icon={<Settings />} title="Test Section">
          <p>Content</p>
        </SectionPanel>,
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('always shows content in non-collapsible mode', () => {
      render(
        <SectionPanel icon={<Settings />} title="Test Section">
          <p>Always visible content</p>
        </SectionPanel>,
      );

      expect(screen.getByText('Always visible content')).toBeInTheDocument();
    });
  });

  describe('Collapsible Mode', () => {
    it('renders as button when collapsible', () => {
      render(
        <SectionPanel icon={<Settings />} title="Test Section" collapsible>
          <p>Content</p>
        </SectionPanel>,
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows content by default when collapsible and defaultExpanded is true', () => {
      render(
        <SectionPanel
          icon={<Settings />}
          title="Test Section"
          collapsible
          defaultExpanded={true}
        >
          <p>Visible content</p>
        </SectionPanel>,
      );

      expect(screen.getByText('Visible content')).toBeInTheDocument();
    });

    it('hides content by default when collapsible and defaultExpanded is false', () => {
      render(
        <SectionPanel
          icon={<Settings />}
          title="Test Section"
          collapsible
          defaultExpanded={false}
        >
          <p>Hidden content</p>
        </SectionPanel>,
      );

      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });

    it('toggles content visibility when header is clicked', async () => {
      const user = userEvent.setup();
      render(
        <SectionPanel
          icon={<Settings />}
          title="Test Section"
          collapsible
          defaultExpanded={false}
        >
          <p>Toggle content</p>
        </SectionPanel>,
      );

      // Content should be hidden initially
      expect(screen.queryByText('Toggle content')).not.toBeInTheDocument();

      // Click to expand
      await user.click(screen.getByRole('button'));
      expect(screen.getByText('Toggle content')).toBeInTheDocument();

      // Click to collapse
      await user.click(screen.getByRole('button'));
      expect(screen.queryByText('Toggle content')).not.toBeInTheDocument();
    });

    it('calls onToggle callback when header is clicked', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();

      render(
        <SectionPanel
          icon={<Settings />}
          title="Test Section"
          collapsible
          onToggle={onToggle}
        >
          <p>Content</p>
        </SectionPanel>,
      );

      await user.click(screen.getByRole('button'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('respects controlled isExpanded prop', () => {
      const { rerender } = render(
        <SectionPanel
          icon={<Settings />}
          title="Test Section"
          collapsible
          isExpanded={false}
        >
          <p>Controlled content</p>
        </SectionPanel>,
      );

      expect(screen.queryByText('Controlled content')).not.toBeInTheDocument();

      rerender(
        <SectionPanel
          icon={<Settings />}
          title="Test Section"
          collapsible
          isExpanded={true}
        >
          <p>Controlled content</p>
        </SectionPanel>,
      );

      expect(screen.getByText('Controlled content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('sets aria-label when provided', () => {
      render(
        <SectionPanel
          icon={<Settings />}
          title="Test Section"
          aria-label="Test section panel"
        >
          <p>Content</p>
        </SectionPanel>,
      );

      expect(screen.getByLabelText('Test section panel')).toBeInTheDocument();
    });

    it('sets aria-expanded on collapsible header button', () => {
      render(
        <SectionPanel
          icon={<Settings />}
          title="Test Section"
          collapsible
          defaultExpanded={true}
        >
          <p>Content</p>
        </SectionPanel>,
      );

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('sets aria-controls on collapsible header button', () => {
      render(
        <SectionPanel
          icon={<Settings />}
          title="Test Section"
          collapsible
          defaultExpanded={true}
        >
          <p>Content</p>
        </SectionPanel>,
      );

      const button = screen.getByRole('button');
      const controlsId = button.getAttribute('aria-controls');
      expect(controlsId).toBe('test-section-panel-content');
    });

    it('content panel has matching id for aria-controls', () => {
      render(
        <SectionPanel
          icon={<Settings />}
          title="Test Section"
          collapsible
          defaultExpanded={true}
        >
          <p>Content</p>
        </SectionPanel>,
      );

      const button = screen.getByRole('button');
      const controlsId = button.getAttribute('aria-controls');
      expect(document.getElementById(controlsId!)).toBeInTheDocument();
    });
  });
});
