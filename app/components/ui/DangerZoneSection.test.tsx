import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import DangerZoneSection, { DangerZoneAction } from './DangerZoneSection';

describe('DangerZoneSection', () => {
  describe('Rendering', () => {
    it('renders with default title', () => {
      render(
        <DangerZoneSection>
          <div>Content</div>
        </DangerZoneSection>,
      );

      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(
        <DangerZoneSection title="Custom Title">
          <div>Content</div>
        </DangerZoneSection>,
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.queryByText('Danger Zone')).not.toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <DangerZoneSection>
          <button>Delete Button</button>
        </DangerZoneSection>,
      );

      expect(
        screen.getByRole('button', { name: 'Delete Button' }),
      ).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <DangerZoneSection>
          <button>First Button</button>
          <button>Second Button</button>
        </DangerZoneSection>,
      );

      expect(
        screen.getByRole('button', { name: 'First Button' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Second Button' }),
      ).toBeInTheDocument();
    });
  });

  describe('Icon', () => {
    it('does not show icon by default', () => {
      const { container } = render(
        <DangerZoneSection>
          <div>Content</div>
        </DangerZoneSection>,
      );

      // AlertTriangle SVG should not be present
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('shows AlertTriangle icon when showIcon is true', () => {
      const { container } = render(
        <DangerZoneSection showIcon>
          <div>Content</div>
        </DangerZoneSection>,
      );

      // Icon should be present with aria-hidden
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Size variants', () => {
    it('renders with large size by default', () => {
      render(
        <DangerZoneSection>
          <div>Content</div>
        </DangerZoneSection>,
      );

      const header = screen.getByText('Danger Zone');
      expect(header).toHaveClass('text-lg', 'font-medium');
    });

    it('renders with small size when specified', () => {
      render(
        <DangerZoneSection size="sm">
          <div>Content</div>
        </DangerZoneSection>,
      );

      const header = screen.getByText('Danger Zone');
      expect(header).toHaveClass('text-sm', 'font-semibold');
    });

    it('renders with large size when specified explicitly', () => {
      render(
        <DangerZoneSection size="lg">
          <div>Content</div>
        </DangerZoneSection>,
      );

      const header = screen.getByText('Danger Zone');
      expect(header).toHaveClass('text-lg', 'font-medium');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to container', () => {
      const { container } = render(
        <DangerZoneSection className="custom-class mb-4">
          <div>Content</div>
        </DangerZoneSection>,
      );

      expect(container.innerHTML).toContain('custom-class');
      expect(container.innerHTML).toContain('mb-4');
    });

    it('works without custom className', () => {
      const { container } = render(
        <DangerZoneSection>
          <div>Content</div>
        </DangerZoneSection>,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Danger styling', () => {
    it('applies danger text color to header', () => {
      const { container } = render(
        <DangerZoneSection>
          <div>Content</div>
        </DangerZoneSection>,
      );

      const headerContainer = container.querySelector('.text-danger');
      expect(headerContainer).toBeInTheDocument();
    });
  });
});

describe('DangerZoneAction', () => {
  describe('Rendering', () => {
    it('renders title', () => {
      render(
        <DangerZoneAction
          title="Delete Item"
          description="This will delete the item"
          actionButton={<button>Delete</button>}
        />,
      );

      expect(screen.getByText('Delete Item')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(
        <DangerZoneAction
          title="Delete Item"
          description="This will delete the item permanently"
          actionButton={<button>Delete</button>}
        />,
      );

      expect(
        screen.getByText('This will delete the item permanently'),
      ).toBeInTheDocument();
    });

    it('renders action button', () => {
      render(
        <DangerZoneAction
          title="Delete Item"
          description="Description"
          actionButton={<button>Delete Now</button>}
        />,
      );

      expect(
        screen.getByRole('button', { name: 'Delete Now' }),
      ).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('has danger border styling', () => {
      const { container } = render(
        <DangerZoneAction
          title="Test"
          description="Test description"
          actionButton={<button>Action</button>}
        />,
      );

      expect(container.innerHTML).toContain('border-danger');
      expect(container.innerHTML).toContain('rounded-lg');
    });

    it('has proper padding', () => {
      const { container } = render(
        <DangerZoneAction
          title="Test"
          description="Test description"
          actionButton={<button>Action</button>}
        />,
      );

      expect(container.innerHTML).toContain('p-4');
    });

    it('has flex layout with justify-between', () => {
      const { container } = render(
        <DangerZoneAction
          title="Test"
          description="Test description"
          actionButton={<button>Action</button>}
        />,
      );

      expect(container.innerHTML).toContain('flex');
      expect(container.innerHTML).toContain('items-center');
      expect(container.innerHTML).toContain('justify-between');
    });
  });

  describe('Text styling', () => {
    it('applies correct styling to title', () => {
      render(
        <DangerZoneAction
          title="Test Title"
          description="Description"
          actionButton={<button>Action</button>}
        />,
      );

      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('text-sm', 'font-medium');
    });

    it('applies correct styling to description', () => {
      render(
        <DangerZoneAction
          title="Title"
          description="Test Description"
          actionButton={<button>Action</button>}
        />,
      );

      const description = screen.getByText('Test Description');
      expect(description).toHaveClass('text-xs', 'text-default-500');
    });
  });

  describe('Integration with DangerZoneSection', () => {
    it('renders correctly inside DangerZoneSection', () => {
      render(
        <DangerZoneSection>
          <DangerZoneAction
            title="Delete Workspace"
            description="This will permanently delete the workspace"
            actionButton={<button>Delete</button>}
          />
        </DangerZoneSection>,
      );

      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
      expect(screen.getByText('Delete Workspace')).toBeInTheDocument();
      expect(
        screen.getByText('This will permanently delete the workspace'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Delete' }),
      ).toBeInTheDocument();
    });

    it('renders multiple actions inside DangerZoneSection', () => {
      render(
        <DangerZoneSection>
          <DangerZoneAction
            title="Delete Data"
            description="Delete all data"
            actionButton={<button>Remove Data</button>}
          />
          <DangerZoneAction
            title="Delete Account"
            description="Delete the account"
            actionButton={<button>Remove Account</button>}
          />
        </DangerZoneSection>,
      );

      expect(screen.getByText('Delete Data')).toBeInTheDocument();
      expect(screen.getByText('Delete Account')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Remove Data' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Remove Account' }),
      ).toBeInTheDocument();
    });
  });
});
