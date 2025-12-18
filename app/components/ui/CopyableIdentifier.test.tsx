import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '~/test-utils';
import CopyableIdentifier from './CopyableIdentifier';

// Mock the ClipboardButton since it has complex internal state
vi.mock('../ClipboardButton', () => ({
  default: ({ clipboardText }: { clipboardText: string }) => (
    <button
      type="button"
      aria-label="Copy to clipboard"
      data-clipboard-text={clipboardText}
    >
      Copy
    </button>
  ),
}));

describe('CopyableIdentifier', () => {
  describe('Basic Rendering', () => {
    it('renders with a value', () => {
      render(<CopyableIdentifier value="test@example.com" />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('renders the clipboard button', () => {
      render(<CopyableIdentifier value="test@example.com" />);

      expect(
        screen.getByRole('button', { name: /copy to clipboard/i }),
      ).toBeInTheDocument();
    });

    it('passes the value to the clipboard button', () => {
      render(<CopyableIdentifier value="copy-me" />);

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      expect(button).toHaveAttribute('data-clipboard-text', 'copy-me');
    });
  });

  describe('Label', () => {
    it('renders with a label when provided', () => {
      render(<CopyableIdentifier label="Email:" value="test@example.com" />);

      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('renders without a label when not provided', () => {
      render(<CopyableIdentifier value="test@example.com" />);

      expect(screen.queryByText('Email:')).not.toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Custom Children', () => {
    it('renders custom children instead of value text', () => {
      render(
        <CopyableIdentifier value="user-id-123">
          <a href="/users/user-id-123">View User</a>
        </CopyableIdentifier>,
      );

      expect(screen.getByText('View User')).toBeInTheDocument();
      expect(screen.queryByText('user-id-123')).not.toBeInTheDocument();
    });

    it('still copies the value when children are provided', () => {
      render(
        <CopyableIdentifier value="user-id-123">
          <span>Custom Display</span>
        </CopyableIdentifier>,
      );

      const button = screen.getByRole('button', { name: /copy to clipboard/i });
      expect(button).toHaveAttribute('data-clipboard-text', 'user-id-123');
    });
  });

  describe('Size Variants', () => {
    it('renders with default md size', () => {
      render(<CopyableIdentifier value="test" />);

      const valueElement = screen.getByText('test');
      expect(valueElement).toHaveClass('text-sm');
    });

    it('renders with sm size when specified', () => {
      render(<CopyableIdentifier value="test" size="sm" />);

      const valueElement = screen.getByText('test');
      expect(valueElement).toHaveClass('text-xs');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to the wrapper', () => {
      const { container } = render(
        <CopyableIdentifier value="test" className="my-custom-class" />,
      );

      const wrapper = container.querySelector('.my-custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('preserves default classes when adding custom className', () => {
      const { container } = render(
        <CopyableIdentifier value="test" className="my-custom-class" />,
      );

      const wrapper = container.querySelector('.my-custom-class');
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('gap-1');
    });
  });

  describe('Accessibility', () => {
    it('has accessible clipboard button', () => {
      render(<CopyableIdentifier value="test@example.com" />);

      expect(
        screen.getByRole('button', { name: /copy to clipboard/i }),
      ).toBeInTheDocument();
    });
  });
});
