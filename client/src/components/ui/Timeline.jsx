import { useTranslation } from 'react-i18next';
import { Bot, Landmark, Lock, Star, UserRound } from 'lucide-react';
import { formatDateTime } from '../../utils/format';
import { cn } from '../../utils/cn';
import StatusBadge from './StatusBadge';

const actorIcon = (role) => {
  if (role === 'citizen') return UserRound;
  if (role === 'district_head' || role === 'sector_head' || role === 'super_admin') return Landmark;
  return Bot;
};

export default function Timeline({ items = [], language = 'rw', className }) {
  const { t } = useTranslation();

  if (!items.length) {
    return (
      <p className="rounded-xl bg-ink/[0.03] px-4 py-6 text-center text-sm text-ink-muted">
        {t('common.no_results')}
      </p>
    );
  }

  return (
    <ol className={cn('relative space-y-0', className)}>
      {items.map((item, index) => {
        const Icon = actorIcon(item.actorRole);
        const isLast = index === items.length - 1;
        const internal = !item.isPublic;
        const rating = Number(item.metadata?.rating || 0);

        return (
          <li key={item.id} className="relative flex gap-3.5 pb-6 last:pb-0">
            {!isLast ? (
              <span className="absolute left-[17px] top-9 h-[calc(100%-24px)] w-px bg-ink/10" />
            ) : null}
            <span
              className={cn(
                'relative z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                internal
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-rwanda-blue/20 bg-rwanda-blue-soft text-rwanda-blue-dark'
              )}
            >
              {internal ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {item.status ? <StatusBadge status={item.status} /> : null}
                {internal ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    {t('admin.internal')}
                  </span>
                ) : null}
                <span className="text-xs text-ink-muted">
                  {formatDateTime(item.createdAt, language)}
                </span>
              </div>
              <div
                className={cn(
                  'mt-2 rounded-xl border px-3.5 py-3 text-sm leading-relaxed',
                  internal
                    ? 'border-dashed border-amber-200 bg-amber-50/50 text-ink-soft'
                    : 'border-ink/10 bg-white text-ink-soft'
                )}
              >
                <p className="whitespace-pre-line">{item.message}</p>
                {rating > 0 ? (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                    {Array.from({ length: 5 }, (_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={cn(
                          'h-3.5 w-3.5',
                          starIndex < rating ? 'fill-amber-400 text-amber-400' : 'text-ink/20'
                        )}
                      />
                    ))}
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-ink-muted">
                {item.actorName ||
                  (item.actorRole === 'citizen'
                    ? t('admin.citizen')
                    : item.actorRole
                      ? t('track.government')
                      : t('track.system'))}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
