import { cn } from '../../utils/cn';

export default function InfoRow({ label, value, className, valueClassName }) {
  return (
    <div className={cn('flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-4', className)}>
      <dt className="w-full shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-muted sm:w-40">
        {label}
      </dt>
      <dd className={cn('min-w-0 text-sm font-medium text-ink', valueClassName)}>{value}</dd>
    </div>
  );
}
