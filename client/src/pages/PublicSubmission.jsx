import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Globe2,
  LockKeyhole,
  SearchX,
  Ticket
} from 'lucide-react';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import { FullPageLoader } from '../components/ui/Spinner';
import SubmissionDetail from '../components/submission/SubmissionDetail';
import publicService from '../services/public.service';
import { getErrorMessage } from '../utils/errors';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function PublicSubmission() {
  const { t } = useTranslation();
  const { trackingNumber } = useParams();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusCode, setStatusCode] = useState(null);

  useDocumentTitle(`${t('public.detail_title')} — GovVoice Rwanda`);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setStatusCode(null);
    publicService
      .detail(trackingNumber)
      .then((data) => {
        if (active) setSubmission(data);
      })
      .catch((requestError) => {
        if (!active) return;
        setStatusCode(requestError.response?.status || null);
        setError(getErrorMessage(requestError, t));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [trackingNumber, t]);

  if (loading) {
    return <FullPageLoader label={t('public.loading_detail')} />;
  }

  if (error || !submission) {
    const isPrivate = statusCode === 403;
    return (
      <section className="py-14 sm:py-20">
        <div className="container-page max-w-2xl">
          <h1 className="sr-only">
            {isPrivate ? t('errors.private_submission') : t('errors.not_found')}
          </h1>
          <EmptyState
            icon={isPrivate ? LockKeyhole : SearchX}
            title={isPrivate ? t('errors.private_submission') : t('errors.not_found')}
            body={isPrivate ? t('public.visibility_note') : error || t('common.try_again')}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/portal">
                  <Button variant="secondary" icon={ArrowLeft}>
                    {t('nav.portal')}
                  </Button>
                </Link>
                <Link to={`/track?number=${encodeURIComponent(trackingNumber || '')}`}>
                  <Button icon={Ticket}>{t('public.open_track')}</Button>
                </Link>
              </div>
            }
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-cream py-8 sm:py-10">
      <div className="container-page">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/portal"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('nav.portal')}
          </Link>
          <Link to={`/track?number=${encodeURIComponent(submission.trackingNumber)}`}>
            <Button variant="secondary" size="sm" icon={Ticket}>
              {t('public.open_track')}
            </Button>
          </Link>
        </div>

        <div className="mt-5">
          <Alert variant="info">
            <span className="inline-flex items-center gap-2">
              <Globe2 className="h-4 w-4 shrink-0" />
              {t('public.visibility_note')}
            </span>
          </Alert>
        </div>

        <div className="mt-5">
          <SubmissionDetail submission={submission} viewer={null} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-bold text-ink">{t('public.submit_cta')}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{t('public.submit_cta_body')}</p>
          </div>
          <Link to="/submit">
            <Button variant="green" iconRight={ArrowRight}>
              {t('public.submit_button')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
