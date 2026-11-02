import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  Inbox,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import Tabs from '../components/ui/Tabs';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import StatusBadge, { TypeBadge, VisibilityBadge } from '../components/ui/StatusBadge';
import InfoRow from '../components/ui/InfoRow';
import SubmissionDetail from '../components/submission/SubmissionDetail';
import { ListSkeleton, Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import adminService from '../services/admin.service';
import locationService from '../services/location.service';
import { getErrorMessage } from '../utils/errors';
import { formatDate, localizedName } from '../utils/format';
import { ALL_STATUSES } from '../utils/status';
import { statusDot } from '../utils/status';
import { cn } from '../utils/cn';
import SectorHeadsTab from '../components/SectorHeadsTab';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useDocumentTitle from '../hooks/useDocumentTitle';

const EMPTY_FILTERS = {
  search: '',
  status: '',
  category: '',
  visibility: '',
  escalation: '',
  district: ''
};

const ESCALATION_OPTIONS = [0, 1, 2];

export default function Admin() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const language = i18n.language;
  const isSuperAdmin = user?.role === 'super_admin';

  const [tab, setTab] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search, 350);
  const [page, setPage] = useState(1);

  const [listData, setListData] = useState({ items: [], pagination: null });
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [metaError, setMetaError] = useState(false);

  const [caseId, setCaseId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [statusForm, setStatusForm] = useState({ status: '', message: '', isPublic: true });
  const [statusErrors, setStatusErrors] = useState({});
  const [updating, setUpdating] = useState(false);

  useDocumentTitle(`${t('admin.title')} — GovVoice Rwanda`);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const data = await adminService.stats();
      setOverview(data);
    } catch (error) {
      setOverviewError(getErrorMessage(error, t));
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    let active = true;
    Promise.all([locationService.getCategories(), locationService.getDistricts()])
      .then(([categoryData, districtData]) => {
        if (!active) return;
        setCategories(categoryData);
        setDistricts(districtData);
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

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const response = await adminService.list({
        page,
        limit: 10,
        ...(debouncedSearch ? { search: debouncedSearch.trim() } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.visibility ? { visibility: filters.visibility } : {}),
        ...(filters.escalation !== '' ? { escalation: filters.escalation } : {}),
        ...(isSuperAdmin && filters.district ? { district: filters.district } : {})
      });
      setListData(response);
    } catch (error) {
      setListError(getErrorMessage(error, t));
      setListData({ items: [], pagination: null });
    } finally {
      setListLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    filters.status,
    filters.category,
    filters.visibility,
    filters.escalation,
    filters.district,
    isSuperAdmin,
    t
  ]);

  useEffect(() => {
    if (tab !== 'manage') return;
    loadList();
  }, [tab, loadList]);

  useEffect(() => {
    if (!caseId) {
      setDetail(null);
      setDetailError('');
      return undefined;
    }
    let active = true;
    setDetailLoading(true);
    setDetailError('');
    setDetail(null);
    adminService
      .detail(caseId)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((error) => {
        if (active) setDetailError(getErrorMessage(error, t));
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [caseId, t]);

  useEffect(() => {
    setStatusForm({ status: '', message: '', isPublic: true });
    setStatusErrors({});
  }, [detail?.id, detail?.status]);

  const stats = overview?.stats;
  const statusBreakdown = overview?.statusBreakdown || [];
  const categoryBreakdown = overview?.categoryBreakdown || [];
  const recent = overview?.recent || [];

  const maxStatus = useMemo(
    () => Math.max(1, ...statusBreakdown.map((item) => item.count)),
    [statusBreakdown]
  );
  const maxCategory = useMemo(
    () => Math.max(1, ...categoryBreakdown.map((item) => item.count)),
    [categoryBreakdown]
  );

  const scopeLabel = isSuperAdmin
    ? t('admin.national_scope')
    : t('admin.district_scope', {
        district: localizedName(user?.district, language) || '—'
      });

  const tabItems = [
    { id: 'overview', label: t('admin.overview'), icon: Activity },
    {
      id: 'manage',
      label: t('admin.manage_submissions'),
      icon: Inbox,
      badge: stats?.total
    },
    {
      id: 'sectorHeads',
      label: t('nav.admin') + ' (Sector)',
      icon: Users
    }
  ];

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

  const openCase = (id) => {
    setCaseId(id);
  };

  const refreshAll = () => {
    loadOverview();
    if (tab === 'manage') loadList();
  };

  const handleStatusChange = (event) => {
    const value = event.target.value;
    setStatusForm((current) => ({
      ...current,
      status: value,
      isPublic: value === 'response_given' ? true : current.isPublic
    }));
    setStatusErrors((current) => ({ ...current, status: undefined }));
  };

  const submitStatus = async () => {
    if (!detail) return;
    const errors = {};
    if (!statusForm.status) errors.status = t('validation.select_option');
    if (statusForm.status === 'response_given' && statusForm.message.trim().length < 5) {
      errors.message = t('admin.response_required');
    }
    if (Object.keys(errors).length) {
      setStatusErrors(errors);
      return;
    }

    setUpdating(true);
    setStatusErrors({});
    try {
      const updated = await adminService.updateStatus(detail.id, {
        status: statusForm.status,
        ...(statusForm.message.trim() ? { message: statusForm.message.trim() } : {}),
        isPublic: statusForm.status === 'response_given' ? true : statusForm.isPublic
      });
      setDetail(updated);
      setStatusForm({ status: '', message: '', isPublic: true });
      toast.success(t('common.success'), t('admin.update_success'));
      refreshAll();
    } catch (error) {
      toast.error(t('common.error'), getErrorMessage(error, t));
    } finally {
      setUpdating(false);
    }
  };

  const renderStatusBreakdown = () => (
    <section className="card p-5 sm:p-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
        {t('admin.status_breakdown')}
      </h2>
      {statusBreakdown.length ? (
        <ul className="mt-4 space-y-3">
          {statusBreakdown.map((item) => (
            <li key={item.status}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="inline-flex items-center gap-2 font-semibold text-ink-soft">
                  <span className={cn('h-2 w-2 rounded-full', statusDot(item.status))} />
                  {t(`status.${item.status}`, { defaultValue: item.status })}
                </span>
                <span className="font-bold text-ink">{item.count}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/5">
                <div
                  className={cn('h-full rounded-full', statusDot(item.status))}
                  style={{ width: `${Math.max(4, (item.count / maxStatus) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">{t('common.no_results')}</p>
      )}
    </section>
  );

  const renderCategoryBreakdown = () => (
    <section className="card p-5 sm:p-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
        {t('admin.category_breakdown')}
      </h2>
      {categoryBreakdown.length ? (
        <ul className="mt-4 space-y-3">
          {categoryBreakdown.map((category) => (
            <li key={category.slug}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-ink-soft">
                  {localizedName(category, language)}
                </span>
                <span className="font-bold text-ink">{category.count}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/5">
                <div
                  className="h-full rounded-full bg-rwanda-blue"
                  style={{ width: `${Math.max(4, (category.count / maxCategory) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">{t('common.no_results')}</p>
      )}
    </section>
  );

  return (
    <section className="bg-cream py-8 sm:py-10">
      <div className="container-page">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">
              <ShieldCheck className="h-3.5 w-3.5" />
              {scopeLabel}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
              {t('admin.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
              {t('admin.subtitle')}
            </p>
          </div>
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={refreshAll}
            loading={overviewLoading && !overview}
          >
            {t('common.refresh')}
          </Button>
        </div>

        <div className="mt-6">
          <Tabs items={tabItems} active={tab} onChange={setTab} />
        </div>

        {overviewError ? (
          <Alert variant="error" className="mt-5">
            {overviewError}
          </Alert>
        ) : null}
        {metaError ? (
          <Alert variant="warning" className="mt-5">
            {t('errors.network')}
          </Alert>
        ) : null}

        {tab === 'sectorHeads' ? (
          <div className="mt-6">
            <SectorHeadsTab />
          </div>
        ) : tab === 'overview' ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label={t('admin.stats_total')}
                value={stats?.total ?? '—'}
                icon={Inbox}
                tone="blue"
                loading={overviewLoading}
              />
              <StatCard
                label={t('admin.stats_active')}
                value={stats?.active ?? '—'}
                icon={Activity}
                tone="yellow"
                loading={overviewLoading}
              />
              <StatCard
                label={t('admin.stats_resolved')}
                value={stats?.resolved ?? '—'}
                icon={CheckCircle2}
                tone="green"
                loading={overviewLoading}
              />
              <StatCard
                label={t('admin.stats_overdue')}
                value={stats?.overdue ?? '—'}
                icon={AlertTriangle}
                tone="red"
                loading={overviewLoading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label={t('admin.stats_awaiting')}
                value={stats?.awaitingInfo ?? '—'}
                icon={Users}
                tone="yellow"
                loading={overviewLoading}
              />
              <StatCard
                label={t('admin.stats_response')}
                value={stats?.responseGiven ?? '—'}
                icon={MessageSquare}
                tone="blue"
                loading={overviewLoading}
              />
              <StatCard
                label={t('admin.stats_sla')}
                value={stats ? `${stats.resolutionRate}%` : '—'}
                icon={CheckCircle2}
                tone="green"
                loading={overviewLoading}
              />
              <StatCard
                label={t('home.stats_avg_days')}
                value={stats ? `${stats.avgResolutionDays}` : '—'}
                hint={t('home.stats_days')}
                icon={Clock3}
                tone="ink"
                loading={overviewLoading}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {renderStatusBreakdown()}
              {renderCategoryBreakdown()}
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section className="card overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                    {t('admin.recent_activity')}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setTab('manage')}>
                    {t('admin.submissions')}
                  </Button>
                </div>
                {overviewLoading ? (
                  <div className="p-5">
                    <ListSkeleton rows={4} />
                  </div>
                ) : recent.length ? (
                  <ul className="divide-y divide-ink/5">
                    {recent.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => openCase(item.id)}
                          className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-rwanda-blue-soft/40"
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rwanda-blue-soft text-rwanda-blue-dark">
                            <Inbox className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <StatusBadge status={item.status} />
                              <VisibilityBadge visibility={item.visibility} />
                            </span>
                            <span className="mt-1.5 block truncate text-sm font-semibold text-ink">
                              {item.subject}
                            </span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                              <span className="font-mono">{item.tracking_number}</span>
                              <span>{formatDate(item.created_at, language)}</span>
                              {item.district_name_en ? <span>{item.district_name_en}</span> : null}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-5">
                    <EmptyState
                      icon={Inbox}
                      title={t('admin.no_submissions')}
                      body={t('admin.manage_submissions')}
                    />
                  </div>
                )}
              </section>

              <aside className="space-y-5">
                <section className="card p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                    {t('admin.detail')}
                  </h2>
                  <dl className="mt-2 divide-y divide-ink/5">
                    <InfoRow
                      label={t('home.stats_satisfaction')}
                      value={stats ? `${stats.avgSatisfaction}/5` : '—'}
                    />
                    <InfoRow
                      label={t('home.stats_received')}
                      value={stats?.last30Days ?? '—'}
                    />
                    <InfoRow
                      label={t('admin.stats_total')}
                      value={stats?.publicCount ?? '—'}
                    />
                  </dl>
                </section>
                <p className="rounded-xl bg-ink/[0.03] px-4 py-3 text-xs leading-relaxed text-ink-muted">
                  {t('submission.privacy_commitment')}
                </p>
              </aside>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="card p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-rwanda-blue" />
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

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                  containerClassName="lg:col-span-2"
                  icon={Search}
                  placeholder={t('admin.search_placeholder')}
                  value={filters.search}
                  onChange={updateFilter('search')}
                  aria-label={t('common.search')}
                />
                <Select
                  value={filters.status}
                  onChange={updateFilter('status')}
                  aria-label={t('common.status')}
                >
                  <option value="">{t('admin.filter_status')}</option>
                  {ALL_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {t(`status.${status}`)}
                    </option>
                  ))}
                </Select>
                <Select
                  value={filters.category}
                  onChange={updateFilter('category')}
                  aria-label={t('submission.category')}
                >
                  <option value="">{t('admin.filter_category')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {localizedName(category, language)}
                    </option>
                  ))}
                </Select>
                <Select
                  value={filters.visibility}
                  onChange={updateFilter('visibility')}
                  aria-label={t('admin.visibility')}
                >
                  <option value="">{t('admin.filter_visibility')}</option>
                  <option value="public">{t('common.public')}</option>
                  <option value="private">{t('common.private')}</option>
                </Select>
                <Select
                  value={filters.escalation}
                  onChange={updateFilter('escalation')}
                  aria-label={t('admin.escalation')}
                >
                  <option value="">{t('admin.filter_escalation')}</option>
                  {ESCALATION_OPTIONS.map((level) => (
                    <option key={level} value={level}>
                      {level === 0
                        ? t('admin.not_escalated')
                        : t('admin.escalation_level', { level })}
                    </option>
                  ))}
                </Select>
                {isSuperAdmin ? (
                  <Select
                    value={filters.district}
                    onChange={updateFilter('district')}
                    aria-label={t('admin.district')}
                  >
                    <option value="">{t('public.filter_district')}</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {localizedName(district, language)}
                      </option>
                    ))}
                  </Select>
                ) : null}
              </div>
            </div>

            {listError ? (
              <Alert variant="error">{listError}</Alert>
            ) : null}

            {listLoading ? (
              <ListSkeleton rows={6} />
            ) : listData.items.length ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-ink-muted">
                    {t('admin.showing', { count: listData.pagination?.total ?? 0 })}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={RefreshCw}
                    onClick={refreshAll}
                    loading={listLoading}
                  >
                    {t('common.refresh')}
                  </Button>
                </div>

                <div className="hidden lg:block">
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t('submission.subject')}</th>
                          <th>{t('admin.citizen')}</th>
                          <th>{t('admin.district')}</th>
                          <th>{t('common.status')}</th>
                          <th>{t('admin.visibility')}</th>
                          <th>{t('admin.escalation')}</th>
                          <th>{t('common.date')}</th>
                          <th className="text-right">{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listData.items.map((submission) => (
                          <tr key={submission.id}>
                            <td className="max-w-xs whitespace-normal">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <TypeBadge type={submission.type} />
                              </div>
                              <p className="mt-1.5 line-clamp-1 font-semibold text-ink">
                                {submission.subject}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] text-ink-muted">
                                {submission.trackingNumber}
                              </p>
                            </td>
                            <td>
                              <p className="font-semibold text-ink">
                                {submission.citizen
                                  ? `${submission.citizen.firstName} ${submission.citizen.lastName}`
                                  : '—'}
                              </p>
                              <p className="text-[11px] text-ink-muted">
                                {submission.citizen?.phone || ''}
                              </p>
                            </td>
                            <td>
                              <p className="text-ink-soft">
                                {localizedName(submission.location?.district, language)}
                              </p>
                              <p className="text-[11px] text-ink-muted">
                                {localizedName(submission.location?.sector, language)}
                              </p>
                            </td>
                            <td>
                              <StatusBadge status={submission.status} />
                            </td>
                            <td>
                              <VisibilityBadge visibility={submission.visibility} />
                            </td>
                            <td>
                              {submission.escalationLevel > 0 ? (
                                <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                  {t('admin.escalation_level', {
                                    level: submission.escalationLevel
                                  })}
                                </span>
                              ) : (
                                <span className="text-xs text-ink-muted">
                                  {t('admin.not_escalated')}
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap text-xs text-ink-muted">
                              {formatDate(submission.createdAt, language)}
                            </td>
                            <td className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => openCase(submission.id)}
                                >
                                  {t('admin.view')}
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => openCase(submission.id)}
                                >
                                  {t('admin.update_status')}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3 lg:hidden">
                  {listData.items.map((submission) => (
                    <article key={submission.id} className="card p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <TypeBadge type={submission.type} />
                        <StatusBadge status={submission.status} />
                        <VisibilityBadge visibility={submission.visibility} />
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-sm font-bold text-ink">
                        {submission.subject}
                      </h3>
                      <p className="mt-1 font-mono text-[11px] text-ink-muted">
                        {submission.trackingNumber}
                      </p>
                      <div className="mt-2 grid gap-1 text-xs text-ink-muted">
                        <p>
                          {t('admin.citizen')}:{' '}
                          <span className="font-semibold text-ink-soft">
                            {submission.citizen
                              ? `${submission.citizen.firstName} ${submission.citizen.lastName}`
                              : '—'}
                          </span>
                        </p>
                        <p>
                          {t('admin.district')}:{' '}
                          {localizedName(submission.location?.district, language)} ·{' '}
                          {localizedName(submission.location?.sector, language)}
                        </p>
                        <p>
                          {t('common.date')}: {formatDate(submission.createdAt, language)}
                        </p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          className="flex-1"
                          variant="secondary"
                          size="sm"
                          onClick={() => openCase(submission.id)}
                        >
                          {t('admin.view')}
                        </Button>
                        <Button
                          className="flex-1"
                          variant="primary"
                          size="sm"
                          onClick={() => openCase(submission.id)}
                        >
                          {t('admin.update_status')}
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>

                {listData.pagination ? (
                  <Pagination
                    page={listData.pagination.page}
                    totalPages={listData.pagination.totalPages}
                    total={listData.pagination.total}
                    limit={listData.pagination.limit}
                    onChange={setPage}
                  />
                ) : null}
              </>
            ) : (
              <EmptyState
                icon={Inbox}
                title={t('admin.no_submissions')}
                body={hasFilters ? t('public.empty_hint') : t('common.try_again')}
                action={
                  hasFilters ? (
                    <Button variant="secondary" onClick={clearFilters}>
                      {t('common.clear_filters')}
                    </Button>
                  ) : null
                }
              />
            )}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(caseId)}
        onClose={() => setCaseId(null)}
        title={t('admin.detail')}
        description={detail?.trackingNumber || undefined}
        size="xl"
        footer={
          <Button variant="secondary" onClick={() => setCaseId(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {detailLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <ListSkeleton rows={3} />
          </div>
        ) : detailError ? (
          <Alert variant="error">{detailError}</Alert>
        ) : detail ? (
          <div className="space-y-5">
            {detail.citizen ? (
              <section className="grid gap-4 rounded-2xl border border-ink/10 bg-ink/[0.02] p-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                    {t('admin.citizen')}
                  </p>
                  <p className="mt-1 text-base font-bold text-ink">
                    {detail.citizen.firstName} {detail.citizen.lastName}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                    <MessageSquare className="h-3.5 w-3.5 text-rwanda-blue" />
                    {detail.citizen.email}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                    <Users className="h-3.5 w-3.5 text-rwanda-blue" />
                    {detail.citizen.phone}
                  </p>
                </div>
                <dl className="divide-y divide-ink/5">
                  <InfoRow label={t('admin.national_id')} value={detail.citizen.nationalId} />
                  <InfoRow
                    label={t('admin.contact')}
                    value={detail.citizen.phone || detail.citizen.email}
                  />
                  <InfoRow
                    label={t('admin.district')}
                    value={localizedName(detail.location?.district, language)}
                  />
                </dl>
              </section>
            ) : null}

            <SubmissionDetail submission={detail} viewer={user} />

            <section className="card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-rwanda-blue" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                  {t('admin.update_status')}
                </h2>
              </div>

              {detail.allowedTransitions?.length ? (
                <div className="mt-4 space-y-4">
                  <Select
                    label={t('admin.new_status')}
                    value={statusForm.status}
                    onChange={handleStatusChange}
                    error={statusErrors.status}
                    placeholder={t('admin.new_status')}
                  >
                    {detail.allowedTransitions.map((status) => (
                      <option key={status} value={status}>
                        {t(`status.${status}`)}
                      </option>
                    ))}
                  </Select>

                  <Textarea
                    label={t('admin.message')}
                    placeholder={t('admin.message_placeholder')}
                    rows={4}
                    maxLength={2000}
                    value={statusForm.message}
                    error={statusErrors.message}
                    onChange={(event) => {
                      setStatusForm((current) => ({ ...current, message: event.target.value }));
                      setStatusErrors((current) => ({ ...current, message: undefined }));
                    }}
                  />

                  {statusForm.status === 'response_given' ? (
                    <Alert variant="info">{t('admin.response_required')}</Alert>
                  ) : null}

                  <label className="flex items-start gap-2.5 rounded-xl border border-ink/10 bg-ink/[0.02] px-3.5 py-3">
                    <input
                      type="checkbox"
                      checked={statusForm.isPublic}
                      disabled={statusForm.status === 'response_given'}
                      onChange={(event) =>
                        setStatusForm((current) => ({
                          ...current,
                          isPublic: event.target.checked
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-ink/30 text-rwanda-blue focus:ring-rwanda-blue/30"
                    />
                    <span className="text-xs leading-relaxed text-ink-soft">
                      <span className="block font-bold text-ink">
                        {t('admin.visible_to_citizen')}
                      </span>
                      {t('admin.internal_note_hint')}
                    </span>
                  </label>

                  <div className="flex justify-end">
                    <Button
                      variant="green"
                      icon={CheckCircle2}
                      loading={updating}
                      onClick={submitStatus}
                    >
                      {updating ? t('admin.updating') : t('admin.update')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert variant="info" className="mt-4">
                  {t('status.closed_desc')}
                </Alert>
              )}
            </section>

          </div>
        ) : null}
      </Modal>
    </section>
  );
}
