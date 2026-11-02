import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl'
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideHeader = false,
  closeLabel = 'Close',
  className
}) {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={() => onClose?.()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || closeLabel}
        className={cn(
          'relative flex max-h-[92vh] w-full animate-fade-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-soft sm:rounded-3xl',
          SIZES[size] || SIZES.md,
          className
        )}
      >
        {!hideHeader ? (
          <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              {title ? <h2 className="text-lg font-extrabold text-ink">{title}</h2> : null}
              {description ? (
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 rounded-xl p-2 text-ink-muted transition hover:bg-ink/5 hover:text-ink"
              aria-label={closeLabel}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : null}
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-ink/10 bg-ink/[0.02] px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
