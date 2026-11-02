import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Globe2,
  Heart,
  Lightbulb,
  Lock,
  MapPin,
  Paperclip,
  Send,
  ShieldCheck
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Alert from '../components/ui/Alert';
import StepIndicator from '../components/ui/StepIndicator';
import FileUploader from '../components/ui/FileUploader';
import CopyButton from '../components/ui/CopyButton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import locationService from '../services/location.service';
import submissionService from '../services/submission.service';
import attachmentService from '../services/attachment.service';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { validateSubmissionStep } from '../utils/validation';
import {
  formatDate,
  localizedName,
  todayISO
} from '../utils/format';
import { cn } from '../utils/cn';
import useDocumentTitle from '../hooks/useDocumentTitle';

const TYPE_CARDS = [
  {
    value: 'complaint',
    icon: AlertTriangle,
    tone: 'border-red-200 bg-red-50 text-red-600',
    active: 'border-red-400 ring-red-100'
  },
  {
    value: 'suggestion',
    icon: Lightbulb,
    tone: 'border-rwanda-blue/20 bg-rwanda-blue-soft text-rwanda-blue-dark',
    active: 'border-rwanda-blue ring-rwanda-blue/10'
  },
  {
    value: 'compliment',
    icon: Heart,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    active: 'border-emerald-400 ring-emerald-100'
  }
];

const FIELD_STEPS = {
  type: 0,
  categoryId: 0,
  subject: 0,
  description: 0,
  dateOccurred: 0,
  provinceId: 1,
  districtId: 1,
  sectorId: 1,
  visibility: 1,
  attachmentIds: 2
};

export default function Submit() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const initialForm = useMemo(
    () => ({
      type: 'complaint',
      visibility: 'private',
      categoryId: '',
      provinceId: user?.province?.id || '',
      districtId: user?.district?.id || '',
      sectorId: user?.sector?.id || '',
      subject: '',
      description: '',
      dateOccurred: todayISO()
    }),
    [user]
  );

  const [form, setForm] = useState(initialForm);
  const [attachments, setAttachments] = useState([]);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [metaError, setMetaError] = useState(false);

  useDocumentTitle(`${t('submission.new_title')} — GovVoice Rwanda`);

  useEffect(() => {
    let active = true;
    Promise.all([locationService.getProvinces(), locationService.getCategories()])
      .then(([provinceData, categoryData]) => {
        if (!active) return;
        setProvinces(provinceData);
        setCategories(categoryData);
      })
      .catch(() => {
        if (active) setMetaError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.provinceId) {
      setDistricts([]);
      return undefined;
    }
    let active = true;
    setLoadingDistricts(true);
    locationService
      .getDistricts(form.provinceId)
      .then((data) => {
        if (active) setDistricts(data);
      })
      .catch(() => {
        if (active) setMetaError(true);
      })
      .finally(() => {
        if (active) setLoadingDistricts(false);
      });
    return () => {
      active = false;
    };
  }, [form.provinceId]);

  useEffect(() => {
    if (!form.districtId) {
      setSectors([]);
      return undefined;
    }
    let active = true;
    setLoadingSectors(true);
    locationService
      .getSectors(form.districtId)
      .then((data) => {
        if (active) setSectors(data);
      })
      .catch(() => {
        if (active) setMetaError(true);
      })
      .finally(() => {
        if (active) setLoadingSectors(false);
      });
    return () => {
      active = false;
    };
  }, [form.districtId]);

  const steps = [
    t('submission.new_title'),
    t('auth.step_location'),
    t('submission.review_title')
  ];

  const update = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError('');
  };

  const updateLocation = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => {
      if (field === 'provinceId') {
        return { ...current, provinceId: value, districtId: '', sectorId: '' };
      }
      if (field === 'districtId') {
        return { ...current, districtId: value, sectorId: '' };
      }
      return { ...current, [field]: value };
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (field === 'provinceId') {
      setDistricts([]);
      setSectors([]);
    }
    if (field === 'districtId') setSectors([]);
  };

  const scrollToCard = () => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const next = () => {
    const nextErrors = validateSubmissionStep(step, { ...form, attachments }, t);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    if (step === 2 && attachments.some((file) => file.status === 'uploading')) {
      setError(t('submission.uploading'));
      return;
    }
    setStep((current) => Math.min(current + 1, 2));
    setErrors({});
    scrollToCard();
  };

  const back = () => {
    setStep((current) => Math.max(current - 1, 0));
    setErrors({});
    scrollToCard();
  };

  const patchAttachment = (id, changes) => {
    setAttachments((current) =>
      current.map((file) => (file.id === id ? { ...file, ...changes } : file))
    );
  };

  const handleFilesSelected = (files) => {
    const room = Math.max(0, 5 - attachments.length);
    files.slice(0, room).forEach((file, index) => {
      const tempId = `upload-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
      const item = {
        id: tempId,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        status: 'uploading',
        progress: 0
      };
      setAttachments((current) => [...current, item]);

      attachmentService
        .upload(file, (progress) => patchAttachment(tempId, { progress }))
        .then((attachment) => {
          setAttachments((current) =>
            current.map((entry) =>
              entry.id === tempId
                ? {
                    ...entry,
                    id: attachment.id,
                    name: attachment.originalName,
                    size: attachment.sizeBytes,
                    mimeType: attachment.mimeType,
                    status: 'done',
                    progress: 100
                  }
                : entry
            )
          );
        })
        .catch((uploadError) => {
          patchAttachment(tempId, { status: 'error' });
          toast.error(t('common.error'), getErrorMessage(uploadError, t));
        });
    });
  };

  const removeAttachment = async (file) => {
    if (file.status === 'uploading') return;
    if (file.status === 'done' && file.id) {
      try {
        await attachmentService.remove(file.id);
      } catch {
        // The pending file will expire; remove it from the form regardless.
      }
    }
    setAttachments((current) => current.filter((entry) => entry.id !== file.id));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step !== 2) {
      next();
      return;
    }

    const nextErrors = validateSubmissionStep(2, { ...form, attachments }, t);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    if (attachments.some((file) => file.status === 'uploading')) {
      setError(t('submission.uploading'));
      return;
    }
    if (attachments.some((file) => file.status === 'error')) {
      setError(t('errors.attachment_invalid'));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const submission = await submissionService.create({
        type: form.type,
        visibility: form.visibility,
        categoryId: form.categoryId,
        provinceId: form.provinceId,
        districtId: form.districtId,
        sectorId: form.sectorId,
        subject: form.subject.trim(),
        description: form.description.trim(),
        dateOccurred: form.dateOccurred,
        language: i18n.language,
        attachmentIds: attachments.map((file) => file.id)
      });
      setCreated(submission);
      toast.success(t('submission.success_title'), t('submission.success_body'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submitError) {
      setError(getErrorMessage(submitError, t));
      const details = getFieldErrors(submitError);
      if (details && Object.keys(details).length) {
        setErrors((current) => ({ ...current, ...details }));
        const earliest = Math.min(
          ...Object.keys(details).map((field) => FIELD_STEPS[field] ?? 0)
        );
        setStep(earliest);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ ...initialForm, subject: '', description: '', dateOccurred: todayISO() });
    setAttachments([]);
    setErrors({});
    setError('');
    setCreated(null);
    setStep(0);
  };

  if (created) {
    return (
      <section className="py-12 sm:py-16">
        <div className="container-page max-w-2xl">
          <div className="card overflow-hidden text-center">
            <div className="border-b border-ink/10 bg-gradient-to-b from-rwanda-green-soft to-white px-6 py-10">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rwanda-green text-white shadow-glow">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <h1 className="mt-5 text-2xl font-extrabold text-ink sm:text-3xl">
                {t('submission.success_title')}
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
                {t('submission.success_body')}
              </p>
            </div>
            <div className="px-6 py-7">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                {t('submission.tracking_number')}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-rwanda-blue/40 bg-rwanda-blue-soft/50 px-4 py-3">
                <span className="font-mono text-lg font-bold tracking-wide text-rwanda-blue-dark">
                  {created.trackingNumber}
                </span>
                <CopyButton value={created.trackingNumber} />
              </div>
              <p className="mt-2 text-xs text-ink-muted">{t('submission.tracking_hint')}</p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Link to="/dashboard">
                  <Button variant="secondary" fullWidth>
                    {t('submission.go_dashboard')}
                  </Button>
                </Link>
                <Link to={`/track?number=${encodeURIComponent(created.trackingNumber)}`}>
                  <Button fullWidth iconRight={ArrowRight}>
                    {t('submission.go_track')}
                  </Button>
                </Link>
              </div>
              <Button variant="ghost" fullWidth className="mt-2" onClick={resetForm}>
                {t('submission.submit_another')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const selectedCategory = categories.find((category) => category.id === form.categoryId);
  const selectedProvince = provinces.find((province) => province.id === form.provinceId);
  const selectedDistrict = districts.find((district) => district.id === form.districtId);
  const selectedSector = sectors.find((sector) => sector.id === form.sectorId);
  const locationLabel = [selectedDistrict, selectedSector, selectedProvince]
    .filter(Boolean)
    .map((item) => localizedName(item, i18n.language))
    .join(', ');

  return (
    <section className="py-8 sm:py-10">
      <div className="container-page">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">{t('nav.submit')}</p>
              <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
                {t('submission.new_title')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t('submission.new_subtitle')}
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('dashboard.title')}
            </Link>
          </div>

          <div
            ref={cardRef}
            className="mt-6 scroll-mt-24 overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card"
          >
            <div className="border-b border-ink/10 bg-ink/[0.015] px-5 py-4 sm:px-7">
              <StepIndicator steps={steps} current={step} onStepClick={setStep} />
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-7" noValidate>
              {error ? (
                <Alert variant="error" className="mb-5">
                  {error}
                </Alert>
              ) : null}
              {metaError ? (
                <Alert variant="warning" className="mb-5">
                  {t('errors.network')}
                </Alert>
              ) : null}

              {step === 0 ? (
                <div className="animate-fade-up space-y-6">
                  <div>
                    <p className="label">{t('submission.type_question')}</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {TYPE_CARDS.map((card) => {
                        const Icon = card.icon;
                        const active = form.type === card.value;
                        return (
                          <button
                            key={card.value}
                            type="button"
                            onClick={() => {
                              setForm((current) => ({ ...current, type: card.value }));
                              setErrors((current) => ({ ...current, type: undefined }));
                            }}
                            className={cn(
                              'rounded-2xl border-2 p-4 text-left transition',
                              active
                                ? `${card.active} ring-4`
                                : 'border-ink/10 hover:border-ink/25 hover:bg-ink/[0.02]'
                            )}
                            aria-pressed={active}
                          >
                            <span
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-xl border',
                                card.tone
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <p className="mt-3 text-sm font-bold text-ink">
                              {t(`submission.type_${card.value}`)}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                              {t(`submission.type_${card.value}_desc`)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    {errors.type ? (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{errors.type}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      label={t('submission.category')}
                      value={form.categoryId}
                      onChange={update('categoryId')}
                      error={errors.categoryId}
                      placeholder={t('submission.select_category')}
                      required
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {localizedName(category, i18n.language)}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label={t('submission.date_occurred')}
                      type="date"
                      value={form.dateOccurred}
                      onChange={update('dateOccurred')}
                      error={errors.dateOccurred}
                      max={todayISO()}
                      hint={t('submission.date_hint')}
                      required
                    />
                  </div>

                  <Input
                    label={t('submission.subject')}
                    placeholder={t('submission.subject_placeholder')}
                    value={form.subject}
                    onChange={update('subject')}
                    error={errors.subject}
                    maxLength={200}
                    required
                  />

                  <Textarea
                    label={t('submission.description')}
                    placeholder={t('submission.description_placeholder')}
                    value={form.description}
                    onChange={update('description')}
                    error={errors.description}
                    rows={7}
                    maxLength={5000}
                    required
                  />

                  {selectedCategory ? (
                    <div className="rounded-xl bg-rwanda-blue-soft/50 px-4 py-3 text-xs leading-relaxed text-rwanda-blue-dark">
                      <span className="font-bold">{t('submission.category')}: </span>
                      {selectedCategory.description_rw
                        ? localizedName(selectedCategory, i18n.language, 'description')
                        : localizedName(selectedCategory, i18n.language)}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === 1 ? (
                <div className="animate-fade-up space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      label={t('auth.province')}
                      value={form.provinceId}
                      onChange={updateLocation('provinceId')}
                      error={errors.provinceId}
                      placeholder={t('auth.select_province')}
                      required
                    >
                      {provinces.map((province) => (
                        <option key={province.id} value={province.id}>
                          {localizedName(province, i18n.language)}
                        </option>
                      ))}
                    </Select>
                    <Select
                      label={t('auth.district')}
                      value={form.districtId}
                      onChange={updateLocation('districtId')}
                      error={errors.districtId}
                      placeholder={
                        loadingDistricts ? t('common.loading') : t('auth.select_district')
                      }
                      disabled={!form.provinceId || loadingDistricts}
                      required
                    >
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {localizedName(district, i18n.language)}
                        </option>
                      ))}
                    </Select>
                    <Select
                      containerClassName="sm:col-span-2"
                      label={t('auth.sector')}
                      value={form.sectorId}
                      onChange={updateLocation('sectorId')}
                      error={errors.sectorId}
                      placeholder={
                        loadingSectors ? t('common.loading') : t('auth.select_sector')
                      }
                      disabled={!form.districtId || loadingSectors}
                      required
                    >
                      {sectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {localizedName(sector, i18n.language)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <p className="label">{t('submission.visibility_question')}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          value: 'public',
                          icon: Globe2,
                          label: t('submission.visibility_public'),
                          desc: t('submission.visibility_public_desc')
                        },
                        {
                          value: 'private',
                          icon: Lock,
                          label: t('submission.visibility_private'),
                          desc: t('submission.visibility_private_desc')
                        }
                      ].map((option) => {
                        const Icon = option.icon;
                        const active = form.visibility === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                visibility: option.value
                              }))
                            }
                            className={cn(
                              'rounded-2xl border-2 p-4 text-left transition',
                              active
                                ? 'border-rwanda-green bg-rwanda-green-soft/60 ring-4 ring-rwanda-green/10'
                                : 'border-ink/10 hover:border-ink/25 hover:bg-ink/[0.02]'
                            )}
                            aria-pressed={active}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-lg',
                                  active
                                    ? 'bg-rwanda-green text-white'
                                    : 'bg-ink/5 text-ink-muted'
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              <p className="text-sm font-bold text-ink">{option.label}</p>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                              {option.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                      {t('submission.visibility_note')}
                    </p>
                  </div>

                  {locationLabel ? (
                    <p className="flex items-start gap-2 rounded-xl bg-ink/[0.03] px-4 py-3 text-xs text-ink-soft">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rwanda-blue" />
                      {locationLabel}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="animate-fade-up space-y-6">
                  <div>
                    <p className="label">{t('submission.upload_label')}</p>
                    <FileUploader
                      files={attachments}
                      onFilesSelected={handleFilesSelected}
                      onRemove={removeAttachment}
                      maxFiles={5}
                    />
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-ink/10">
                    <div className="border-b border-ink/10 bg-ink/[0.02] px-4 py-3">
                      <p className="text-sm font-bold text-ink">{t('submission.review_title')}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {t('submission.review_subtitle')}
                      </p>
                    </div>
                    <dl className="divide-y divide-ink/5 px-4">
                      {[
                        { label: t('submission.review_type'), value: t(`submission.type_${form.type}`) },
                        {
                          label: t('submission.category'),
                          value: localizedName(selectedCategory, i18n.language)
                        },
                        { label: t('submission.subject'), value: form.subject },
                        {
                          label: t('submission.date_occurred'),
                          value: formatDate(form.dateOccurred, i18n.language)
                        },
                        { label: t('track.location_label'), value: locationLabel },
                        {
                          label: t('submission.review_visibility'),
                          value: t(`submission.visibility_${form.visibility}`)
                        },
                        {
                          label: t('submission.review_attachments'),
                          value: attachments.length
                            ? attachments.map((file) => file.name).join(', ')
                            : t('submission.no_attachments')
                        }
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4"
                        >
                          <dt className="w-full shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-muted sm:w-40">
                            {row.label}
                          </dt>
                          <dd className="min-w-0 text-sm font-medium text-ink">{row.value}</dd>
                        </div>
                      ))}
                      <div className="py-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          {t('submission.description')}
                        </dt>
                        <dd className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                          {form.description}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-rwanda-green" />
                    {t('submission.privacy_commitment')}
                  </p>
                  <p className="text-xs text-ink-muted">{t('submission.draft_note')}</p>
                </div>
              ) : null}

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-5">
                {step > 0 ? (
                  <Button variant="secondary" icon={ArrowLeft} onClick={back}>
                    {t('common.back')}
                  </Button>
                ) : (
                  <Link to="/dashboard" className="text-sm font-semibold text-ink-muted hover:text-ink">
                    {t('common.cancel')}
                  </Link>
                )}

                {step < 2 ? (
                  <Button iconRight={ArrowRight} onClick={next}>
                    {t('common.next')}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="green"
                    size="lg"
                    icon={Send}
                    loading={submitting}
                    disabled={attachments.some((file) => file.status === 'uploading')}
                  >
                    {t('submission.review_confirm')}
                  </Button>
                )}
              </div>
            </form>
          </div>

          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-ink-muted">
            <Paperclip className="h-3.5 w-3.5" />
            {t('submission.upload_hint')}
          </p>
        </div>
      </div>
    </section>
  );
}
