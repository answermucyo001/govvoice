import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Languages,
  ShieldCheck,
  UsersRound
} from 'lucide-react';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden border-b border-ink/5 bg-gradient-to-b from-rwanda-blue-soft/80 via-cream to-cream">
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
      <div
        className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-rwanda-blue/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-rwanda-yellow/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-page relative grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-24">
        <div className="animate-fade-up">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">
              <span className="flex h-3.5 w-5 overflow-hidden rounded-[2px] ring-1 ring-black/5">
                <span className="h-full w-1/2 bg-rwanda-blue" />
                <span className="flex h-full w-1/2 flex-col">
                  <span className="h-1/2 bg-rwanda-yellow" />
                  <span className="h-1/2 bg-rwanda-green" />
                </span>
              </span>
              {t('home.hero_eyebrow')}
            </span>
          </div>

          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
            {t('home.hero_title')}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            {t('home.hero_subtitle')}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/submit">
              <Button size="lg" icon={ArrowRight} variant="green">
                {t('home.cta_submit')}
              </Button>
            </Link>
            <Link to="/#how">
              <Button size="lg" variant="secondary">
                {t('home.cta_how')}
              </Button>
            </Link>
          </div>

          <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-rwanda-green" />
              {t('common.secure')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-rwanda-blue" />
              {t('footer.languages')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UsersRound className="h-4 w-4 text-rwanda-yellow" />
              {t('home.hero_note')}
            </span>
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-ink/10 pt-6">
            <div className="flex -space-x-2">
              {[
                { initials: 'AU', tone: 'bg-rwanda-blue text-white' },
                { initials: 'JM', tone: 'bg-rwanda-green text-white' },
                { initials: 'CM', tone: 'bg-rwanda-yellow text-ink' }
              ].map((person) => (
                <span
                  key={person.initials}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-cream text-[10px] font-bold ${person.tone}`}
                >
                  {person.initials}
                </span>
              ))}
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-cream bg-white text-[10px] font-bold text-ink-muted">
                +
              </span>
            </div>
            <p className="text-sm font-medium text-ink-soft">{t('home.trusted')}</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            className="absolute inset-6 rotate-3 rounded-[2rem] bg-rwanda-green/10"
            aria-hidden="true"
          />
          <div
            className="absolute inset-6 -rotate-3 rounded-[2rem] bg-rwanda-yellow/20"
            aria-hidden="true"
          />

          <div className="card relative overflow-hidden rounded-[1.75rem]">
            <div className="bg-rwanda-green-dark px-5 py-5 text-white sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">{t('home.hero_card_title')}</p>
                  <p className="mt-1 text-xs text-white/65">{t('home.hero_card_subtitle')}</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck className="h-5 w-5 text-rwanda-yellow" />
                </span>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    {t('home.hero_card_tracking')}
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-ink">CFCS-2026-01-K7M2QX</p>
                </div>
                <StatusBadge status="under_review" />
              </div>

              <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-3.5">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-rwanda-blue ring-4 ring-rwanda-blue/15" />
                  <div>
                    <p className="text-xs font-bold text-ink">{t('home.hero_card_office')}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      {t('home.hero_card_update')}
                    </p>
                  </div>
                </div>
                <div className="ml-[4.5px] mt-3 space-y-2.5 border-l border-dashed border-ink/15 pl-4">
                  {['status.received', 'status.assigned', 'status.under_review'].map(
                    (key, index) => (
                      <div key={key} className="flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            index === 2 ? 'bg-rwanda-yellow' : 'bg-rwanda-green'
                          }`}
                        />
                        <span className="text-[11px] font-medium text-ink-soft">{t(key)}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-ink/5 pt-4">
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <CalendarClock className="h-4 w-4 text-rwanda-blue" />
                  {t('home.hero_card_deadline')}
                </div>
                <span className="rounded-full bg-rwanda-green-soft px-2.5 py-1 text-[11px] font-bold text-rwanda-green-dark">
                  {t('home.hero_card_deadline_value')}
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 right-2 hidden w-60 animate-float rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:block lg:-right-6">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">{t('home.hero_float_title')}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  {t('home.hero_float_body')}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -top-4 -left-3 hidden items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[11px] font-bold text-rwanda-green-dark shadow-card sm:flex">
            <BadgeCheck className="h-3.5 w-3.5 text-rwanda-green" />
            {t('status.resolved')}
          </div>
        </div>
      </div>
    </section>
  );
}
