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
