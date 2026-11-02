import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, PhoneCall, Plus } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const FAQS = [1, 2, 3, 4, 5];

export default function FaqSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(1);

  return (
    <section id="faq" className="scroll-mt-24 border-y border-ink/5 bg-white py-16 sm:py-20">
      <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow={t('nav.faq')}
            title={t('home.faq_title')}
            subtitle={t('home.faq_subtitle')}
          />
          <div className="mt-8 rounded-2xl border border-rwanda-blue/15 bg-rwanda-blue-soft/60 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rwanda-blue-dark shadow-sm">
              <PhoneCall className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-ink">{t('footer.contact')}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {t('footer.contact_body')}
            </p>
            <p className="mt-2 font-display text-xl font-extrabold text-rwanda-green-dark">3030</p>
          </div>
        </div>

        <div className="space-y-3">
          {FAQS.map((key) => {
            const expanded = open === key;
            return (
              <div
                key={key}
                className={`overflow-hidden rounded-2xl border transition ${
                  expanded
                    ? 'border-rwanda-blue/30 bg-white shadow-card'
                    : 'border-ink/10 bg-white/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : key)}
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-bold text-ink">{t(`home.faq_q${key}`)}</span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                      expanded
                        ? 'bg-rwanda-blue text-white'
                        : 'bg-ink/5 text-ink-muted'
                    }`}
                  >
                    {expanded ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </span>
                </button>
                {expanded ? (
                  <p className="animate-fade-up px-5 pb-5 text-sm leading-relaxed text-ink-soft">
                    {t(`home.faq_a${key}`)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
