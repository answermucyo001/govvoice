import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Landmark,
  MapPin,
  MessageSquarePlus,
  Paperclip,
  RotateCcw,
  Star,
  Tag
} from 'lucide-react';
import StatusBadge, { TypeBadge, VisibilityBadge } from '../ui/StatusBadge';
import Timeline from '../ui/Timeline';
import AttachmentList from '../ui/AttachmentList';
import InfoRow from '../ui/InfoRow';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Textarea from '../ui/Textarea';
import CopyButton from '../ui/CopyButton';
import submissionService from '../../services/submission.service';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errors';
import {
  formatDate,
  formatDateTime,
  localizedName
} from '../../utils/format';
import {
  canConfirmResolution,
  canReopen,
  canReply
} from '../../utils/status';
import { cn } from '../../utils/cn';

function StarPicker({ value, onChange, label }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div>
      <p className="mb-1.5 block text-sm font-semibold text-ink">{label}</p>
      <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(star)}
            className="rounded-md p-1 transition hover:scale-110"
            aria-label={`${star}`}
            aria-pressed={value === star}
          >
            <Star
              className={cn(
                'h-7 w-7 transition',
                star <= (hovered || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-ink/20'
              )}
            />
          </button>
        ))}
        {value ? (
          <span className="ml-2 text-xs font-bold text-amber-600">{value}/5</span>
        ) : null}
      </div>
    </div>
  );
}

export default function SubmissionDetail({
  submission,
  viewer = null,
  onUpdated,
  className
}) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const language = i18n.language;
  const owner = Boolean(viewer && viewer.id === submission.citizenId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reply, setReply] = useState('');
  const [reason, setReason] = useState('');
  const [reopenOpen, setReopenOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setRating(submission.satisfactionRating || 0);
    setComment('');
    setReply('');
    setReason('');
    setErrors({});
  }, [submission.id, submission.status, submission.satisfactionRating]);

  const update = (next) => {
    onUpdated?.(next);
  };

  const handleConfirm = async () => {
    setBusy('confirm');
    setErrors({});
    try {
      const updated = await submissionService.confirm(submission.id, {
        rating: rating || undefined,
        comment: comment.trim() || undefined
      });
      toast.success(t('track.confirm_success'));
      update(updated);
    } catch (error) {
      toast.error(t('common.error'), getErrorMessage(error, t));
    } finally {
      setBusy(null);
    }
  };

  const handleReply = async () => {
    if (reply.trim().length < 5) {
      setErrors({ reply: t('validation.reply_short') });
      return;
    }
    setBusy('reply');
    setErrors({});
    try {
      const updated = await submissionService.reply(submission.id, {
        message: reply.trim()
      });
      toast.success(t('track.reply_success'));
      setReply('');
      update(updated);
    } catch (error) {
      toast.error(t('common.error'), getErrorMessage(error, t));
    } finally {
      setBusy(null);
    }
  };

  const handleReopen = async () => {
    if (reason.trim().length < 10) {
      setErrors({ reason: t('validation.reason_short') });
      return;
    }
    setBusy('reopen');
    setErrors({});
    try {
      const updated = await submissionService.reopen(submission.id, {
        reason: reason.trim()
      });
      toast.success(t('track.reopen_success'));
      setReopenOpen(false);
      setReason('');
      update(updated);
    } catch (error) {
      toast.error(t('common.error'), getErrorMessage(error, t));
    } finally {
      setBusy(null);
    }
  };

  const location = [submission.location?.district, submission.location?.sector, submission.location?.province]
    .filter(Boolean)
    .map((item) => localizedName(item, language))
    .join(', ');

  const hasActions = owner && (canConfirmResolution(submission) || canReply(submission) || canReopen(submission));

  return (
    <div className={cn('space-y-6', className)}>
      <div className="card overflow-hidden">
        <div className="border-b border-ink/10 bg-gradient-to-r from-rwanda-blue-soft via-white to-rwanda-green-soft px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={submission.type} />
            <StatusBadge status={submission.status} />
            <VisibilityBadge visibility={submission.visibility} />
            {submission.escalationLevel > 0 ? (
              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                {t('admin.escalation_level', { level: submission.escalationLevel })}
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 text-balance text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
            {submission.subject}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-ink-soft">
              <Tag className="h-3.5 w-3.5" />
              {submission.trackingNumber}
              <CopyButton value={submission.trackingNumber} />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {t('track.submitted_on')} {formatDate(submission.createdAt, language)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </span>
          </div>
        </div>

        {submission.status === 'response_given' && owner ? (
          <div className="px-5 pt-5 sm:px-7">
            <Alert variant="info">{t('track.response_given_note')}</Alert>
          </div>
        ) : null}
        {submission.status === 'awaiting_info' || submission.status === 'pending_citizen' ? (
          <div className="px-5 pt-5 sm:px-7">
            <Alert variant="warning">{t('track.awaiting_info_note')}</Alert>
          </div>
        ) : null}
        {submission.isOverdue && !['resolved', 'closed'].includes(submission.status) ? (
          <div className="px-5 pt-5 sm:px-7">
            <Alert variant="error">{t('admin.overdue_note')}</Alert>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
              {t('submission.description')}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              {submission.description}
            </p>
          </section>

          {submission.responseText ? (
            <section className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-rwanda-green/15 bg-rwanda-green-soft px-5 py-3.5 sm:px-6">
                <Landmark className="h-4 w-4 text-rwanda-green-dark" />
                <h2 className="text-sm font-bold text-rwanda-green-dark">
                  {t('track.official_response')}
                </h2>
                {submission.responseAt ? (
                  <span className="ml-auto text-xs text-rwanda-green-dark/70">
                    {formatDate(submission.responseAt, language)}
                  </span>
                ) : null}
              </div>
              <p className="whitespace-pre-line px-5 py-5 text-sm leading-relaxed text-ink-soft sm:px-6">
                {submission.responseText}
              </p>
            </section>
          ) : null}

          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-ink-muted" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                {t('submission.attachments')}
              </h2>
              {submission.attachments?.length ? (
                <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                  {submission.attachments.length}
                </span>
              ) : null}
            </div>
            <div className="mt-3">
              <AttachmentList attachments={submission.attachments || []} />
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-ink-muted" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                {t('track.timeline_title')}
              </h2>
            </div>
            <div className="mt-5">
              <Timeline items={submission.timeline || []} language={language} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5 lg:sticky lg:top-24">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
              {t('track.details_title')}
            </h2>
            <dl className="mt-2 divide-y divide-ink/5">
              <InfoRow
                label={t('track.category_label')}
                value={localizedName(submission.category, language)}
              />
              <InfoRow
                label={t('track.location_label')}
                value={location}
              />
              {submission.department ? (
                <InfoRow
                  label={t('submission.department')}
                  value={localizedName(submission.department, language)}
                />
              ) : null}
              <InfoRow
                label={t('submission.date_occurred')}
                value={formatDate(submission.dateOccurred, language)}
              />
              <InfoRow
                label={t('track.submitted_on')}
                value={formatDateTime(submission.createdAt, language)}
              />
              <InfoRow
                label={t('submission.due_prefix')}
                value={
                  <span
                    className={cn(
                      submission.isOverdue && !['resolved', 'closed'].includes(submission.status)
                        ? 'font-semibold text-red-600'
                        : ''
                    )}
                  >
                    {formatDate(submission.dueAt, language)}
                  </span>
                }
              />
              {submission.assignedTo ? (
                <InfoRow
                  label={t('track.assigned_office')}
                  value={`${submission.assignedTo.firstName} ${submission.assignedTo.lastName}`}
                />
              ) : null}
              {submission.resolvedAt ? (
                <InfoRow
                  label={t('status.resolved')}
                  value={formatDate(submission.resolvedAt, language)}
                />
              ) : null}
              {submission.satisfactionRating ? (
                <InfoRow
                  label={t('track.rating')}
                  value={
                    <span className="inline-flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          className={cn(
                            'h-3.5 w-3.5',
                            index < submission.satisfactionRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-ink/20'
                          )}
                        />
                      ))}
                    </span>
                  }
                />
              ) : null}
            </dl>
          </section>

          {hasActions ? (
            <section className="card space-y-5 p-5 lg:sticky lg:top-24">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4 text-rwanda-blue" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                  {t('track.citizen_actions')}
                </h2>
              </div>

              {canConfirmResolution(submission) ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                  <p className="text-sm font-bold text-ink">{t('track.confirm_prompt')}</p>
                  <div className="mt-4">
                    <StarPicker
                      label={t('track.rating')}
                      value={rating}
                      onChange={setRating}
                    />
                    <p className="mt-1 text-xs text-ink-muted">{t('track.rating_hint')}</p>
                  </div>
                  <Textarea
                    containerClassName="mt-4"
                    label={t('track.comment')}
                    placeholder={t('track.comment_placeholder')}
                    rows={3}
                    maxLength={1000}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                  <Button
                    variant="green"
                    fullWidth
                    className="mt-4"
                    icon={CheckCircle2}
                    loading={busy === 'confirm'}
                    onClick={handleConfirm}
                  >
                    {t('track.confirm_resolution_button')}
                  </Button>
                </div>
              ) : null}

              {canReply(submission) ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <p className="text-sm font-bold text-ink">{t('track.awaiting_info_note')}</p>
                  <Textarea
                    containerClassName="mt-3"
                    label={t('track.reply')}
                    placeholder={t('track.reply_placeholder')}
                    rows={4}
                    maxLength={2000}
                    value={reply}
                    error={errors.reply}
                    onChange={(event) => {
                      setReply(event.target.value);
                      setErrors((current) => ({ ...current, reply: undefined }));
                    }}
                  />
                  <Button
                    className="mt-3"
                    fullWidth
                    icon={MessageSquarePlus}
                    loading={busy === 'reply'}
                    onClick={handleReply}
                  >
                    {t('track.reply_button')}
                  </Button>
                </div>
              ) : null}

              {canReopen(submission) ? (
                <div className={cn(canConfirmResolution(submission) && 'border-t border-ink/10 pt-4')}>
                  <p className="text-xs leading-relaxed text-ink-muted">{t('track.reopen_note')}</p>
                  <Button
                    variant="danger-soft"
                    size="sm"
                    fullWidth
                    className="mt-2.5"
                    icon={RotateCcw}
                    onClick={() => setReopenOpen(true)}
                  >
                    {t('track.reopen')}
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}

          {owner && !hasActions ? (
            <section className="card p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rwanda-green-soft text-rwanda-green-dark">
                  <Building2 className="h-4 w-4" />
                </span>
                <p className="text-xs leading-relaxed text-ink-muted">
                  {t('dashboard.privacy_tip')}
                </p>
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      <Modal
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        title={t('track.reopen')}
        description={t('track.reopen_hint')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReopenOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              icon={RotateCcw}
              loading={busy === 'reopen'}
              onClick={handleReopen}
            >
              {t('track.reopen_button')}
            </Button>
          </>
        }
      >
        <Textarea
          label={t('track.reopen_reason')}
          placeholder={t('track.reopen_hint')}
          rows={5}
          maxLength={1000}
          value={reason}
          error={errors.reason}
          onChange={(event) => {
            setReason(event.target.value);
            setErrors((current) => ({ ...current, reason: undefined }));
          }}
        />
      </Modal>
    </div>
  );
}
