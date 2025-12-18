import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import CollapsibleTableWrapper from './CollapsibleTableWrapper';
import { Users } from 'lucide-react';

describe('CollapsibleTableWrapper', () => {
  const defaultProps = {
    icon: <Users data-testid="test-icon" />,
    title: 'Test Table',
    totalItems: 10,
    children: <div data-testid="table-content">Table Content</div>,
  };

  describe('Rendering', () => {
    it('renders the title with item count', () => {
      render(<CollapsibleTableWrapper {...defaultProps} />);

      expect(screen.getByText('Test Table (10)')).toBeInTheDocument();
    });

    it('renders the icon', () => {
      render(<CollapsibleTableWrapper {...defaultProps} />);

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('renders toggle button', () => {
      render(<CollapsibleTableWrapper {...defaultProps} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not show children when collapsed by default', () => {
      render(<CollapsibleTableWrapper {...defaultProps} />);

      expect(screen.queryByTestId('table-content')).not.toBeInTheDocument();
    });

    it('shows children when defaultExpanded is true', () => {
      render(<CollapsibleTableWrapper {...defaultProps} defaultExpanded />);

      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });
  });

  describe('Header text formatting', () => {
    it('shows count format when collapsed', () => {
      render(<CollapsibleTableWrapper {...defaultProps} />);

      expect(screen.getByText('Test Table (10)')).toBeInTheDocument();
    });

    it('shows range format when expanded with showRange', () => {
      render(
        <CollapsibleTableWrapper
          {...defaultProps}
          defaultExpanded
          showRange={{ firstItem: 1, lastItem: 5 }}
        />,
      );

      expect(
        screen.getByText('Test Table (showing 1-5 of 10)'),
      ).toBeInTheDocument();
    });

    it('shows count format when expanded without showRange', () => {
      render(<CollapsibleTableWrapper {...defaultProps} defaultExpanded />);

      expect(screen.getByText('Test Table (10)')).toBeInTheDocument();
    });

    it('shows count format when expanded with showRange but zero items', () => {
      render(
        <CollapsibleTableWrapper
          {...defaultProps}
          totalItems={0}
          defaultExpanded
          showRange={{ firstItem: 0, lastItem: 0 }}
        />,
      );

      expect(screen.getByText('Test Table (0)')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('expands when clicked', async () => {
      const user = userEvent.setup();
      render(<CollapsibleTableWrapper {...defaultProps} />);

      expect(screen.queryByTestId('table-content')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button'));

      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    it('collapses when clicked while expanded', async () => {
      const user = userEvent.setup();
      render(<CollapsibleTableWrapper {...defaultProps} defaultExpanded />);

      expect(screen.getByTestId('table-content')).toBeInTheDocument();

      await user.click(screen.getByRole('button'));

      expect(screen.queryByTestId('table-content')).not.toBeInTheDocument();
    });

    it('toggles on multiple clicks', async () => {
      const user = userEvent.setup();
      render(<CollapsibleTableWrapper {...defaultProps} />);

      const button = screen.getByRole('button');

      // Click to expand
      await user.click(button);
      expect(screen.getByTestId('table-content')).toBeInTheDocument();

      // Click to collapse
      await user.click(button);
      expect(screen.queryByTestId('table-content')).not.toBeInTheDocument();

      // Click to expand again
      await user.click(button);
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });
  });

  describe('Controlled mode', () => {
    it('respects isExpanded prop', () => {
      render(<CollapsibleTableWrapper {...defaultProps} isExpanded={true} />);

      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    it('calls onToggle when clicked in controlled mode', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      render(
        <CollapsibleTableWrapper
          {...defaultProps}
          isExpanded={false}
          onToggle={onToggle}
        />,
      );

      await user.click(screen.getByRole('button'));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('does not change internal state when controlled', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      render(
        <CollapsibleTableWrapper
          {...defaultProps}
          isExpanded={false}
          onToggle={onToggle}
        />,
      );

      await user.click(screen.getByRole('button'));

      // Content should still be hidden because isExpanded is controlled
      expect(screen.queryByTestId('table-content')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-expanded attribute', () => {
      render(<CollapsibleTableWrapper {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when toggled', async () => {
      const user = userEvent.setup();
      render(<CollapsibleTableWrapper {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('has aria-controls linking to content', () => {
      render(<CollapsibleTableWrapper {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-controls',
        'test-table-table-content',
      );
    });

    it('generates correct aria-controls for titles with spaces', () => {
      render(
        <CollapsibleTableWrapper {...defaultProps} title="Patient Records" />,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-controls',
        'patient-records-table-content',
      );
    });

    it('content has matching id', () => {
      render(<CollapsibleTableWrapper {...defaultProps} defaultExpanded />);

      const content = screen.getByTestId('table-content').parentElement;
      expect(content).toHaveAttribute('id', 'test-table-table-content');
    });

    it('chevron icon is aria-hidden', () => {
      render(<CollapsibleTableWrapper {...defaultProps} />);

      const button = screen.getByRole('button');
      const chevron = button.querySelector('svg:not([data-testid])');
      expect(chevron).toHaveAttribute('aria-hidden', 'true');
    });

    it('button is focusable', () => {
      render(<CollapsibleTableWrapper {...defaultProps} />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});
