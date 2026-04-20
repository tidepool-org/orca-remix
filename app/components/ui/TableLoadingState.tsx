import { Spinner } from '@heroui/react';

type TableLoadingStateProps = {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
};

export default function TableLoadingState({
  label = 'Loading...',
  size = 'lg',
}: TableLoadingStateProps) {
  return (
    <div className="flex justify-center py-8">
      <Spinner size={size} label={label} />
    </div>
  );
}
