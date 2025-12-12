import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import { Tab } from '@heroui/react';
import ProfileTabs from './ProfileTabs';

describe('ProfileTabs', () => {
  describe('Rendering', () => {
    it('renders tabs with correct aria-label', () => {
      render(
        <ProfileTabs aria-label="Test profile sections">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
        </ProfileTabs>,
      );

      const tablist = screen.getByRole('tablist', {
        name: /test profile sections/i,
      });
      expect(tablist).toBeInTheDocument();
    });

    it('renders all tab titles', () => {
      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="patients" title="Patients">
            Patients content
          </Tab>
          <Tab key="clinicians" title="Clinicians">
            Clinicians content
          </Tab>
          <Tab key="settings" title="Settings">
            Settings content
          </Tab>
        </ProfileTabs>,
      );

      expect(
        screen.getByRole('tab', { name: /patients/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /clinicians/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /settings/i }),
      ).toBeInTheDocument();
    });

    it('renders first tab content by default', () => {
      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="first" title="First">
            First content
          </Tab>
          <Tab key="second" title="Second">
            Second content
          </Tab>
        </ProfileTabs>,
      );

      expect(screen.getByText('First content')).toBeInTheDocument();
    });

    it('renders with additional className', () => {
      render(
        <ProfileTabs aria-label="Profile tabs" className="custom-class">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </ProfileTabs>,
      );

      // The custom class should be applied to the tabs wrapper
      const tabsElement = screen.getByRole('tablist').parentElement;
      expect(tabsElement).toHaveClass('custom-class');
    });
  });

  describe('Default Selected Key', () => {
    it('selects first tab by default when no defaultSelectedKey', () => {
      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="first" title="First">
            First content
          </Tab>
          <Tab key="second" title="Second">
            Second content
          </Tab>
        </ProfileTabs>,
      );

      const firstTab = screen.getByRole('tab', { name: /first/i });
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
    });

    it('selects specified tab when defaultSelectedKey is provided', () => {
      render(
        <ProfileTabs aria-label="Profile tabs" defaultSelectedKey="second">
          <Tab key="first" title="First">
            First content
          </Tab>
          <Tab key="second" title="Second">
            Second content
          </Tab>
        </ProfileTabs>,
      );

      const secondTab = screen.getByRole('tab', { name: /second/i });
      expect(secondTab).toHaveAttribute('aria-selected', 'true');
    });

    it('shows content for default selected tab', () => {
      render(
        <ProfileTabs aria-label="Profile tabs" defaultSelectedKey="second">
          <Tab key="first" title="First">
            First content
          </Tab>
          <Tab key="second" title="Second">
            Second content
          </Tab>
        </ProfileTabs>,
      );

      expect(screen.getByText('Second content')).toBeInTheDocument();
    });
  });

  describe('Tab Interactions', () => {
    it('switches to clicked tab', async () => {
      const user = userEvent.setup();

      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="first" title="First">
            First content
          </Tab>
          <Tab key="second" title="Second">
            Second content
          </Tab>
        </ProfileTabs>,
      );

      const secondTab = screen.getByRole('tab', { name: /second/i });
      await user.click(secondTab);

      expect(secondTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Second content')).toBeInTheDocument();
    });

    it('supports keyboard navigation between tabs', async () => {
      const user = userEvent.setup();

      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="first" title="First">
            First content
          </Tab>
          <Tab key="second" title="Second">
            Second content
          </Tab>
          <Tab key="third" title="Third">
            Third content
          </Tab>
        </ProfileTabs>,
      );

      const firstTab = screen.getByRole('tab', { name: /first/i });

      // Focus the first tab
      await user.click(firstTab);

      // Navigate with arrow key
      await user.keyboard('{ArrowRight}');

      const secondTab = screen.getByRole('tab', { name: /second/i });
      expect(secondTab).toHaveFocus();
    });
  });

  describe('Styling', () => {
    it('applies underlined variant styling', () => {
      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </ProfileTabs>,
      );

      const tablist = screen.getByRole('tablist');
      // Check for the underlined variant styling classes
      expect(tablist).toHaveClass('border-b');
      expect(tablist).toHaveClass('border-divider');
    });

    it('applies consistent tab styling', () => {
      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </ProfileTabs>,
      );

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveClass('gap-4');
      expect(tablist).toHaveClass('w-full');
    });
  });

  describe('Accessibility', () => {
    it('has accessible tablist role', () => {
      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </ProfileTabs>,
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('has accessible tab roles', () => {
      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
        </ProfileTabs>,
      );

      expect(screen.getAllByRole('tab')).toHaveLength(2);
    });

    it('has accessible tabpanel role', () => {
      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </ProfileTabs>,
      );

      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('associates tabpanel with selected tab via aria-labelledby', () => {
      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </ProfileTabs>,
      );

      const tab = screen.getByRole('tab', { name: /tab 1/i });
      const tabpanel = screen.getByRole('tabpanel');

      expect(tabpanel).toHaveAttribute('aria-labelledby', tab.id);
    });
  });

  describe('Multiple Tabs', () => {
    it('handles many tabs', () => {
      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
          <Tab key="tab3" title="Tab 3">
            Content 3
          </Tab>
          <Tab key="tab4" title="Tab 4">
            Content 4
          </Tab>
          <Tab key="tab5" title="Tab 5">
            Content 5
          </Tab>
        </ProfileTabs>,
      );

      expect(screen.getAllByRole('tab')).toHaveLength(5);
    });

    it('only shows content for selected tab', async () => {
      const user = userEvent.setup();

      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
        </ProfileTabs>,
      );

      // Initially shows first tab content
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();

      // Click second tab
      await user.click(screen.getByRole('tab', { name: /tab 2/i }));

      // Now shows second tab content
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  describe('Complex Tab Titles', () => {
    it('renders tabs with React element titles', () => {
      render(
        <ProfileTabs aria-label="Profile tabs">
          <Tab
            key="complex"
            title={
              <div className="flex items-center gap-2">
                <span>Complex</span>
                <span className="badge">5</span>
              </div>
            }
          >
            Complex content
          </Tab>
        </ProfileTabs>,
      );

      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });
});
