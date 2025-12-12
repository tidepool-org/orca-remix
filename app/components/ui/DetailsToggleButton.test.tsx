import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '~/test-utils';
import DetailsToggleButton from './DetailsToggleButton';

describe('DetailsToggleButton', () => {
  const defaultProps = {
    isExpanded: false,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default collapsed text when not expanded', () => {
    render(<DetailsToggleButton {...defaultProps} />);

    expect(screen.getByText('Show Details')).toBeInTheDocument();
  });

  it('renders with default expanded text when expanded', () => {
    render(<DetailsToggleButton {...defaultProps} isExpanded={true} />);

    expect(screen.getByText('Hide Details')).toBeInTheDocument();
  });

  it('renders with custom collapsed text', () => {
    render(<DetailsToggleButton {...defaultProps} collapsedText="View More" />);

    expect(screen.getByText('View More')).toBeInTheDocument();
  });

  it('renders with custom expanded text', () => {
    render(
      <DetailsToggleButton
        {...defaultProps}
        isExpanded={true}
        expandedText="View Less"
      />,
    );

    expect(screen.getByText('View Less')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    render(<DetailsToggleButton {...defaultProps} />);

    await user.click(screen.getByRole('button'));

    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it('has correct aria-expanded attribute when collapsed', () => {
    render(<DetailsToggleButton {...defaultProps} />);

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('has correct aria-expanded attribute when expanded', () => {
    render(<DetailsToggleButton {...defaultProps} isExpanded={true} />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('has correct aria-label when collapsed', () => {
    render(<DetailsToggleButton {...defaultProps} />);

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Show details',
    );
  });

  it('has correct aria-label when expanded', () => {
    render(<DetailsToggleButton {...defaultProps} isExpanded={true} />);

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Hide details',
    );
  });

  it('renders chevron icon with aria-hidden', () => {
    render(<DetailsToggleButton {...defaultProps} />);

    const button = screen.getByRole('button');
    const icon = button.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
