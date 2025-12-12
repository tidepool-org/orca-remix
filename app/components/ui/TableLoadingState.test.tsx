import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import TableLoadingState from './TableLoadingState';

describe('TableLoadingState', () => {
  it('renders with default label', () => {
    render(<TableLoadingState />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<TableLoadingState label="Loading patients..." />);

    expect(screen.getByText('Loading patients...')).toBeInTheDocument();
  });

  it('renders spinner component with aria-label', () => {
    render(<TableLoadingState />);

    // HeroUI Spinner uses aria-label on wrapper div
    expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
  });

  it('applies correct container styling', () => {
    render(<TableLoadingState />);

    const container =
      screen.getByText('Loading...').parentElement?.parentElement;
    expect(container).toHaveClass('flex', 'justify-center', 'py-8');
  });

  it('accepts different size props', () => {
    const { rerender } = render(<TableLoadingState size="sm" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<TableLoadingState size="md" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<TableLoadingState size="lg" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
