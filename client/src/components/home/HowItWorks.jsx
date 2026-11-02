import { useTranslation } from 'react-i18next';
import { ArrowRight, BadgeCheck, MessageSquarePlus, Radar, UserPlus } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const STEPS = [
  { key: 1, icon: UserPlus, tone: 'bg-rwanda-blue text-white' },
  { key: 2, icon: MessageSquarePlus, tone: 'bg-rwanda-yellow text-ink' },
  { key: 3, icon: Radar, tone: 'bg-rwanda-green text-white' },
  { key: 4, icon: BadgeCheck, tone: 'bg-ink text-rwanda-yellow' }
];

export default function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section id="how" className="scroll-mt-24 border-y border-ink/5 bg-white py-16 sm:py-20">
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow={t('nav.how')}
          title={t('home.how_title')}
          subtitle={t('home.how_subtitle')}
        />

        <div className="relative mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <div
            className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-gradient-to-r from-rwanda-blue/40 via-rwanda-yellow/50 to-rwanda-green/40 lg:block"
            aria-hidden="true"
          />
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="relative">
                <div className="relative z-10 flex items-center gap-4 lg:flex-col lg:items-start">
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-card ${step.tone}`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="hidden h-px flex-1 bg-ink/10 lg:hidden" />
                  <span className="text-xs font-extrabold tracking-widest text-ink-muted lg:mt-5">
                    {String(step.key).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink">{t(`home.step_${step.key}`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {t(`home.step_${step.key}_desc`)}
                </p>
                {index < STEPS.length - 1 ? (
                  <ArrowRight className="absolute -right-3 top-5 hidden h-5 w-5 text-ink/15 lg:block" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
