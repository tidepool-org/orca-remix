import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@heroui/react';

type ResourceErrorProps = {
  /** The name of the resource that failed to load (e.g., "Prescriptions") */
  title: string;
  /** Error message with details (e.g., "403 Forbidden") */
  message?: string;
  /** Optional callback to retry loading the resource */
  onRetry?: () => void;
  /** Whether a retry is currently in progress */
  isRetrying?: boolean;
};

export default function ResourceError({
  title,
  message,
  onRetry,
  isRetrying = false,
}: ResourceErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 px-4"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="w-12 h-12 text-danger mb-4" aria-hidden="true" />
      <span className="text-danger font-medium text-center">
        Failed to load {title}
      </span>
      {message && (
        <span className="text-default-500 text-sm mt-1 text-center max-w-md">
          {message}
        </span>
      )}
      {onRetry && (
        <Button
          size="sm"
          variant="flat"
          color="primary"
          className="mt-4"
          onPress={onRetry}
          isLoading={isRetrying}
          startContent={!isRetrying && <RefreshCw className="w-4 h-4" />}
          aria-label={`Retry loading ${title}`}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
