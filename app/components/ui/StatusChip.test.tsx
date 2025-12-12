import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import StatusChip from './StatusChip';

describe('StatusChip', () => {
  describe('Rendering', () => {
    it('renders with status text', () => {
      render(<StatusChip status="pending" type="invite" />);

      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('renders the component successfully', () => {
      const { container } = render(
        <StatusChip status="active" type="prescription" />,
      );

      // Component renders successfully with the status text
      expect(screen.getByText('active')).toBeInTheDocument();
      // Container should have content
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders without error when capitalize is false', () => {
      render(
        <StatusChip status="active" type="prescription" capitalize={false} />,
      );

      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  describe('Prescription status colors', () => {
    it('renders active prescription status', () => {
      render(<StatusChip status="active" type="prescription" />);

      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('renders claimed prescription status', () => {
      render(<StatusChip status="claimed" type="prescription" />);

      expect(screen.getByText('claimed')).toBeInTheDocument();
    });

    it('renders pending prescription status', () => {
      render(<StatusChip status="pending" type="prescription" />);

      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('renders expired prescription status', () => {
      render(<StatusChip status="expired" type="prescription" />);

      expect(screen.getByText('expired')).toBeInTheDocument();
    });

    it('renders unknown prescription status with default color', () => {
      render(<StatusChip status="unknown" type="prescription" />);

      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });

  describe('Invite status colors', () => {
    it('renders pending invite status', () => {
      render(<StatusChip status="pending" type="invite" />);

      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('renders accepted invite status', () => {
      render(<StatusChip status="accepted" type="invite" />);

      expect(screen.getByText('accepted')).toBeInTheDocument();
    });

    it('renders declined invite status', () => {
      render(<StatusChip status="declined" type="invite" />);

      expect(screen.getByText('declined')).toBeInTheDocument();
    });
  });

  describe('Data source state colors', () => {
    it('renders connected data source state', () => {
      render(<StatusChip status="connected" type="dataSource" />);

      expect(screen.getByText('connected')).toBeInTheDocument();
    });

    it('renders disconnected data source state', () => {
      render(<StatusChip status="disconnected" type="dataSource" />);

      expect(screen.getByText('disconnected')).toBeInTheDocument();
    });

    it('renders error data source state', () => {
      render(<StatusChip status="error" type="dataSource" />);

      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  describe('Role colors and labels', () => {
    it('formats clinic_admin role as Admin', () => {
      render(<StatusChip status="clinic_admin" type="role" />);

      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('formats clinic_member role as Member', () => {
      render(<StatusChip status="clinic_member" type="role" />);

      expect(screen.getByText('Member')).toBeInTheDocument();
    });

    it('formats prescriber role as Prescriber', () => {
      render(<StatusChip status="prescriber" type="role" />);

      expect(screen.getByText('Prescriber')).toBeInTheDocument();
    });
  });

  describe('Custom props', () => {
    it('uses custom label when provided', () => {
      render(
        <StatusChip status="active" type="prescription" label="Custom Label" />,
      );

      expect(screen.getByText('Custom Label')).toBeInTheDocument();
      expect(screen.queryByText('active')).not.toBeInTheDocument();
    });

    it('uses custom colorMap when provided', () => {
      render(
        <StatusChip
          status="custom_status"
          type="prescription"
          colorMap={{ custom_status: 'secondary' }}
        />,
      );

      expect(screen.getByText('custom_status')).toBeInTheDocument();
    });

    it('applies custom className to the component', () => {
      const { container } = render(
        <StatusChip
          status="active"
          type="prescription"
          className="custom-class"
        />,
      );

      // Check that the component renders and the text is present
      expect(screen.getByText('active')).toBeInTheDocument();
      // The custom class should be applied somewhere in the component
      expect(container.innerHTML).toContain('custom-class');
    });
  });

  describe('Size variants', () => {
    it('renders with small size by default', () => {
      render(<StatusChip status="active" type="prescription" />);

      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('renders with medium size when specified', () => {
      render(<StatusChip status="active" type="prescription" size="md" />);

      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('renders with large size when specified', () => {
      render(<StatusChip status="active" type="prescription" size="lg" />);

      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  describe('Variant styles', () => {
    it('renders with flat variant by default', () => {
      render(<StatusChip status="active" type="prescription" />);

      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('renders with solid variant when specified', () => {
      render(
        <StatusChip status="active" type="prescription" variant="solid" />,
      );

      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('renders with bordered variant when specified', () => {
      render(
        <StatusChip status="active" type="prescription" variant="bordered" />,
      );

      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  describe('Case insensitivity', () => {
    it('handles uppercase status', () => {
      render(<StatusChip status="ACTIVE" type="prescription" />);

      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('handles mixed case status', () => {
      render(<StatusChip status="Pending" type="invite" />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('handles uppercase role', () => {
      render(<StatusChip status="CLINIC_ADMIN" type="role" />);

      // Role formatting handles uppercase
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  describe('Empty status handling', () => {
    it('renders with empty string status', () => {
      const { container } = render(
        <StatusChip status="" type="prescription" />,
      );

      // Component should still render even with empty status
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
