import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  CheckCircle2,
  Inbox,
  Loader,
  MapPin,
  MessageCircleQuestion,
  MessageSquarePlus,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Select from '../components/ui/Select';
import Avatar from '../components/ui/Avatar';
import Alert from '../components/ui/Alert';
import { ListSkeleton } from '../components/ui/Skeleton';
import SubmissionCard from '../components/submission/SubmissionCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import submissionService from '../services/submission.service';
import { getErrorMessage } from '../utils/errors';
import { formatDate, localizedName } from '../utils/format';
import { ALL_STATUSES } from '../utils/status';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [data, setData] = useState({ items: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useDocumentTitle(`${t('dashboard.title')} — GovVoice Rwanda`);

  useEffect(() => {
    let active = true;
    setStatsLoading(true);
    submissionService
      .myStats()
      .then((response) => {
        if (active) setStats(response);
      })
      .catch(() => {
        if (active) setStats(null);
      })
      .finally(() => {
        if (active) setStatsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    submissionService
      .listMine({ page, limit: 6, ...(status ? { status } : {}) })
      .then((response) => {
        if (active) setData(response);
      })
      .catch((requestError) => {
        if (active) {
          setError(getErrorMessage(requestError, t));
          setData({ items: [], pagination: null });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, status, t]);

  const location = [user?.district, user?.sector]
    .filter(Boolean)
    .map((item) => localizedName(item, i18n.language))
    .join(', ');

  return (
    <section className="bg-cream py-8 sm:py-10">
      <div className="container-page">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{t('nav.dashboard')}</p>
            <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
              {t('dashboard.greeting', { name: user?.firstName || '' })}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <Link to="/submit">
            <Button icon={MessageSquarePlus} variant="green" size="lg">
              {t('dashboard.new_submission')}
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t('dashboard.stats_total')}
            value={stats?.total ?? '—'}
            icon={Inbox}
            tone="blue"
            loading={statsLoading}
          />
          <StatCard
            label={t('dashboard.stats_active')}
            value={stats?.active ?? '—'}
            icon={Loader}
            tone="yellow"
            loading={statsLoading}
          />
          <StatCard
            label={t('dashboard.stats_resolved')}
            value={stats?.resolved ?? '—'}
            icon={CheckCircle2}
            tone="green"
            loading={statsLoading}
          />
          <StatCard
            label={t('dashboard.stats_awaiting')}
            value={stats?.awaitingInfo ?? '—'}
            icon={MessageCircleQuestion}
            tone="red"
            loading={statsLoading}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-ink">{t('dashboard.recent_title')}</h2>
                <p className="mt-1 text-sm text-ink-muted">{t('dashboard.recent_subtitle')}</p>
              </div>
              <Select
                containerClassName="w-full sm:w-56"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                aria-label={t('dashboard.status_filter')}
              >
                <option value="">{t('dashboard.filter_all')}</option>
                {ALL_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {t(`status.${value}`)}
                  </option>
                ))}
              </Select>
            </div>

            {error ? (
              <Alert variant="error" className="mt-5">
                {error}
              </Alert>
            ) : null}

            <div className="mt-5">
              {loading ? (
                <ListSkeleton rows={4} />
              ) : data.items.length ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {data.items.map((submission) => (
                      <SubmissionCard
                        key={submission.id}
                        submission={submission}
                        to={`/dashboard/submissions/${submission.id}`}
                        showVisibility
                      />
                    ))}
                  </div>
                  {data.pagination ? (
                    <Pagination
                      page={data.pagination.page}
                      totalPages={data.pagination.totalPages}
                      total={data.pagination.total}
                      limit={data.pagination.limit}
                      onChange={setPage}
                      className="mt-6"
                    />
                  ) : null}
                </>
              ) : (
                <EmptyState
                  icon={MessageSquarePlus}
                  title={status ? t('dashboard.no_submissions') : t('dashboard.empty_title')}
                  body={status ? t('common.try_again') : t('dashboard.empty_body')}
                  action={
                    status ? (
                      <Button variant="secondary" onClick={() => setStatus('')}>
                        {t('common.clear_filters')}
                      </Button>
                    ) : (
                      <Link to="/submit">
                        <Button icon={MessageSquarePlus} variant="green">
                          {t('dashboard.new_submission')}
                        </Button>
                      </Link>
                    )
                  }
                />
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size="lg"
                  tone="green"
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-ink">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-rwanda-green-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rwanda-green-dark">
                    <ShieldCheck className="h-3 w-3" />
                    {t('common.account')}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2.5 border-t border-ink/5 pt-4 text-xs text-ink-muted">
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rwanda-blue" />
                  {location}
                </p>
                <p className="flex items-center justify-between gap-2">
                  <span>{t('dashboard.member_since')}</span>
                  <span className="font-semibold text-ink-soft">
                    {formatDate(user?.createdAt, i18n.language)}
                  </span>
                </p>
              </div>
              <Link to="/profile" className="mt-4 block">
                <Button variant="secondary" fullWidth icon={UserRound}>
                  {t('dashboard.profile')}
                </Button>
              </Link>
            </div>

            <div className="card overflow-hidden">
              <div className="bg-rwanda-blue-soft px-5 py-4">
                <p className="text-sm font-bold text-rwanda-blue-dark">{t('dashboard.need_help')}</p>
                <p className="mt-1 text-xs leading-relaxed text-rwanda-blue-dark/75">
                  {t('dashboard.need_help_body')}
                </p>
              </div>
              <div className="p-5">
                <Link
                  to="/portal"
                  className="flex items-center justify-between gap-3 text-sm font-semibold text-ink transition hover:text-rwanda-blue-dark"
                >
                  {t('nav.portal')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/track"
                  className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold text-ink transition hover:text-rwanda-blue-dark"
                >
                  {t('nav.track')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <p className="rounded-xl bg-ink/[0.03] px-4 py-3 text-xs leading-relaxed text-ink-muted">
              {t('dashboard.privacy_tip')}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
