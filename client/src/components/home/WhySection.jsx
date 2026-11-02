import { useTranslation } from 'react-i18next';
import { BellRing, EyeOff, Route, Target } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const FEATURES = [
  { key: 1, icon: Target, tone: 'bg-rwanda-blue-soft text-rwanda-blue-dark' },
  { key: 2, icon: Route, tone: 'bg-rwanda-green-soft text-rwanda-green-dark' },
  { key: 3, icon: EyeOff, tone: 'bg-rwanda-yellow-soft text-[#8a7400]' },
  { key: 4, icon: BellRing, tone: 'bg-red-50 text-red-600' }
];

export default function WhySection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 sm:py-20">
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow={t('common.rwanda')}
          title={t('home.why_title')}
          subtitle={t('home.why_subtitle')}
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="card group p-6 transition duration-200 hover:-translate-y-1 hover:shadow-soft"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.tone}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-ink">{t(`home.why_${feature.key}`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {t(`home.why_${feature.key}_desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
