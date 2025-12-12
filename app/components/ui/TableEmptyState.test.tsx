import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import { Users, FileText, Database } from 'lucide-react';
import TableEmptyState from './TableEmptyState';

describe('TableEmptyState', () => {
  it('renders with message', () => {
    render(<TableEmptyState icon={Users} message="No users found" />);

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(<TableEmptyState icon={Users} message="No users found" />);

    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders with sub-message when provided', () => {
    render(
      <TableEmptyState
        icon={FileText}
        message="No documents found"
        subMessage="Try adjusting your search filters"
      />,
    );

    expect(screen.getByText('No documents found')).toBeInTheDocument();
    expect(
      screen.getByText('Try adjusting your search filters'),
    ).toBeInTheDocument();
  });

  it('does not render sub-message when not provided', () => {
    render(<TableEmptyState icon={Database} message="No data available" />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
    // Ensure only the main message is rendered
    const container = screen.getByText('No data available').parentElement;
    expect(container?.children).toHaveLength(2); // icon and message only
  });

  it('renders different icons correctly', () => {
    const { rerender } = render(
      <TableEmptyState icon={Users} message="Test" />,
    );

    let icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();

    rerender(<TableEmptyState icon={FileText} message="Test" />);

    icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<TableEmptyState icon={Users} message="No users found" />);

    const container = screen.getByText('No users found').parentElement;
    expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'py-8');
  });
});
