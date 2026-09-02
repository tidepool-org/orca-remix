import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import { Upload } from 'lucide-react';
import CollapsibleTableWrapper from './CollapsibleTableWrapper';

/** The header count is the only thing under test here. */
function renderWrapper(
  props: Partial<
    Pick<
      React.ComponentProps<typeof CollapsibleTableWrapper>,
      'totalItems' | 'isTotalLowerBound' | 'isExpanded' | 'showRange'
    >
  >,
) {
  return render(
    <CollapsibleTableWrapper
      icon={<Upload />}
      title="Uploads"
      totalItems={100}
      {...props}
    >
      <div>rows</div>
    </CollapsibleTableWrapper>,
  );
}

describe('CollapsibleTableWrapper header count', () => {
  it('reports an exact total when collapsed', () => {
    renderWrapper({ isExpanded: false });
    expect(screen.getByText('100 total')).toBeInTheDocument();
  });

  it('reports an exact total in the expanded range', () => {
    renderWrapper({
      isExpanded: true,
      showRange: { firstItem: 1, lastItem: 100 },
    });
    expect(screen.getByText('Showing 1–100 of 100')).toBeInTheDocument();
  });

  it('marks a lower-bound total when collapsed', () => {
    renderWrapper({ isExpanded: false, isTotalLowerBound: true });
    expect(screen.getByText('100+ total')).toBeInTheDocument();
  });

  it('marks a lower-bound total in the expanded range', () => {
    renderWrapper({
      isExpanded: true,
      isTotalLowerBound: true,
      showRange: { firstItem: 1, lastItem: 100 },
    });
    expect(screen.getByText('Showing 1–100 of 100+')).toBeInTheDocument();
  });

  it('shows no count for an empty table', () => {
    renderWrapper({
      isExpanded: false,
      totalItems: 0,
      isTotalLowerBound: true,
    });
    expect(screen.queryByText(/total/)).not.toBeInTheDocument();
  });
});
