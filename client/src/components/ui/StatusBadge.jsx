import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { statusDot, statusTone, typeTone } from '../../utils/status';

export default function StatusBadge({ status, withDot = true, className }) {
  const { t } = useTranslation();
  if (!status) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold',
        statusTone(status),
        className
      )}
    >
      {withDot ? <span className={cn('h-1.5 w-1.5 rounded-full', statusDot(status))} /> : null}
      {t(`status.${status}`, { defaultValue: status })}
    </span>
  );
}

export function TypeBadge({ type, className }) {
  const { t } = useTranslation();
  if (!type) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold',
        typeTone(type),
        className
      )}
    >
      {t(`submission.type_${type}`, { defaultValue: type })}
    </span>
  );
}

export function VisibilityBadge({ visibility, className }) {
  const { t } = useTranslation();
  if (!visibility) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold',
        visibility === 'public'
          ? 'border-rwanda-green/20 bg-rwanda-green-soft text-rwanda-green-dark'
          : 'border-ink/15 bg-ink/5 text-ink-soft',
        className
      )}
    >
      {t(`common.${visibility}`, { defaultValue: visibility })}
    </span>
  );
}
