import { LucideIcon } from 'lucide-react';

type TableEmptyStateProps = {
  icon: LucideIcon;
  message: string;
  subMessage?: string;
};

export default function TableEmptyState({
  icon: Icon,
  message,
  subMessage,
}: TableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Icon
        className="w-12 h-12 text-[color:var(--text-faint)] mb-4"
        aria-hidden="true"
      />
      <span className="text-[13px] text-[color:var(--text-muted)]">
        {message}
      </span>
      {subMessage && (
        <span className="text-[12.5px] text-[color:var(--text-faint)] mt-1">
          {subMessage}
        </span>
      )}
    </div>
  );
}
