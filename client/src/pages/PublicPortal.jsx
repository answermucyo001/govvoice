import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  MessageSquarePlus,
  Search,
  SlidersHorizontal,
  X
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Alert from '../components/ui/Alert';
import { ListSkeleton } from '../components/ui/Skeleton';
import SubmissionCard from '../components/submission/SubmissionCard';
import publicService from '../services/public.service';
import { getErrorMessage } from '../utils/errors';
import { localizedName } from '../utils/format';
import { ALL_STATUSES, SUBMISSION_TYPES } from '../utils/status';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useDocumentTitle from '../hooks/useDocumentTitle';

const EMPTY_FILTERS = {
  search: '',
  category: '',
  district: '',
  status: '',
  type: ''
};

export default function PublicPortal() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  const [meta, setMeta] = useState({ categories: [], districts: [] });
  const [stats, setStats] = useState(null);
  const [metaError, setMetaError] = useState(false);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search, 350);
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ items: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle(`${t('public.title')} — GovVoice Rwanda`);

  useEffect(() => {
    let active = true;
    Promise.all([publicService.meta(), publicService.stats()])
      .then(([metaData, statsData]) => {
        if (!active) return;
        setMeta({
          categories: metaData.categories || [],
          districts: metaData.districts || []
        });
        setStats(statsData);
      })
      .catch(() => {
        if (active) setMetaError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    publicService
      .list({
        page,
        limit: 9,
        ...(debouncedSearch ? { search: debouncedSearch.trim() } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.district ? { district: filters.district } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.type ? { type: filters.type } : {})
      })
      .then((response) => {
        if (!active) return;
        setData(response);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(getErrorMessage(requestError, t));
        setData({ items: [], pagination: null });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    page,
    debouncedSearch,
    filters.category,
    filters.district,
    filters.status,
    filters.type,
    t
  ]);

  const updateFilter = (field) => (event) => {
    const value = event.target.value;
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(1);
  };

  const hasFilters = Object.values(filters).some(Boolean);
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const total = data.pagination?.total ?? 0;

  return (
    <div className="bg-cream">
      <section className="relative overflow-hidden border-b border-ink/5 bg-gradient-to-b from-rwanda-blue-soft/70 via-cream to-cream py-10 sm:py-14">
        <div className="absolute inset-0 bg-grid opacity-50" aria-hidden="true" />
        <div className="container-page relative">
          <div className="max-w-3xl">
            <span className="eyebrow">
              <Globe2 className="h-3.5 w-3.5" />
              {t('nav.portal')}
            </span>
            <h1 className="mt-5 text-3xl font-extrabold text-ink sm:text-4xl">
              {t('public.title')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
              {t('public.subtitle')}
            </p>
          </div>

          <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                {t('home.stats_received')}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-ink">
                {stats?.total ?? '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                {t('home.stats_resolved')}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-ink">
                {stats?.resolved ?? '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                {t('home.stats_satisfaction')}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-ink">
                {stats ? `${Math.round(stats.satisfactionPercent || 0)}%` : '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="container-page">
          <div className="card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-rwanda-blue" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                {t('common.filter')}
              </h2>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-ink-muted transition hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                  {t('common.clear_filters')}
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Input
                containerClassName="sm:col-span-2 lg:col-span-2"
                icon={Search}
                placeholder={t('public.search_placeholder')}
                value={filters.search}
                onChange={updateFilter('search')}
                aria-label={t('common.search')}
              />
              <Select
                value={filters.category}
                onChange={updateFilter('category')}
                aria-label={t('submission.category')}
              >
                <option value="">{t('public.filter_category')}</option>
                {meta.categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {localizedName(category, language)}
                  </option>
                ))}
              </Select>
              <Select
                value={filters.district}
                onChange={updateFilter('district')}
                aria-label={t('auth.district')}
              >
                <option value="">{t('public.filter_district')}</option>
                {meta.districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {localizedName(district, language)}
                  </option>
                ))}
              </Select>
              <Select
                value={filters.status}
                onChange={updateFilter('status')}
                aria-label={t('common.status')}
              >
                <option value="">{t('public.filter_status')}</option>
                {ALL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}`)}
                  </option>
                ))}
              </Select>
              <Select
                containerClassName="sm:col-span-2 lg:col-span-2"
                value={filters.type}
                onChange={updateFilter('type')}
                aria-label={t('submission.review_type')}
              >
                <option value="">{t('public.filter_type')}</option>
                {SUBMISSION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`submission.type_${type}`)}
                  </option>
                ))}
              </Select>
            </div>

            {metaError ? (
              <Alert variant="warning" className="mt-4">
                {t('errors.network')}
              </Alert>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink-soft">
              {t('public.results', { count: total })}
            </p>
            <Link to="/submit">
              <Button variant="green" size="sm" icon={MessageSquarePlus}>
                {t('public.submit_button')}
              </Button>
            </Link>
          </div>

          {error ? (
            <Alert variant="error" className="mt-5">
              {error}
            </Alert>
          ) : null}

          <div className="mt-5">
            {loading ? (
              <ListSkeleton rows={5} />
            ) : data.items.length ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {data.items.map((submission) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      to={`/portal/${submission.trackingNumber}`}
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
                icon={Globe2}
                title={hasFilters ? t('public.empty') : t('public.submit_cta')}
                body={hasFilters ? t('public.empty_hint') : t('public.submit_cta_body')}
                action={
                  hasFilters ? (
                    <Button variant="secondary" onClick={clearFilters}>
                      {t('common.clear_filters')}
                    </Button>
                  ) : (
                    <Link to="/submit">
                      <Button variant="green" icon={MessageSquarePlus}>
                        {t('public.submit_button')}
                      </Button>
                    </Link>
                  )
                }
              />
            )}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="card overflow-hidden">
              <div className="border-b border-ink/10 bg-gradient-to-r from-rwanda-blue-soft via-white to-rwanda-green-soft px-5 py-5 sm:px-6">
                <h2 className="text-lg font-extrabold text-ink">{t('public.submit_cta')}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {t('public.submit_cta_body')}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                <p className="flex items-center gap-2 text-xs text-ink-muted">
                  <CheckCircle2 className="h-4 w-4 text-rwanda-green" />
                  {t('public.visibility_note')}
                </p>
                <Link to="/submit">
                  <Button variant="green" size="sm" iconRight={ArrowRight}>
                    {t('public.submit_button')}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="card p-5">
              <p className="text-sm font-bold text-ink">{t('public.tracking_hint')}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {t('track.help_text')}
              </p>
              <Link to="/track" className="mt-3 block">
                <Button variant="secondary" fullWidth icon={Search}>
                  {t('public.open_track')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
