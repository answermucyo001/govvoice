import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary:
    'bg-rwanda-blue text-white shadow-sm hover:bg-rwanda-blue-dark focus-visible:ring-rwanda-blue/40',
  green:
    'bg-rwanda-green text-white shadow-sm hover:bg-rwanda-green-dark focus-visible:ring-rwanda-green/40',
  yellow:
    'bg-rwanda-yellow text-ink shadow-sm hover:bg-[#e6c101] focus-visible:ring-rwanda-yellow/50',
  secondary:
    'border border-ink/15 bg-white text-ink hover:border-ink/30 hover:bg-ink/[0.03] focus-visible:ring-ink/20',
  ghost: 'text-ink-soft hover:bg-ink/[0.06] hover:text-ink focus-visible:ring-ink/20',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500/40',
  'danger-soft':
    'bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500/30'
};

const SIZES = {
  sm: 'h-9 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-sm gap-2 rounded-xl sm:text-base'
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  disabled,
  type = 'button',
  fullWidth = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-55',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      {children}
      {IconRight && !loading ? <IconRight className="h-4 w-4 shrink-0" /> : null}
    </button>
  );
}
