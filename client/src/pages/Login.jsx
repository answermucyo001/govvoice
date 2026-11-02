import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import LanguageSwitcher from '../components/layout/LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import { validateLogin } from '../utils/validation';
import { homeForRole } from '../utils/status';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Login() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useDocumentTitle(`${t('nav.login')} — GovVoice Rwanda`);

  if (user) {
    return <Navigate to={user.mustChangePassword ? '/profile' : homeForRole(user.role)} replace />;
  }

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateLogin(form, t);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const loggedIn = await login({
        identifier: form.identifier.trim(),
        password: form.password
      });
      toast.success(t('auth.login_success', { name: loggedIn.firstName }));
      if (loggedIn.mustChangePassword) {
        navigate('/profile', { replace: true });
        return;
      }
      const from = location.state?.from;
      const target =
        from && from.pathname && !['/login', '/register'].includes(from.pathname)
          ? `${from.pathname}${from.search || ''}${from.hash || ''}`
          : homeForRole(loggedIn.role);
      navigate(target, { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden py-10 sm:py-14 lg:py-20">
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden="true" />
      <div
        className="absolute -right-32 top-0 h-80 w-80 rounded-full bg-rwanda-blue/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="container-page relative">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden overflow-hidden bg-rwanda-green-dark p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden="true" />
            <div
              className="absolute -right-20 top-1/4 h-60 w-60 rounded-full bg-rwanda-blue/25 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rwanda-yellow">
                <Sparkles className="h-3.5 w-3.5" />
                {t('auth.welcome_back')}
              </span>
              <h2 className="mt-6 font-display text-3xl font-extrabold leading-tight">
                {t('auth.have_voice')}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                {t('auth.have_voice_body')}
              </p>
            </div>

            <blockquote className="relative mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm leading-relaxed text-white/80">{t('auth.testimonial')}</p>
              <footer className="mt-3 text-xs font-bold text-rwanda-yellow">
                {t('auth.testimonial_name')}
              </footer>
            </blockquote>

            <div className="relative mt-8 flex items-center gap-2 text-xs text-white/55">
              <ShieldCheck className="h-4 w-4 text-rwanda-yellow" />
              {t('auth.secure_note')}
            </div>
          </div>

          <div className="p-6 sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{t('nav.login')}</p>
                <h1 className="mt-4 text-2xl font-extrabold text-ink sm:text-3xl">
                  {t('auth.welcome_back')}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {t('auth.login_subtitle')}
                </p>
              </div>
              <LanguageSwitcher className="hidden sm:inline-flex" />
            </div>

            {error ? (
              <Alert variant="error" className="mt-6">
                {error}
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <Input
                label={t('auth.identifier')}
                placeholder={t('auth.identifier_placeholder')}
                icon={Mail}
                autoComplete="username"
                value={form.identifier}
                onChange={update('identifier')}
                error={errors.identifier}
                required
              />
              <Input
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={LockKeyhole}
                autoComplete="current-password"
                value={form.password}
                onChange={update('password')}
                error={errors.password}
                required
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-ink/5 hover:text-ink"
                    aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <p className="text-xs leading-relaxed text-ink-muted">{t('auth.forgot')}</p>

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={loading}
                iconRight={ArrowRight}
              >
                {loading ? t('auth.signing_in') : t('auth.login_button')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-muted">
              {t('auth.no_account')}{' '}
              <Link to="/register" state={location.state} className="link">
                {t('nav.register')}
              </Link>
            </p>

            <p className="mt-6 border-t border-ink/5 pt-4 text-center text-[11px] leading-relaxed text-ink-muted">
              {t('auth.terms_note')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
