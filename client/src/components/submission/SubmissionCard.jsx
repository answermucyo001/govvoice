import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, CalendarDays, MapPin, Paperclip } from 'lucide-react';
import StatusBadge, { TypeBadge, VisibilityBadge } from '../ui/StatusBadge';
import { formatDate, localizedName, truncate } from '../../utils/format';

export default function SubmissionCard({
  submission,
  to,
  showVisibility = false,
  showCitizen = false,
  footer
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const district = localizedName(submission.location?.district, language);
  const sector = localizedName(submission.location?.sector, language);

  return (
    <article className="group card flex flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-rwanda-blue/30 hover:shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type={submission.type} />
        <StatusBadge status={submission.status} />
        {showVisibility ? <VisibilityBadge visibility={submission.visibility} /> : null}
        <span className="ml-auto text-xs font-medium text-ink-muted">
          {formatDate(submission.createdAt, language)}
        </span>
      </div>

      <Link to={to} className="mt-3 block">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-ink transition group-hover:text-rwanda-blue-dark">
          {submission.subject}
        </h3>
      </Link>

      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
        {truncate(submission.description, 180)}
      </p>

      {showCitizen && submission.citizen ? (
        <p className="mt-3 text-xs font-semibold text-ink-soft">
          {submission.citizen.firstName} {submission.citizen.lastName}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-rwanda-blue" />
          {[district, sector].filter(Boolean).join(', ')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(submission.dateOccurred, language)}
        </span>
        {submission.attachmentCount > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            {submission.attachmentCount}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/5 pt-3">
        <span className="font-mono text-[11px] font-semibold text-ink-muted">
          {submission.trackingNumber}
        </span>
        {footer || (
          <Link
            to={to}
            className="inline-flex items-center gap-1 text-xs font-bold text-rwanda-blue-dark transition hover:text-rwanda-blue"
          >
            {t('common.view_details')}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}
