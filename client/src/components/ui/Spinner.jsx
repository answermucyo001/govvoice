import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]'
};

export default function Spinner({ size = 'md', className, label }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)} role="status">
      <span
        className={cn(
          'animate-spin rounded-full border-rwanda-blue/20 border-t-rwanda-blue',
          SIZES[size] || SIZES.md
        )}
      />
      {label ? <span className="text-sm text-ink-muted">{label}</span> : null}
      <span className="sr-only">{label || 'Loading'}</span>
    </span>
  );
}

export function FullPageLoader({ label }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <div className="relative">
        <span className="absolute inset-0 animate-ping rounded-full bg-rwanda-blue/20" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card">
          <Spinner size="lg" />
        </span>
      </div>
      <p className="text-sm font-medium text-ink-muted">{label}</p>
    </div>
  );
}
