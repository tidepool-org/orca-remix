import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import SaveCancelButtons from './SaveCancelButtons';

describe('SaveCancelButtons', () => {
  const defaultProps = {
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders save and cancel buttons', () => {
      render(<SaveCancelButtons {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Cancel changes' }),
      ).toBeInTheDocument();
    });

    it('renders with custom aria labels', () => {
      render(
        <SaveCancelButtons
          {...defaultProps}
          saveAriaLabel="Save tier change"
          cancelAriaLabel="Cancel tier change"
        />,
      );

      expect(
        screen.getByRole('button', { name: 'Save tier change' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Cancel tier change' }),
      ).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(<SaveCancelButtons {...defaultProps} onSave={onSave} />);

      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(onSave).toHaveBeenCalledOnce();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      render(<SaveCancelButtons {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByRole('button', { name: 'Cancel changes' }));

      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe('Disabled state', () => {
    it('disables both buttons when isDisabled is true', () => {
      render(<SaveCancelButtons {...defaultProps} isDisabled={true} />);

      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Cancel changes' }),
      ).toBeDisabled();
    });

    it('enables both buttons when isDisabled is false', () => {
      render(<SaveCancelButtons {...defaultProps} isDisabled={false} />);

      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).not.toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Cancel changes' }),
      ).not.toBeDisabled();
    });

    it('does not call onSave when disabled', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(
        <SaveCancelButtons
          {...defaultProps}
          onSave={onSave}
          isDisabled={true}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(onSave).not.toHaveBeenCalled();
    });

    it('does not call onCancel when disabled', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      render(
        <SaveCancelButtons
          {...defaultProps}
          onCancel={onCancel}
          isDisabled={true}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Cancel changes' }));

      expect(onCancel).not.toHaveBeenCalled();
    });
  });
});
