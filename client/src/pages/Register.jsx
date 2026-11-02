import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import StepIndicator from '../components/ui/StepIndicator';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import locationService from '../services/location.service';
import {
  getErrorMessage,
  getFieldErrors
} from '../utils/errors';
import {
  passwordStrength,
  validateRegisterStep
} from '../utils/validation';
import { localizedName } from '../utils/format';
import useDocumentTitle from '../hooks/useDocumentTitle';

const STEP_FIELDS = {
  firstName: 0,
  lastName: 0,
  nationalId: 0,
  email: 0,
  phone: 0,
  provinceId: 1,
  districtId: 1,
  sectorId: 1,
  addressLine: 1,
  password: 2,
  confirmPassword: 2
};

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  nationalId: '',
  email: '',
  phone: '',
  provinceId: '',
  districtId: '',
  sectorId: '',
  addressLine: '',
  password: '',
  confirmPassword: '',
  consent: false
};

export default function Register() {
  const { t, i18n } = useTranslation();
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [legal, setLegal] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [locationsError, setLocationsError] = useState(false);

  useDocumentTitle(`${t('auth.create_account')} — GovVoice Rwanda`);

  useEffect(() => {
    let active = true;
    locationService
      .getProvinces()
      .then((data) => {
        if (active) setProvinces(data);
      })
      .catch(() => {
        if (active) setLocationsError(true);
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
        if (active) setLocationsError(true);
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
        if (active) setLocationsError(true);
      })
      .finally(() => {
        if (active) setLoadingSectors(false);
      });
    return () => {
      active = false;
    };
  }, [form.districtId]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const steps = [t('auth.step_identity'), t('auth.step_location'), t('auth.step_security')];

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
      setSectors([]);
      setDistricts([]);
    }
    if (field === 'districtId') setSectors([]);
  };

  const scrollToCard = () => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const next = () => {
    const nextErrors = validateRegisterStep(step, form, t);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateRegisterStep(2, form, t);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const created = await register({
        nationalId: form.nationalId.replace(/\s/g, ''),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        language: i18n.language,
        provinceId: form.provinceId,
        districtId: form.districtId,
        sectorId: form.sectorId,
        ...(form.addressLine.trim() ? { addressLine: form.addressLine.trim() } : {})
      });
      toast.success(t('auth.register_success'), created.firstName);
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError, t));
      const details = getFieldErrors(submitError);
      if (details && Object.keys(details).length) {
        setErrors((current) => ({ ...current, ...details }));
        const earliest = Math.min(
          ...Object.keys(details).map((field) => STEP_FIELDS[field] ?? 2)
        );
        setStep(earliest);
      }
    } finally {
      setLoading(false);
    }
  };

  const score = passwordStrength(form.password);
  const strengthLabels = [t('auth.weak'), t('auth.fair'), t('auth.good'), t('auth.strong')];
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500'];

  return (
    <section className="relative overflow-hidden py-10 sm:py-14">
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden="true" />
      <div className="container-page relative">
        <div
          ref={cardRef}
          className="mx-auto max-w-4xl scroll-mt-24 overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-soft"
        >
          <div className="relative overflow-hidden bg-rwanda-green-dark px-6 py-7 text-white sm:px-8">
            <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden="true" />
            <div
              className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-rwanda-blue/25 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rwanda-yellow">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('nav.register')}
              </span>
              <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
                {t('auth.create_account')}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
                {t('auth.register_subtitle')}
              </p>
            </div>
          </div>

          <div className="border-b border-ink/10 bg-ink/[0.015] px-6 py-4 sm:px-8">
            <StepIndicator steps={steps} current={step} onStepClick={setStep} />
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8" noValidate>
            {error ? (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            ) : null}
            {locationsError ? (
              <Alert variant="warning" className="mb-6">
                {t('errors.network')}
              </Alert>
            ) : null}

            {step === 0 ? (
              <div className="animate-fade-up">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t('auth.first_name')}
                    icon={UserRound}
                    value={form.firstName}
                    onChange={update('firstName')}
                    error={errors.firstName}
                    autoComplete="given-name"
                    required
                  />
                  <Input
                    label={t('auth.last_name')}
                    icon={UserRound}
                    value={form.lastName}
                    onChange={update('lastName')}
                    error={errors.lastName}
                    autoComplete="family-name"
                    required
                  />
                  <Input
                    containerClassName="sm:col-span-2"
                    label={t('auth.national_id')}
                    icon={Fingerprint}
                    value={form.nationalId}
                    onChange={update('nationalId')}
                    error={errors.nationalId}
                    hint={t('auth.national_id_hint')}
                    inputMode="numeric"
                    maxLength={16}
                    required
                  />
                  <Input
                    label={t('auth.email')}
                    type="email"
                    icon={Mail}
                    value={form.email}
                    onChange={update('email')}
                    error={errors.email}
                    autoComplete="email"
                    required
                  />
                  <Input
                    label={t('auth.phone')}
                    type="tel"
                    icon={Phone}
                    placeholder="07XX XXX XXX"
                    value={form.phone}
                    onChange={update('phone')}
                    error={errors.phone}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="animate-fade-up">
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
                  <Input
                    label={t('auth.address')}
                    placeholder={t('auth.address_optional')}
                    icon={MapPin}
                    value={form.addressLine}
                    onChange={update('addressLine')}
                    error={errors.addressLine}
                    autoComplete="street-address"
                  />
                </div>
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-rwanda-blue-soft/60 px-4 py-3 text-xs leading-relaxed text-ink-soft">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rwanda-blue-dark" />
                  {t('home.step_1_desc')}
                </p>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="animate-fade-up space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t('auth.password')}
                    type={showPassword ? 'text' : 'password'}
                    icon={LockKeyhole}
                    value={form.password}
                    onChange={update('password')}
                    error={errors.password}
                    autoComplete="new-password"
                    required
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-ink/5 hover:text-ink"
                        aria-label={
                          showPassword ? t('auth.hide_password') : t('auth.show_password')
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />
                  <Input
                    label={t('auth.confirm_password')}
                    type={showPassword ? 'text' : 'password'}
                    icon={LockKeyhole}
                    value={form.confirmPassword}
                    onChange={update('confirmPassword')}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                    required
                  />
                </div>

                {form.password ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-ink-muted">{t('auth.password_strength')}</span>
                      <span
                        className={
                          score <= 1
                            ? 'text-red-600'
                            : score === 2
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                        }
                      >
                        {strengthLabels[Math.max(0, Math.min(score - 1, 3))]}
                      </span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map((bar) => (
                        <span
                          key={bar}
                          className={`h-1.5 rounded-full ${
                            bar <= score
                              ? strengthColors[Math.min(bar - 1, 3)]
                              : 'bg-ink/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <p className="text-xs leading-relaxed text-ink-muted">
                  {t('auth.password_hint')}
                </p>

                <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          consent: event.target.checked
                        }));
                        setErrors((current) => ({ ...current, consent: undefined }));
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink/30 text-rwanda-green accent-rwanda-green"
                    />
                    <span className="text-xs leading-relaxed text-ink-soft">
                      {t('auth.consent')}{' '}
                      <button
                        type="button"
                        onClick={() => setLegal('terms')}
                        className="link text-xs"
                      >
                        {t('auth.terms_link')}
                      </button>{' '}
                      ·{' '}
                      <button
                        type="button"
                        onClick={() => setLegal('privacy')}
                        className="link text-xs"
                      >
                        {t('auth.privacy_link')}
                      </button>
                    </span>
                  </label>
                  {errors.consent ? (
                    <p className="mt-2 text-xs font-medium text-red-600">{errors.consent}</p>
                  ) : null}
                </div>

                <p className="flex items-center gap-2 text-xs text-ink-muted">
                  <ShieldCheck className="h-4 w-4 text-rwanda-green" />
                  {t('auth.secure_note')}
                </p>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-5">
              {step > 0 ? (
                <Button variant="secondary" icon={ArrowLeft} onClick={back}>
                  {t('common.back')}
                </Button>
              ) : (
                <Link to="/login" className="text-sm font-semibold text-ink-muted hover:text-ink">
                  {t('auth.already')} <span className="link">{t('nav.login')}</span>
                </Link>
              )}

              {step < 2 ? (
                <Button iconRight={ArrowRight} onClick={next}>
                  {t('common.next')}
                </Button>
              ) : (
                <Button type="submit" size="lg" loading={loading}>
                  {loading ? t('auth.creating') : t('auth.register_button')}
                </Button>
              )}
            </div>
          </form>
        </div>

        <p className="mx-auto mt-5 max-w-4xl text-center text-xs text-ink-muted">
          {t('auth.have_account')}{' '}
          <Link to="/login" className="link">
            {t('nav.login')}
          </Link>
        </p>
      </div>

      <Modal
        open={Boolean(legal)}
        onClose={() => setLegal(null)}
        title={legal === 'terms' ? t('modal.terms_title') : t('modal.privacy_title')}
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          {legal === 'terms' ? t('modal.terms_body') : t('modal.privacy_body')}
        </p>
      </Modal>
    </section>
  );
}
