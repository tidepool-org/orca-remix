import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import TabTitle from './TabTitle';
import {
  Database,
  Users,
  Settings,
  FileText,
  Building2,
  Share2,
} from 'lucide-react';

describe('TabTitle', () => {
  describe('Rendering', () => {
    it('renders with icon and label', () => {
      render(<TabTitle icon={Database} label="Data" />);

      expect(screen.getByText('Data')).toBeInTheDocument();
      // Icon should be present
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders label text correctly', () => {
      render(<TabTitle icon={Users} label="Patients" />);

      expect(screen.getByText('Patients')).toBeInTheDocument();
    });

    it('renders icon with correct size', () => {
      render(<TabTitle icon={Settings} label="Settings" />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('w-4', 'h-4');
    });
  });

  describe('Count Badge', () => {
    it('does not show badge when count is undefined', () => {
      render(<TabTitle icon={Database} label="Data" />);

      // Only the label should be in the document, no numbers
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    it('does not show badge when count is 0 and showBadge is not set', () => {
      render(<TabTitle icon={Database} label="Data" count={0} />);

      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('shows badge with count when count is greater than 0', () => {
      render(<TabTitle icon={Users} label="Patients" count={25} />);

      expect(screen.getByText('Patients')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('shows badge with large count', () => {
      render(<TabTitle icon={FileText} label="Records" count={1234} />);

      expect(screen.getByText('1234')).toBeInTheDocument();
    });

    it('shows badge when showBadge is true even with count of 0', () => {
      render(
        <TabTitle icon={Database} label="Data" count={0} showBadge={true} />,
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('hides badge when showBadge is false even with positive count', () => {
      render(
        <TabTitle icon={Database} label="Data" count={10} showBadge={false} />,
      );

      expect(screen.queryByText('10')).not.toBeInTheDocument();
    });

    it('applies correct badge styling', () => {
      render(<TabTitle icon={Users} label="Users" count={5} />);

      const badge = screen.getByText('5');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('bg-default-100');
      expect(badge).toHaveClass('px-1.5');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('rounded-full');
    });
  });

  describe('Different Icons', () => {
    it('renders with Database icon', () => {
      render(<TabTitle icon={Database} label="Data" />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders with Users icon', () => {
      render(<TabTitle icon={Users} label="Users" />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders with Building2 icon', () => {
      render(<TabTitle icon={Building2} label="Clinics" />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders with Share2 icon', () => {
      render(<TabTitle icon={Share2} label="Sharing" />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders with Settings icon', () => {
      render(<TabTitle icon={Settings} label="Settings" />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders with FileText icon', () => {
      render(<TabTitle icon={FileText} label="Documents" />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-hidden on icon', () => {
      render(<TabTitle icon={Database} label="Data" />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('label is visible for screen readers', () => {
      render(<TabTitle icon={Users} label="Patients" />);

      const label = screen.getByText('Patients');
      expect(label).toBeVisible();
    });
  });

  describe('Layout', () => {
    it('has flex container with gap', () => {
      render(<TabTitle icon={Database} label="Data" />);

      const label = screen.getByText('Data');
      const wrapper = label.parentElement;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('gap-2');
    });

    it('renders icon before label', () => {
      render(<TabTitle icon={Database} label="Data" />);

      const svg = document.querySelector('svg');
      const label = screen.getByText('Data');

      // Icon should come before label in DOM order
      const parent = label.parentElement;
      const children = Array.from(parent!.children);
      const iconIndex = children.findIndex((child) =>
        child.contains(svg as Node),
      );
      const labelIndex = children.findIndex((child) => child.contains(label));

      expect(iconIndex).toBeLessThan(labelIndex);
    });

    it('renders badge after label when present', () => {
      render(<TabTitle icon={Database} label="Data" count={5} />);

      const label = screen.getByText('Data');
      const badge = screen.getByText('5');

      // Badge should come after label in DOM order
      const parent = label.parentElement;
      const children = Array.from(parent!.children);
      const labelIndex = children.findIndex((child) => child.contains(label));
      const badgeIndex = children.findIndex((child) => child.contains(badge));

      expect(badgeIndex).toBeGreaterThan(labelIndex);
    });
  });

  describe('Use Cases', () => {
    it('works for Clinics tab', () => {
      render(<TabTitle icon={Building2} label="Clinics" count={3} />);

      expect(screen.getByText('Clinics')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('works for Patients tab', () => {
      render(<TabTitle icon={Users} label="Patients" count={150} />);

      expect(screen.getByText('Patients')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('works for Data Sharing tab', () => {
      render(<TabTitle icon={Share2} label="Data Sharing" count={7} />);

      expect(screen.getByText('Data Sharing')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('works for Settings tab without count', () => {
      render(<TabTitle icon={Settings} label="Settings" />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    it('works for Prescriptions tab', () => {
      render(<TabTitle icon={FileText} label="Prescriptions" count={12} />);

      expect(screen.getByText('Prescriptions')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('works for empty state (zero count hidden by default)', () => {
      render(<TabTitle icon={Database} label="Data Sets" count={0} />);

      expect(screen.getByText('Data Sets')).toBeInTheDocument();
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });
});
