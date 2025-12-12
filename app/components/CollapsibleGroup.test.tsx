import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import { StrictMode } from 'react';
import { CollapsibleGroup, useCollapsibleGroup } from './CollapsibleGroup';
import CollapsibleTableWrapper from './CollapsibleTableWrapper';
import { Database, Upload } from 'lucide-react';

// Simple test component that uses the hook directly
function TestComponent({ id }: { id: string }) {
  const defaultExpanded = useCollapsibleGroup();
  return (
    <div data-testid={id}>
      {defaultExpanded ? 'group-expanded' : 'group-collapsed'}
    </div>
  );
}

describe('CollapsibleGroup', () => {
  describe('useCollapsibleGroup hook', () => {
    it('returns true when inside a CollapsibleGroup with default settings', () => {
      render(
        <CollapsibleGroup>
          <TestComponent id="test" />
        </CollapsibleGroup>,
      );

      expect(screen.getByTestId('test')).toHaveTextContent('group-expanded');
    });

    it('returns false when not in a CollapsibleGroup', () => {
      render(<TestComponent id="standalone" />);

      expect(screen.getByTestId('standalone')).toHaveTextContent(
        'group-collapsed',
      );
    });

    it('respects defaultExpanded={false} on CollapsibleGroup', () => {
      render(
        <CollapsibleGroup defaultExpanded={false}>
          <TestComponent id="test" />
        </CollapsibleGroup>,
      );

      expect(screen.getByTestId('test')).toHaveTextContent('group-collapsed');
    });

    it('works correctly in StrictMode', () => {
      render(
        <StrictMode>
          <CollapsibleGroup>
            <TestComponent id="test" />
          </CollapsibleGroup>
        </StrictMode>,
      );

      expect(screen.getByTestId('test')).toHaveTextContent('group-expanded');
    });
  });

  describe('CollapsibleTableWrapper integration', () => {
    it('expands the first collapsible when using isFirstInGroup prop', () => {
      render(
        <CollapsibleGroup>
          <CollapsibleTableWrapper
            icon={<Database className="h-5 w-5" />}
            title="First Table"
            totalItems={5}
            isFirstInGroup
          >
            <div data-testid="first-content">First content</div>
          </CollapsibleTableWrapper>
          <CollapsibleTableWrapper
            icon={<Upload className="h-5 w-5" />}
            title="Second Table"
            totalItems={3}
          >
            <div data-testid="second-content">Second content</div>
          </CollapsibleTableWrapper>
        </CollapsibleGroup>,
      );

      // First table (with isFirstInGroup) should be expanded
      expect(screen.getByTestId('first-content')).toBeInTheDocument();

      // Second table should be collapsed
      expect(screen.queryByTestId('second-content')).not.toBeInTheDocument();
    });

    it('expands the first collapsible in StrictMode', () => {
      render(
        <StrictMode>
          <CollapsibleGroup>
            <CollapsibleTableWrapper
              icon={<Database className="h-5 w-5" />}
              title="First Table"
              totalItems={5}
              isFirstInGroup
            >
              <div data-testid="first-content">First content</div>
            </CollapsibleTableWrapper>
            <CollapsibleTableWrapper
              icon={<Upload className="h-5 w-5" />}
              title="Second Table"
              totalItems={3}
            >
              <div data-testid="second-content">Second content</div>
            </CollapsibleTableWrapper>
          </CollapsibleGroup>
        </StrictMode>,
      );

      // First table should be expanded
      expect(screen.getByTestId('first-content')).toBeInTheDocument();

      // Second table should be collapsed
      expect(screen.queryByTestId('second-content')).not.toBeInTheDocument();
    });

    it('keeps all collapsibles collapsed when not in a CollapsibleGroup', () => {
      render(
        <>
          <CollapsibleTableWrapper
            icon={<Database className="h-5 w-5" />}
            title="First Table"
            totalItems={5}
            isFirstInGroup
          >
            <div data-testid="first-content">First content</div>
          </CollapsibleTableWrapper>
          <CollapsibleTableWrapper
            icon={<Upload className="h-5 w-5" />}
            title="Second Table"
            totalItems={3}
          >
            <div data-testid="second-content">Second content</div>
          </CollapsibleTableWrapper>
        </>,
      );

      // Both tables should be collapsed (not in a CollapsibleGroup)
      expect(screen.queryByTestId('first-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('second-content')).not.toBeInTheDocument();
    });

    it('respects explicit defaultExpanded prop over isFirstInGroup', () => {
      render(
        <CollapsibleGroup>
          <CollapsibleTableWrapper
            icon={<Database className="h-5 w-5" />}
            title="First Table"
            totalItems={5}
            isFirstInGroup
            defaultExpanded={false}
          >
            <div data-testid="first-content">First content</div>
          </CollapsibleTableWrapper>
          <CollapsibleTableWrapper
            icon={<Upload className="h-5 w-5" />}
            title="Second Table"
            totalItems={3}
            defaultExpanded={true}
          >
            <div data-testid="second-content">Second content</div>
          </CollapsibleTableWrapper>
        </CollapsibleGroup>,
      );

      // First table explicitly set to collapsed despite isFirstInGroup
      expect(screen.queryByTestId('first-content')).not.toBeInTheDocument();

      // Second table explicitly set to expanded
      expect(screen.getByTestId('second-content')).toBeInTheDocument();
    });

    it('keeps tables collapsed when isFirstInGroup is not set', () => {
      render(
        <CollapsibleGroup>
          <CollapsibleTableWrapper
            icon={<Database className="h-5 w-5" />}
            title="First Table"
            totalItems={5}
          >
            <div data-testid="first-content">First content</div>
          </CollapsibleTableWrapper>
          <CollapsibleTableWrapper
            icon={<Upload className="h-5 w-5" />}
            title="Second Table"
            totalItems={3}
          >
            <div data-testid="second-content">Second content</div>
          </CollapsibleTableWrapper>
        </CollapsibleGroup>,
      );

      // Both tables should be collapsed (no isFirstInGroup set)
      expect(screen.queryByTestId('first-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('second-content')).not.toBeInTheDocument();
    });
  });
});
