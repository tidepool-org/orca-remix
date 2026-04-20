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
        return 'bg-success/10 text-success border-success/20';
      case 'error':
        return 'bg-danger/10 text-danger border-danger/20';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'info':
      default:
        return 'bg-primary/10 text-primary border-primary/20';
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
