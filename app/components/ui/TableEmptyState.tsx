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
      <Icon className="w-12 h-12 text-default-300 mb-4" aria-hidden="true" />
      <span className="text-default-500">{message}</span>
      {subMessage && (
        <span className="text-default-400 text-sm mt-1">{subMessage}</span>
      )}
    </div>
  );
}
