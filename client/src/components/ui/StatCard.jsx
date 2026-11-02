import { cn } from '../../utils/cn';

const TONES = {
  blue: 'from-rwanda-blue-soft to-white text-rwanda-blue-dark',
  green: 'from-rwanda-green-soft to-white text-rwanda-green-dark',
  yellow: 'from-rwanda-yellow-soft to-white text-[#8a7400]',
  red: 'from-red-50 to-white text-red-700',
  ink: 'from-ink/5 to-white text-ink'
};

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'blue',
  loading = false,
  className
}) {
  return (
    <div className={cn('card overflow-hidden p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-20 skeleton" />
          ) : (
            <p className="mt-1 text-3xl font-extrabold leading-none text-ink">{value}</p>
          )}
          {hint ? <p className="mt-2 text-xs text-ink-muted">{hint}</p> : null}
        </div>
        {Icon ? (
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
              TONES[tone] || TONES.blue
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
