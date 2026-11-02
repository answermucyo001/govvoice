import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  info: {
    icon: Info,
    box: 'border-sky-200 bg-sky-50 text-sky-900',
    iconColor: 'text-sky-600'
  },
  success: {
    icon: CheckCircle2,
    box: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    iconColor: 'text-emerald-600'
  },
  warning: {
    icon: AlertTriangle,
    box: 'border-amber-200 bg-amber-50 text-amber-900',
    iconColor: 'text-amber-600'
  },
  error: {
    icon: XCircle,
    box: 'border-red-200 bg-red-50 text-red-900',
    iconColor: 'text-red-600'
  }
};

export default function Alert({ variant = 'info', title, children, className }) {
  const style = VARIANTS[variant] || VARIANTS.info;
  const Icon = style.icon;

  return (
    <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3.5', style.box, className)}>
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.iconColor)} />
      <div className="min-w-0 text-sm leading-relaxed">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className={cn(title && 'mt-1')}>{children}</div> : null}
      </div>
    </div>
  );
}
