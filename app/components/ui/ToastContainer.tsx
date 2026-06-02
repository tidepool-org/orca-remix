import { useToast } from '~/contexts/ToastContext';
import { Button } from '@heroui/react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, hideToast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5" aria-hidden="true" />;
      case 'error':
        return <XCircle className="w-5 h-5" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" aria-hidden="true" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" aria-hidden="true" />;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] text-[color:var(--ok)] border-[color-mix(in_srgb,var(--ok)_24%,transparent)]';
      case 'error':
        return 'bg-[color:var(--danger-soft)] text-[color:var(--danger)] border-[color:var(--danger-border)]';
      case 'warning':
        return 'bg-[color:var(--warn-bg)] text-[color:var(--warn)] border-[color:var(--warn-border)]';
      case 'info':
      default:
        return 'bg-[color:var(--primary-soft)] text-[color:var(--primary)] border-[color-mix(in_srgb,var(--primary)_24%,transparent)]';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-md"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : undefined}
          className={`flex items-center gap-3 p-4 rounded-lg border-2 shadow-lg animate-in slide-in-from-top-2 ${getColorClasses(
            toast.type,
          )}`}
        >
          {getIcon(toast.type)}
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => hideToast(toast.id)}
            aria-label="Close notification"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  );
}
