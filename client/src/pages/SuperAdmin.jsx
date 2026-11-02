import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  Fingerprint,
  Globe2,
  Inbox,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users
} from 'lucide-react';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import Tabs from '../components/ui/Tabs';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import CopyButton from '../components/ui/CopyButton';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import superAdminService from '../services/super-admin.service';
import {
  applyServerFieldErrors,
  getErrorMessage
} from '../utils/errors';
import {
  isValidEmail,
  isValidNationalId,
  isValidPhone,
  normalizePhone,
  passwordErrorKey
} from '../utils/validation';
import {
  formatDateTime,
  humanizeAction,
  localizedName
} from '../utils/format';
import { statusDot } from '../utils/status';
import { cn } from '../utils/cn';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useDocumentTitle from '../hooks/useDocumentTitle';

const LANGUAGES = [
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' }
];

export default function SuperAdmin() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const language = i18n.language;

  const [tab, setTab] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');

  const [heads, setHeads] = useState([]);
  const [headsLoading, setHeadsLoading] = useState(false);
  const [headsError, setHeadsError] = useState('');
  const [headSearch, setHeadSearch] = useState('');
  const debouncedHeadSearch = useDebouncedValue(headSearch, 250);

  const [districts, setDistricts] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(true);
  const [districtsError, setDistrictsError] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const debouncedDistrictSearch = useDebouncedValue(districtSearch, 250);

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const blankHeadForm = useMemo(
    () => ({
      nationalId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      districtId: '',
      language: i18n.language || 'rw',
      password: ''
    }),
    [i18n.language]
  );
  const [headForm, setHeadForm] = useState(blankHeadForm);
  const [headErrors, setHeadErrors] = useState({});
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [credentials, setCredentials] = useState(null);

  useDocumentTitle(`${t('superAdmin.title')} — GovVoice Rwanda`);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      setOverview(await superAdminService.overview());
    } catch (error) {
      setOverviewError(getErrorMessage(error, t));
    } finally {
      setOverviewLoading(false);
    }
  }, [t]);

  const loadHeads = useCallback(async () => {
    setHeadsLoading(true);
    setHeadsError('');
    try {
      setHeads(await superAdminService.listHeads());
    } catch (error) {
      setHeadsError(getErrorMessage(error, t));
    } finally {
      setHeadsLoading(false);
    }
  }, [t]);

  const loadDistricts = useCallback(async () => {
    setDistrictsLoading(true);
    setDistrictsError('');
    try {
      setDistricts(await superAdminService.listDistricts());
    } catch (error) {
      setDistrictsError(getErrorMessage(error, t));
    } finally {
      setDistrictsLoading(false);
    }
  }, [t]);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    setAuditError('');
    try {
      setAuditLogs(await superAdminService.auditLogs(100));
    } catch (error) {
      setAuditError(getErrorMessage(error, t));
    } finally {
      setAuditLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadOverview();
    loadDistricts();
  }, [loadOverview, loadDistricts]);

  useEffect(() => {
    if (tab === 'heads') loadHeads();
    if (tab === 'audit') loadAudit();
  }, [tab, loadHeads, loadAudit]);

  const stats = overview?.stats;
  const platform = overview?.platform;
  const statusBreakdown = overview?.statusBreakdown || [];
  const categoryBreakdown = overview?.categoryBreakdown || [];
  const overviewDistricts = overview?.districts || [];
  const recentAudit = overview?.recentAudit || [];

  const maxStatus = useMemo(
    () => Math.max(1, ...statusBreakdown.map((item) => item.count)),
    [statusBreakdown]
  );
  const maxCategory = useMemo(
    () => Math.max(1, ...categoryBreakdown.map((item) => item.count)),
    [categoryBreakdown]
  );

  const notificationTotal = useMemo(
    () => Object.values(platform?.notifications || {}).reduce((sum, value) => sum + value, 0),
    [platform]
  );

  const coveragePercent = platform?.districts?.total
    ? Math.round((platform.districts.covered / platform.districts.total) * 100)
    : 0;

  const availableDistricts = districts.filter((district) => !district.head);

  const filteredHeads = useMemo(() => {
    const term = debouncedHeadSearch.trim().toLowerCase();
    if (!term) return heads;
    return heads.filter((head) =>
      [
        head.firstName,
        head.lastName,
        head.email,
        head.phone,
        localizedName(head.district, language, 'name'),
        localizedName(head.province, language, 'name')
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [heads, debouncedHeadSearch, language]);

  const filteredDistricts = useMemo(() => {
    const term = debouncedDistrictSearch.trim().toLowerCase();
    if (!term) return districts;
    return districts.filter((district) =>
      [
        localizedName(district, language, 'name'),
        localizedName(district.province, language, 'name'),
        district.code,
        district.head?.firstName,
        district.head?.lastName,
        district.head?.email
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [districts, debouncedDistrictSearch, language]);

  const refreshEverything = () => {
    loadOverview();
    loadDistricts();
    if (tab === 'heads') loadHeads();
    if (tab === 'audit') loadAudit();
  };

  const openCreate = (districtId = '') => {
    setHeadForm({ ...blankHeadForm, districtId });
    setHeadErrors({});
    setCreateError('');
    setCreateOpen(true);
  };

  const updateHeadField = (field) => (event) => {
    const value = event.target.value;
    setHeadForm((current) => ({ ...current, [field]: value }));
    setHeadErrors((current) => ({ ...current, [field]: undefined }));
    setCreateError('');
  };

  const validateHeadForm = () => {
    const errors = {};
    if (!headForm.firstName.trim()) errors.firstName = t('validation.required');
    if (!headForm.lastName.trim()) errors.lastName = t('validation.required');
    if (!headForm.nationalId.trim()) errors.nationalId = t('validation.required');
    else if (!isValidNationalId(headForm.nationalId)) {
      errors.nationalId = t('validation.invalid_national_id');
    }
    if (!headForm.email.trim()) errors.email = t('validation.required');
    else if (!isValidEmail(headForm.email)) errors.email = t('validation.invalid_email');
    if (!headForm.phone.trim()) errors.phone = t('validation.required');
    else if (!isValidPhone(headForm.phone)) errors.phone = t('validation.invalid_phone');
    if (!headForm.districtId) errors.districtId = t('validation.select_option');
    if (headForm.password) {
      const passwordKey = passwordErrorKey(headForm.password);
      if (passwordKey) errors.password = t(passwordKey);
    }
    return errors;
  };

  const handleCreateHead = async () => {
    const errors = validateHeadForm();
    if (Object.keys(errors).length) {
      setHeadErrors(errors);
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      const result = await superAdminService.createHead({
        nationalId: headForm.nationalId.replace(/\s/g, ''),
        firstName: headForm.firstName.trim(),
        lastName: headForm.lastName.trim(),
        email: headForm.email.trim(),
        phone: normalizePhone(headForm.phone),
        districtId: headForm.districtId,
        language: headForm.language,
        ...(headForm.password ? { password: headForm.password } : {})
      });
      toast.success(t('common.success'), t('superAdmin.created'));
      setCreateOpen(false);
      setHeadForm(blankHeadForm);
      if (result.temporaryPassword) {
        setCredentials({
          name: `${result.districtHead.firstName} ${result.districtHead.lastName}`,
          email: result.districtHead.email,
          password: result.temporaryPassword
        });
      }
      refreshEverything();
    } catch (error) {
      setCreateError(getErrorMessage(error, t));
      applyServerFieldErrors(error, setHeadErrors);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleHead = async (head) => {
    setActionId(head.id);
    try {
      const updated = await superAdminService.toggleHead(head.id, !head.isActive);
      setHeads((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success(
        t('common.success'),
        t(updated.isActive ? 'superAdmin.activate' : 'superAdmin.deactivate')
      );
      loadDistricts();
      loadOverview();
    } catch (error) {
      toast.error(t('common.error'), getErrorMessage(error, t));
    } finally {
      setActionId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const result = await superAdminService.resetPassword(resetTarget.id);
      setResetTarget(null);
      setCredentials({
        name: `${resetTarget.firstName} ${resetTarget.lastName}`,
        email: resetTarget.email,
        password: result.temporaryPassword
      });
      toast.success(t('common.success'), t('superAdmin.reset_success'));
      loadHeads();
    } catch (error) {
      toast.error(t('common.error'), getErrorMessage(error, t));
    } finally {
      setResetting(false);
    }
  };

  const tabItems = [
    { id: 'overview', label: t('superAdmin.overview'), icon: Activity },
    {
      id: 'heads',
      label: t('superAdmin.district_heads'),
      icon: Users,
      badge: heads.length || undefined
    },
    {
      id: 'districts',
      label: t('superAdmin.districts'),
      icon: Building2,
      badge: platform?.districts?.covered
    },
    { id: 'audit', label: t('superAdmin.audit'), icon: Clock3 }
  ];

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
              <Globe2 className="h-3.5 w-3.5" />
              {t('nav.super_admin')}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
              {t('superAdmin.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
              {t('superAdmin.subtitle')}
            </p>
          </div>
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={refreshEverything}
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

        {tab === 'overview' ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
              <StatCard
                label={t('home.stats_satisfaction')}
                value={stats ? `${stats.avgSatisfaction}/5` : '—'}
                hint={stats ? `${stats.satisfactionPercent}%` : undefined}
                icon={ShieldCheck}
                tone="ink"
                loading={overviewLoading}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <section className="card p-5 lg:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                    {t('superAdmin.coverage')}
                  </h2>
                  <span className="text-xs font-semibold text-ink-soft">
                    {coveragePercent}%
                  </span>
                </div>
                {overviewLoading ? (
                  <Skeleton className="mt-4 h-4 w-full" />
                ) : (
                  <>
                    <p className="mt-3 text-2xl font-extrabold text-ink">
                      {t('superAdmin.coverage_value', {
                        covered: platform?.districts?.covered ?? 0,
                        total: platform?.districts?.total ?? 0
                      })}
                    </p>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink/5">
                      <div
                        className="h-full rounded-full bg-rwanda-green transition-all"
                        style={{ width: `${coveragePercent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-ink-muted">
                      {coveragePercent === 100
                        ? t('superAdmin.full_coverage')
                        : t('superAdmin.unassigned_note')}
                    </p>
                  </>
                )}
              </section>

              <section className="card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                  {t('superAdmin.platform')}
                </h2>
                {overviewLoading ? (
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <dl className="mt-3 divide-y divide-ink/5 text-sm">
                    <div className="flex items-center justify-between gap-3 py-2">
                      <dt className="flex items-center gap-1.5 text-ink-muted">
                        <Users className="h-3.5 w-3.5 text-rwanda-blue" />
                        {t('superAdmin.citizens')}
                      </dt>
                      <dd className="font-bold text-ink">{platform?.users?.citizens ?? 0}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-2">
                      <dt className="flex items-center gap-1.5 text-ink-muted">
                        <ShieldCheck className="h-3.5 w-3.5 text-rwanda-green" />
                        {t('superAdmin.heads')}
                      </dt>
                      <dd className="font-bold text-ink">
                        {platform?.users?.districtHeads ?? 0}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-2">
                      <dt className="flex items-center gap-1.5 text-ink-muted">
                        <Globe2 className="h-3.5 w-3.5 text-rwanda-yellow" />
                        {t('superAdmin.notifications_sent')}
                      </dt>
                      <dd className="font-bold text-ink">{notificationTotal}</dd>
                    </div>
                  </dl>
                )}
              </section>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {renderStatusBreakdown()}
              {renderCategoryBreakdown()}
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="card overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                    {t('superAdmin.district_performance')}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setTab('districts')}>
                    {t('superAdmin.districts')}
                  </Button>
                </div>
                {overviewLoading ? (
                  <div className="space-y-2 p-5">
                    {[0, 1, 2, 3].map((row) => (
                      <Skeleton key={row} className="h-10 w-full" />
                    ))}
                  </div>
                ) : overviewDistricts.length ? (
                  <div className="table-wrap border-0">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t('superAdmin.district_name')}</th>
                          <th>{t('superAdmin.total')}</th>
                          <th>{t('superAdmin.rate')}</th>
                          <th>{t('superAdmin.head_status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overviewDistricts.slice(0, 8).map((district) => (
                          <tr key={district.id}>
                            <td className="font-semibold text-ink">
                              {localizedName(district, language)}
                            </td>
                            <td>{district.total}</td>
                            <td>{district.resolved}</td>
                            <td>
                              {district.head ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rwanda-green" />
                                  {district.head.firstName} {district.head.lastName}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-amber-700">
                                  {t('superAdmin.no_head')}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-5 text-sm text-ink-muted">{t('common.no_results')}</p>
                )}
              </section>

              <section className="card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                  {t('superAdmin.recent_activity')}
                </h2>
                {overviewLoading ? (
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : recentAudit.length ? (
                  <ul className="mt-4 space-y-3">
                    {recentAudit.map((log) => (
                      <li key={log.id} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rwanda-blue-soft text-rwanda-blue-dark">
                          <Activity className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink">
                            {humanizeAction(log.action)}
                          </p>
                          <p className="truncate text-[11px] text-ink-muted">
                            {log.actorName || log.actorEmail || '—'}
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            {formatDateTime(log.createdAt, language)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-muted">{t('superAdmin.audit_empty')}</p>
                )}
              </section>
            </div>
          </div>
        ) : null}

        {tab === 'heads' ? (
          <div className="mt-6 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                containerClassName="sm:max-w-md"
                icon={Search}
                placeholder={t('superAdmin.search_heads')}
                value={headSearch}
                onChange={(event) => setHeadSearch(event.target.value)}
                aria-label={t('common.search')}
              />
              <Button
                icon={UserPlus}
                onClick={() => openCreate()}
                disabled={!availableDistricts.length}
              >
                {t('superAdmin.create_head')}
              </Button>
            </div>

            {!availableDistricts.length && !districtsLoading ? (
              <Alert variant="success">{t('superAdmin.full_coverage')}</Alert>
            ) : null}

            {headsError ? <Alert variant="error">{headsError}</Alert> : null}
            {districtsError ? <Alert variant="error">{districtsError}</Alert> : null}

            {headsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((row) => (
                  <Skeleton key={row} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : filteredHeads.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('superAdmin.heads')}</th>
                      <th>{t('superAdmin.district')}</th>
                      <th>{t('auth.phone')}</th>
                      <th>{t('common.status')}</th>
                      <th className="text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHeads.map((head) => (
                      <tr key={head.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar
                              firstName={head.firstName}
                              lastName={head.lastName}
                              size="sm"
                              tone="blue"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-ink">
                                {head.firstName} {head.lastName}
                              </p>
                              <p className="text-[11px] text-ink-muted">{head.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="text-ink-soft">
                            {localizedName(head.district, language)}
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            {localizedName(head.province, language)}
                          </p>
                        </td>
                        <td className="text-xs">{head.phone}</td>
                        <td>
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                              head.isActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-ink/15 bg-ink/5 text-ink-muted'
                            )}
                          >
                            {head.isActive ? t('superAdmin.active') : t('superAdmin.inactive')}
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={KeyRound}
                              onClick={() => setResetTarget(head)}
                            >
                              {t('superAdmin.reset_password')}
                            </Button>
                            <Button
                              variant={head.isActive ? 'danger-soft' : 'secondary'}
                              size="sm"
                              loading={actionId === head.id}
                              onClick={() => handleToggleHead(head)}
                            >
                              {head.isActive
                                ? t('superAdmin.deactivate')
                                : t('superAdmin.activate')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title={t('superAdmin.no_heads')}
                body={t('superAdmin.create_head_desc')}
                action={
                  availableDistricts.length ? (
                    <Button icon={UserPlus} onClick={() => openCreate()}>
                      {t('superAdmin.create_head')}
                    </Button>
                  ) : null
                }
              />
            )}
          </div>
        ) : null}

        {tab === 'districts' ? (
          <div className="mt-6 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                containerClassName="sm:max-w-md"
                icon={Search}
                placeholder={t('superAdmin.search_heads')}
                value={districtSearch}
                onChange={(event) => setDistrictSearch(event.target.value)}
                aria-label={t('common.search')}
              />
              <p className="text-sm font-semibold text-ink-muted">
                {t('superAdmin.coverage_value', {
                  covered: platform?.districts?.covered ?? 0,
                  total: platform?.districts?.total ?? districts.length
                })}
              </p>
            </div>

            {districtsError ? <Alert variant="error">{districtsError}</Alert> : null}

            {districtsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((row) => (
                  <Skeleton key={row} className="h-14 w-full rounded-2xl" />
                ))}
              </div>
            ) : filteredDistricts.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('superAdmin.district_name')}</th>
                      <th>{t('superAdmin.coverage')}</th>
                      <th>{t('admin.submissions')}</th>
                      <th>{t('superAdmin.head_status')}</th>
                      <th className="text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDistricts.map((district) => (
                      <tr key={district.id}>
                        <td>
                          <p className="font-semibold text-ink">
                            {localizedName(district, language)}
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            {localizedName(district.province, language)}
                          </p>
                        </td>
                        <td className="text-xs text-ink-muted">{district.code}</td>
                        <td className="font-semibold text-ink">{district.submissionCount}</td>
                        <td>
                          {district.head ? (
                            <div>
                              <p className="text-xs font-semibold text-ink-soft">
                                {district.head.firstName} {district.head.lastName}
                              </p>
                              <span
                                className={cn(
                                  'mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                  district.head.isActive
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-ink/15 bg-ink/5 text-ink-muted'
                                )}
                              >
                                {district.head.isActive
                                  ? t('superAdmin.active')
                                  : t('superAdmin.inactive')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-amber-700">
                              {t('superAdmin.no_head')}
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          {district.head ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={KeyRound}
                              onClick={() =>
                                setResetTarget({
                                  ...district.head,
                                  district: { id: district.id }
                                })
                              }
                            >
                              {t('superAdmin.reset_password')}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              icon={UserPlus}
                              onClick={() => openCreate(district.id)}
                            >
                              {t('superAdmin.register_now')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Building2}
                title={t('common.no_results')}
                body={t('superAdmin.unassigned_note')}
              />
            )}
          </div>
        ) : null}

        {tab === 'audit' ? (
          <div className="mt-6 space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-ink">{t('superAdmin.audit_title')}</h2>
              <p className="mt-1 text-sm text-ink-muted">{t('superAdmin.audit_subtitle')}</p>
            </div>

            {auditError ? <Alert variant="error">{auditError}</Alert> : null}

            {auditLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((row) => (
                  <Skeleton key={row} className="h-14 w-full rounded-2xl" />
                ))}
              </div>
            ) : auditLogs.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('superAdmin.audit_action')}</th>
                      <th>{t('superAdmin.audit_actor')}</th>
                      <th>{t('superAdmin.audit_entity')}</th>
                      <th>{t('superAdmin.audit_time')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <p className="font-semibold text-ink">
                            {humanizeAction(log.action)}
                          </p>
                          <p className="font-mono text-[10px] text-ink-muted">{log.action}</p>
                        </td>
                        <td>
                          <p className="text-xs font-semibold text-ink-soft">
                            {log.actorName || '—'}
                          </p>
                          <p className="text-[11px] text-ink-muted">{log.actorEmail || ''}</p>
                        </td>
                        <td className="text-xs">
                          <p className="font-semibold text-ink-soft">{log.entityType}</p>
                          <p className="font-mono text-[10px] text-ink-muted">
                            {log.entityId ? `${log.entityId.slice(0, 8)}…` : '—'}
                          </p>
                        </td>
                        <td className="whitespace-nowrap text-xs text-ink-muted">
                          {formatDateTime(log.createdAt, language)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Clock3}
                title={t('superAdmin.audit_empty')}
                body={t('superAdmin.audit_subtitle')}
              />
            )}
          </div>
        ) : null}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('superAdmin.create_head')}
        description={t('superAdmin.create_head_desc')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              icon={UserPlus}
              loading={creating}
              onClick={handleCreateHead}
              disabled={!availableDistricts.length}
            >
              {creating ? t('superAdmin.creating') : t('superAdmin.create')}
            </Button>
          </>
        }
      >
        {createError ? (
          <Alert variant="error" className="mb-4">
            {createError}
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('auth.first_name')}
            icon={UserRound}
            value={headForm.firstName}
            onChange={updateHeadField('firstName')}
            error={headErrors.firstName}
            required
          />
          <Input
            label={t('auth.last_name')}
            icon={UserRound}
            value={headForm.lastName}
            onChange={updateHeadField('lastName')}
            error={headErrors.lastName}
            required
          />
          <Input
            containerClassName="sm:col-span-2"
            label={t('auth.national_id')}
            icon={Fingerprint}
            value={headForm.nationalId}
            onChange={updateHeadField('nationalId')}
            error={headErrors.nationalId}
            hint={t('auth.national_id_hint')}
            inputMode="numeric"
            maxLength={16}
            required
          />
          <Input
            label={t('auth.email')}
            type="email"
            icon={Mail}
            value={headForm.email}
            onChange={updateHeadField('email')}
            error={headErrors.email}
            autoComplete="email"
            required
          />
          <Input
            label={t('auth.phone')}
            icon={Phone}
            value={headForm.phone}
            onChange={updateHeadField('phone')}
            error={headErrors.phone}
            placeholder="07XX XXX XXX"
            autoComplete="tel"
            required
          />
          <Select
            containerClassName="sm:col-span-2"
            label={t('superAdmin.district')}
            value={headForm.districtId}
            onChange={updateHeadField('districtId')}
            error={headErrors.districtId}
            placeholder={t('superAdmin.select_district')}
            required
          >
            {availableDistricts.map((district) => (
              <option key={district.id} value={district.id}>
                {localizedName(district, language)} ·{' '}
                {localizedName(district.province, language)}
              </option>
            ))}
          </Select>
          <Select
            label={t('common.language')}
            value={headForm.language}
            onChange={updateHeadField('language')}
          >
            {LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <Input
            label={t('superAdmin.password_optional')}
            type="password"
            icon={LockKeyhole}
            value={headForm.password}
            onChange={updateHeadField('password')}
            error={headErrors.password}
            hint={t('superAdmin.password_optional_hint')}
            autoComplete="new-password"
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={t('superAdmin.reset_password')}
        description={t('superAdmin.reset_confirm')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              icon={KeyRound}
              loading={resetting}
              onClick={handleResetPassword}
            >
              {t('superAdmin.reset_password')}
            </Button>
          </>
        }
      >
        {resetTarget ? (
          <div className="flex items-center gap-3 rounded-xl bg-ink/[0.03] p-3">
            <Avatar
              firstName={resetTarget.firstName}
              lastName={resetTarget.lastName}
              size="md"
              tone="blue"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">
                {resetTarget.firstName} {resetTarget.lastName}
              </p>
              <p className="truncate text-xs text-ink-muted">{resetTarget.email}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(credentials)}
        onClose={() => setCredentials(null)}
        title={t('superAdmin.temp_password')}
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setCredentials(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {credentials ? (
          <div>
            <p className="text-sm leading-relaxed text-ink-soft">
              {t('superAdmin.temp_password_note')}
            </p>
            <div className="mt-4 rounded-xl border border-dashed border-rwanda-blue/40 bg-rwanda-blue-soft/50 p-4">
              <p className="text-sm font-bold text-ink">{credentials.name}</p>
              <p className="text-xs text-ink-muted">{credentials.email}</p>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                <span className="font-mono text-sm font-bold tracking-wide text-rwanda-blue-dark">
                  {credentials.password}
                </span>
                <CopyButton value={credentials.password} label={t('superAdmin.copy_password')} />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
