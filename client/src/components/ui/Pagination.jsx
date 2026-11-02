import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

const buildPages = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((value) => pages.add(value));
  if (page >= totalPages - 2) {
    [totalPages - 3, totalPages - 2, totalPages - 1].forEach((value) => pages.add(value));
  }
  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push('ellipsis');
    result.push(value);
  });
  return result;
};

export default function Pagination({ page, totalPages, total, limit, onChange, className }) {
  const { t } = useTranslation();
  if (!total || totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pages = buildPages(page, totalPages);

  return (
    <nav
      className={cn(
        'flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-5 sm:flex-row',
        className
      )}
      aria-label="Pagination"
    >
      <p className="text-sm text-ink-muted">
        {t('common.showing', { from, to, total })}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/15 bg-white text-ink-soft transition hover:bg-ink/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t('common.previous')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((value, index) =>
          value === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-ink-muted">
              …
            </span>
          ) : (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              aria-current={value === page ? 'page' : undefined}
              className={cn(
                'h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition',
                value === page
                  ? 'bg-rwanda-blue text-white shadow-sm'
                  : 'border border-transparent text-ink-soft hover:border-ink/15 hover:bg-white'
              )}
            >
              {value}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/15 bg-white text-ink-soft transition hover:bg-ink/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t('common.next')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
