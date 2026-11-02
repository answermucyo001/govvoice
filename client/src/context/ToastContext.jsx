import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const ToastContext = createContext(null);

const VARIANT_STYLES = {
  success: {
    icon: CheckCircle2,
    ring: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    bar: 'bg-emerald-500'
  },
  error: {
    icon: XCircle,
    ring: 'border-red-200',
    iconColor: 'text-red-600',
    bar: 'bg-red-500'
  },
  warning: {
    icon: AlertTriangle,
    ring: 'border-amber-200',
    iconColor: 'text-amber-600',
    bar: 'bg-amber-500'
  },
  info: {
    icon: Info,
    ring: 'border-sky-200',
    iconColor: 'text-sky-600',
    bar: 'bg-sky-500'
  }
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (options) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toast = {
        id,
        variant: options.variant || 'info',
        title: options.title || '',
        description: options.description || '',
        duration: options.duration ?? 5000
      };
      setToasts((current) => [...current.slice(-3), toast]);
      if (toast.duration > 0) {
        const timer = setTimeout(() => dismiss(id), toast.duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      push,
      dismiss,
      success: (title, description) => push({ variant: 'success', title, description }),
      error: (title, description) => push({ variant: 'error', title, description }),
      warning: (title, description) => push({ variant: 'warning', title, description }),
      info: (title, description) => push({ variant: 'info', title, description })
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-4 bottom-4 z-[120] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6"
          aria-live="polite"
          role="status"
        >
          {toasts.map((toast) => {
            const style = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info;
            const Icon = style.icon;
            return (
              <div
                key={toast.id}
                className={cn(
                  'pointer-events-auto relative w-full overflow-hidden rounded-2xl border bg-white p-4 pl-5 shadow-soft sm:w-[380px]',
                  style.ring
                )}
              >
                <span className={cn('absolute inset-y-0 left-0 w-1.5', style.bar)} />
                <div className="flex items-start gap-3">
                  <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.iconColor)} />
                  <div className="min-w-0 flex-1">
                    {toast.title ? (
                      <p className="text-sm font-bold text-ink">{toast.title}</p>
                    ) : null}
                    {toast.description ? (
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                        {toast.description}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    className="rounded-lg p-1 text-ink-muted transition hover:bg-ink/5 hover:text-ink"
                    aria-label="Close notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
};

export default ToastContext;
