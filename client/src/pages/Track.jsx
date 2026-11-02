import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Search,
  ShieldCheck,
  Ticket
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import SubmissionDetail from '../components/submission/SubmissionDetail';
import { useAuth } from '../context/AuthContext';
import submissionService from '../services/submission.service';
import { getErrorMessage } from '../utils/errors';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Track() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [number, setNumber] = useState(searchParams.get('number') || '');
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState(null);

  useDocumentTitle(`${t('track.title')} — GovVoice Rwanda`);

  useEffect(() => {
    const initial = searchParams.get('number');
    if (!initial) return;
    let active = true;
    setLoading(true);
    submissionService
      .track(initial)
      .then((data) => {
        if (active) setSubmission(data);
      })
      .catch((requestError) => {
        if (active) {
          setErrorCode(requestError.response?.status || null);
          setError(getErrorMessage(requestError, t));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // Only run for the initial deep link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = number.trim();
    if (!value) {
      setError(t('validation.required'));
      return;
    }
    setLoading(true);
    setError('');
    setErrorCode(null);
    setSubmission(null);
    try {
      const data = await submissionService.track(value.toUpperCase());
      setSubmission(data);
      navigate(`/track?number=${encodeURIComponent(value.toUpperCase())}`, { replace: true });
    } catch (requestError) {
      setErrorCode(requestError.response?.status || null);
      setError(getErrorMessage(requestError, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-ink/5 bg-gradient-to-b from-rwanda-blue-soft/70 via-cream to-cream py-12 sm:py-16">
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden="true" />
      <div className="container-page relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">
            <Search className="h-3.5 w-3.5" />
            {t('nav.track')}
          </span>
          <h1 className="mt-5 text-3xl font-extrabold text-ink sm:text-4xl">{t('track.title')}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">
            {t('track.subtitle')}
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5"
          >
            <Input
              containerClassName="flex-1"
              label={t('track.label')}
              placeholder={t('track.placeholder')}
              icon={Ticket}
              value={number}
              onChange={(event) => {
                setNumber(event.target.value.toUpperCase());
                setError('');
              }}
              autoComplete="off"
              spellCheck={false}
              className="font-mono tracking-wide"
            />
            <Button
              type="submit"
              size="lg"
              loading={loading}
              icon={Search}
              className="sm:mb-[1px]"
            >
              {loading ? t('track.searching') : t('track.button')}
            </Button>
          </form>

          <p className="mt-2 text-center text-xs text-ink-muted sm:text-left">
            {t('track.help_text')}
          </p>

          {error ? (
            errorCode === 403 ? (
              <Alert variant="warning" title={t('track.private_note')} className="mt-5">
                <Link
                  to="/login"
                  state={{ from: { pathname: '/track', search: `?number=${encodeURIComponent(number)}`, hash: '' } }}
                  className="link"
                >
                  {t('track.login_for_private')}
                </Link>
              </Alert>
            ) : (
              <Alert variant="error" className="mt-5">
                {error}
              </Alert>
            )
          ) : null}
        </div>

        {submission ? (
          <div className="mx-auto mt-8 max-w-5xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink-soft">
                {t('track.tracking_for', { number: submission.trackingNumber })}
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={Search}
                onClick={() => {
                  setSubmission(null);
                  setNumber('');
                  setError('');
                  navigate('/track', { replace: true });
                }}
              >
                {t('track.label')}
              </Button>
            </div>
            <SubmissionDetail
              submission={submission}
              viewer={user}
              onUpdated={setSubmission}
            />
          </div>
        ) : !loading && !error ? (
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { icon: Ticket, title: t('track.label'), body: t('track.help_text') },
              { icon: ShieldCheck, title: t('common.secure'), body: t('auth.secure_note') },
              { icon: CheckCircle2, title: t('nav.submit'), body: t('submission.tracking_hint') }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-ink/10 bg-white/70 p-4">
                  <Icon className="h-5 w-5 text-rwanda-blue" />
                  <p className="mt-2 text-sm font-bold text-ink">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.body}</p>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
