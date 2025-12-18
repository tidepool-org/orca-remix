import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import SectionHeader from './SectionHeader';
import { Home, Settings, User } from 'lucide-react';

describe('SectionHeader', () => {
  describe('Rendering', () => {
    it('renders the title text', () => {
      render(<SectionHeader icon={Home} title="Dashboard" />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders the icon', () => {
      render(<SectionHeader icon={Home} title="Dashboard" />);

      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders icon as aria-hidden', () => {
      render(<SectionHeader icon={Settings} title="Settings" />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Heading levels', () => {
    it('renders as h2 by default', () => {
      render(<SectionHeader icon={Home} title="Dashboard" />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Dashboard',
      );
    });

    it('renders as h1 when specified', () => {
      render(<SectionHeader icon={Home} title="Main Title" as="h1" />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Main Title',
      );
    });

    it('renders as h2 when specified', () => {
      render(<SectionHeader icon={Home} title="Section Title" as="h2" />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Section Title',
      );
    });

    it('renders as h3 when specified', () => {
      render(<SectionHeader icon={Home} title="Subsection Title" as="h3" />);

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        'Subsection Title',
      );
    });
  });

  describe('Custom className', () => {
    it('applies additional className', () => {
      render(
        <SectionHeader icon={User} title="Profile" className="mt-4 mb-2" />,
      );

      // The wrapper div contains the icon and heading
      const heading = screen.getByRole('heading');
      const wrapper = heading.parentElement;
      expect(wrapper?.className).toContain('mt-4');
      expect(wrapper?.className).toContain('mb-2');
    });

    it('preserves default classes when adding custom className', () => {
      render(
        <SectionHeader icon={User} title="Profile" className="custom-class" />,
      );

      const heading = screen.getByRole('heading');
      const wrapper = heading.parentElement;
      expect(wrapper?.className).toContain('flex');
      expect(wrapper?.className).toContain('gap-2');
      expect(wrapper?.className).toContain('items-center');
      expect(wrapper?.className).toContain('custom-class');
    });

    it('works without custom className', () => {
      render(<SectionHeader icon={User} title="Profile" />);

      const heading = screen.getByRole('heading');
      const wrapper = heading.parentElement;
      expect(wrapper?.className).toContain('flex');
      expect(wrapper?.className).toContain('gap-2');
      expect(wrapper?.className).toContain('items-center');
    });
  });

  describe('Different icons', () => {
    it.each([
      ['Home', Home],
      ['Settings', Settings],
      ['User', User],
    ])('renders with %s icon', (_, IconComponent) => {
      render(<SectionHeader icon={IconComponent} title="Test" />);

      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5');
      expect(icon).toHaveClass('h-5');
    });
  });

  describe('Accessibility', () => {
    it('provides semantic heading structure', () => {
      render(<SectionHeader icon={Home} title="Accessible Section" />);

      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Accessible Section');
    });

    it('icon is decorative and hidden from screen readers', () => {
      render(<SectionHeader icon={Settings} title="Settings" />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
