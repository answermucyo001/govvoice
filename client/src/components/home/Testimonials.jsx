import { useTranslation } from 'react-i18next';
import { Quote, Star } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const TESTIMONIALS = [
  { key: 1, initials: 'AU', tone: 'bg-rwanda-blue-soft text-rwanda-blue-dark' },
  { key: 2, initials: 'JM', tone: 'bg-rwanda-green-soft text-rwanda-green-dark' },
  { key: 3, initials: 'CM', tone: 'bg-rwanda-yellow-soft text-[#7d6900]' }
];

export default function Testimonials() {
  const { t } = useTranslation();

  return (
    <section className="py-16 sm:py-20">
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow={t('public.title')}
          title={t('home.testimonials_title')}
          subtitle={t('home.testimonials_subtitle')}
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <figure key={item.key} className="card relative flex flex-col p-6">
              <Quote className="h-8 w-8 text-rwanda-blue/20" />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                “{t(`home.testimonial_${item.key}_quote`)}”
              </blockquote>
              <div className="mt-5 flex items-center gap-3 border-t border-ink/5 pt-4">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${item.tone}`}
                >
                  {item.initials}
                </span>
                <figcaption>
                  <p className="text-sm font-bold text-ink">
                    {t(`home.testimonial_${item.key}_name`)}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {t(`home.testimonial_${item.key}_role`)}
                  </p>
                </figcaption>
                <span className="ml-auto flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </span>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
