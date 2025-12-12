import { ChevronDown, ChevronUp } from 'lucide-react';

type DetailsToggleButtonProps = {
  isExpanded: boolean;
  onToggle: () => void;
  expandedText?: string;
  collapsedText?: string;
};

export default function DetailsToggleButton({
  isExpanded,
  onToggle,
  expandedText = 'Hide Details',
  collapsedText = 'Show Details',
}: DetailsToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 text-sm text-primary hover:text-primary-600 transition-colors"
      aria-expanded={isExpanded}
      aria-label={isExpanded ? 'Hide details' : 'Show details'}
    >
      <span>{isExpanded ? expandedText : collapsedText}</span>
      {isExpanded ? (
        <ChevronUp className="w-4 h-4" aria-hidden="true" />
      ) : (
        <ChevronDown className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
}
