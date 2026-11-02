import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, MessageSquarePlus } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { homeForRole } from '../../utils/status';

export default function CtaSection() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <section className="py-16 sm:py-20">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-rwanda-green-dark px-6 py-12 shadow-soft sm:px-12 sm:py-14">
          <div
            className="absolute inset-0 bg-grid opacity-[0.08]"
            aria-hidden="true"
          />
          <div
            className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-rwanda-blue/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-rwanda-yellow/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rwanda-yellow">
                <MessageSquarePlus className="h-3.5 w-3.5" />
                {t('home.hero_eyebrow')}
              </span>
              <h2 className="mt-5 text-balance text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                {t('home.cta_final')}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                {t('home.cta_final_subtitle')}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link to={user ? homeForRole(user.role) : '/register'}>
                <Button size="lg" variant="yellow" icon={ArrowRight}>
                  {user ? t('nav.dashboard') : t('home.cta_final_button')}
                </Button>
              </Link>
              <Link to={user ? '/submit' : '/track'}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15"
                >
                  {user ? t('nav.submit') : t('nav.track')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
