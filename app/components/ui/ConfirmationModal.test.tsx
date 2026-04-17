import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '~/test-utils';
import ConfirmationModal from './ConfirmationModal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title and description', () => {
    render(<ConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to proceed?'),
    ).toBeInTheDocument();
  });

  it('renders default confirm and cancel buttons', () => {
    render(<ConfirmationModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders custom button text', () => {
    render(
      <ConfirmationModal
        {...defaultProps}
        confirmText="Delete"
        cancelText="Keep"
      />,
    );

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables confirm button when requiresInput is true and input is empty', () => {
    render(
      <ConfirmationModal
        {...defaultProps}
        requiresInput={true}
        expectedInput="DELETE"
      />,
    );

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('enables confirm button when correct input is provided', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmationModal
        {...defaultProps}
        requiresInput={true}
        expectedInput="DELETE"
        inputPlaceholder="Type DELETE"
      />,
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'DELETE');

    expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeDisabled();
  });

  it('shows danger icon when confirmVariant is danger', () => {
    render(<ConfirmationModal {...defaultProps} confirmVariant="danger" />);

    // The AlertTriangle icon should be rendered
    const header = screen.getByText('Confirm Action').closest('header');
    expect(header?.querySelector('svg')).toBeInTheDocument();
  });

  it('disables buttons when isLoading is true', () => {
    render(<ConfirmationModal {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    // HeroUI prepends "Loading" to button text when isLoading is true
    expect(
      screen.getByRole('button', { name: /Loading Confirm/i }),
    ).toBeDisabled();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmationModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });
});
