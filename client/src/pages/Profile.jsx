import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Languages,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Avatar from '../components/ui/Avatar';
import InfoRow from '../components/ui/InfoRow';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/auth.service';
import {
  getErrorMessage,
  applyServerFieldErrors
} from '../utils/errors';
import {
  validateProfile,
  validateChangePassword,
  normalizePhone
} from '../utils/validation';
import { formatDate, localizedName } from '../utils/format';
import useDocumentTitle from '../hooks/useDocumentTitle';

const LANGUAGES = [
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' }
];

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    phone: user?.phone || '',
    addressLine: user?.addressLine || '',
    language: user?.language || i18n.language
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  useDocumentTitle(`${t('dashboard.profile')} — GovVoice Rwanda`);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      phone: user.phone || '',
      addressLine: user.addressLine || '',
      language: user.language || i18n.language
    });
  }, [user, i18n.language]);

  if (!user) return null;

  const roleLabel =
    user.role === 'super_admin'
      ? t('nav.super_admin')
      : user.role === 'district_head' || user.role === 'sector_head'
        ? t('nav.admin')
        : t('common.account');

  const location = [user.province, user.district, user.sector]
    .filter(Boolean)
    .map((item) => localizedName(item, i18n.language))
    .join(', ');

  const saveProfile = async (event) => {
    event.preventDefault();
    const errors = validateProfile(profileForm, t);
    if (Object.keys(errors).length) {
      setProfileErrors(errors);
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    try {
      const updated = await updateProfile({
        phone: normalizePhone(profileForm.phone),
        language: profileForm.language,
        ...(profileForm.addressLine.trim()
          ? { addressLine: profileForm.addressLine.trim() }
          : {})
      });
      if (profileForm.language !== i18n.language) {
        i18n.changeLanguage(profileForm.language);
      }
      toast.success(t('common.save'), `${updated.firstName} ${updated.lastName}`);
    } catch (error) {
      setProfileError(getErrorMessage(error, t));
      applyServerFieldErrors(error, setProfileErrors);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    const errors = validateChangePassword(passwordForm, t);
    if (Object.keys(errors).length) {
      setPasswordErrors(errors);
      return;
    }

    setSavingPassword(true);
    setPasswordError('');
    try {
      await authService.changePassword(passwordForm);
      toast.success(t('auth.change_password'));
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      setPasswordError(getErrorMessage(error, t));
      applyServerFieldErrors(error, setPasswordErrors);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <section className="py-8 sm:py-10">
      <div className="container-page">
        <div>
          <p className="eyebrow">{t('common.account')}</p>
          <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
            {t('dashboard.profile')}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">{t('dashboard.privacy_tip')}</p>
        </div>

        {user.mustChangePassword ? (
          <Alert variant="warning" title={t('auth.change_password')} className="mt-6">
            {t('auth.password_hint')}
          </Alert>
        ) : null}

        <div className="mt-7 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="card overflow-hidden">
              <div className="border-b border-ink/10 bg-gradient-to-r from-rwanda-blue-soft to-rwanda-green-soft px-5 py-6 text-center">
                <Avatar
                  firstName={user.firstName}
                  lastName={user.lastName}
                  size="lg"
                  tone={user.role === 'citizen' ? 'green' : 'blue'}
                  className="mx-auto h-20 w-20 text-2xl"
                />
                <p className="mt-3 text-lg font-extrabold text-ink">
                  {user.firstName} {user.lastName}
                </p>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                  <ShieldCheck className="h-3 w-3 text-rwanda-green" />
                  {roleLabel}
                </span>
              </div>
              <dl className="divide-y divide-ink/5 px-5">
                <InfoRow label={t('auth.email')} value={user.email} />
                <InfoRow label={t('auth.phone')} value={user.phone || '—'} />
                <InfoRow label={t('auth.national_id')} value={user.nationalId} />
                {location ? <InfoRow label={t('dashboard.location_label')} value={location} /> : null}
                <InfoRow
                  label={t('dashboard.member_since')}
                  value={formatDate(user.createdAt, i18n.language)}
                />
              </dl>
            </div>
          </aside>

          <div className="space-y-6">
            <form onSubmit={saveProfile} className="card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-rwanda-blue" />
                <h2 className="text-base font-bold text-ink">{t('dashboard.profile')}</h2>
              </div>

              {profileError ? (
                <Alert variant="error" className="mt-4">
                  {profileError}
                </Alert>
              ) : null}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input
                  label={t('auth.first_name')}
                  icon={UserRound}
                  value={user.firstName}
                  disabled
                  hint={t('common.required')}
                />
                <Input
                  label={t('auth.last_name')}
                  icon={UserRound}
                  value={user.lastName}
                  disabled
                />
                <Input
                  label={t('auth.email')}
                  icon={Mail}
                  value={user.email}
                  disabled
                  containerClassName="sm:col-span-2"
                />
                <Input
                  label={t('auth.national_id')}
                  icon={Fingerprint}
                  value={user.nationalId}
                  disabled
                  containerClassName="sm:col-span-2"
                />
                <Input
                  label={t('auth.phone')}
                  icon={Phone}
                  value={profileForm.phone}
                  onChange={(event) => {
                    setProfileForm((current) => ({ ...current, phone: event.target.value }));
                    setProfileErrors((current) => ({ ...current, phone: undefined }));
                    setProfileError('');
                  }}
                  error={profileErrors.phone}
                  autoComplete="tel"
                  required
                />
                <Select
                  label={t('common.language')}
                  value={profileForm.language}
                  onChange={(event) => {
                    setProfileForm((current) => ({ ...current, language: event.target.value }));
                    setProfileError('');
                  }}
                  error={profileErrors.language}
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </Select>
                <Input
                  containerClassName="sm:col-span-2"
                  label={t('auth.address')}
                  placeholder={t('auth.address_optional')}
                  icon={MapPin}
                  value={profileForm.addressLine}
                  onChange={(event) => {
                    setProfileForm((current) => ({ ...current, addressLine: event.target.value }));
                    setProfileError('');
                  }}
                  error={profileErrors.addressLine}
                  autoComplete="street-address"
                />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
                <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <Languages className="h-3.5 w-3.5" />
                  {t('footer.languages')}
                </p>
                <Button type="submit" icon={Save} loading={savingProfile}>
                  {t('common.save')}
                </Button>
              </div>
            </form>

            <form onSubmit={savePassword} className="card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-rwanda-blue" />
                <h2 className="text-base font-bold text-ink">{t('auth.change_password')}</h2>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                {t('auth.password_hint')}
              </p>

              {passwordError ? (
                <Alert variant="error" className="mt-4">
                  {passwordError}
                </Alert>
              ) : null}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input
                  containerClassName="sm:col-span-2"
                  label={t('auth.current_password')}
                  type={showPasswords ? 'text' : 'password'}
                  icon={LockKeyhole}
                  value={passwordForm.currentPassword}
                  onChange={(event) => {
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value
                    }));
                    setPasswordErrors((current) => ({
                      ...current,
                      currentPassword: undefined
                    }));
                  }}
                  error={passwordErrors.currentPassword}
                  autoComplete="current-password"
                  required
                />
                <Input
                  label={t('auth.new_password')}
                  type={showPasswords ? 'text' : 'password'}
                  icon={KeyRound}
                  value={passwordForm.newPassword}
                  onChange={(event) => {
                    setPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value
                    }));
                    setPasswordErrors((current) => ({ ...current, newPassword: undefined }));
                  }}
                  error={passwordErrors.newPassword}
                  autoComplete="new-password"
                  required
                />
                <Input
                  label={t('auth.confirm_password')}
                  type={showPasswords ? 'text' : 'password'}
                  icon={KeyRound}
                  value={passwordForm.confirmPassword}
                  onChange={(event) => {
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value
                    }));
                    setPasswordErrors((current) => ({
                      ...current,
                      confirmPassword: undefined
                    }));
                  }}
                  error={passwordErrors.confirmPassword}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswords((visible) => !visible)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition hover:text-ink"
                >
                  {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showPasswords ? t('auth.hide_password') : t('auth.show_password')}
                </button>
                <Button type="submit" icon={KeyRound} loading={savingPassword}>
                  {t('auth.change_password')}
                </Button>
              </div>
            </form>

            <p className="flex items-start gap-2 rounded-xl bg-ink/[0.03] px-4 py-3 text-xs leading-relaxed text-ink-muted">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
              {t('auth.secure_note')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
