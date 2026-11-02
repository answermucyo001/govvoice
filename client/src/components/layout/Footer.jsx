import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, MessageSquareText, Phone, ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import Modal from '../ui/Modal';

export default function Footer() {
  const { t } = useTranslation();
  const [legal, setLegal] = useState(null);

  const quickLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/portal', label: t('nav.portal') },
    { to: '/track', label: t('nav.track') },
    { to: '/submit', label: t('nav.submit') }
  ];

  return (
    <footer id="contact" className="mt-auto">
      <div className="h-1 bg-flag-stripe" />
      <div className="bg-rwanda-green-dark text-white">
        <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="max-w-sm">
            <Logo variant="dark" />
            <p className="mt-5 text-sm leading-relaxed text-white/70">{t('footer.about')}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/75">
                <ShieldCheck className="h-3.5 w-3.5 text-rwanda-yellow" />
                {t('footer.secure')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/75">
                <MessageSquareText className="h-3.5 w-3.5 text-rwanda-blue" />
                {t('footer.feedback')}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-rwanda-yellow">
              {t('footer.quick_links')}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/70 transition hover:text-white hover:underline hover:underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-rwanda-yellow">
              {t('footer.support')}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-rwanda-blue" />
                <span>
                  <span className="block font-semibold text-white">3030</span>
                  {t('footer.contact_body')}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-rwanda-blue" />
                <span>support@govvoice.rw</span>
              </li>
              <li>
                <Link
                  to="/#faq"
                  className="text-white/70 transition hover:text-white hover:underline hover:underline-offset-4"
                >
                  {t('nav.faq')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-rwanda-yellow">
              {t('footer.languages')}
            </h3>
            <div className="mt-4">
              <LanguageSwitcher variant="dark" />
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setLegal('privacy')}
                  className="text-white/70 transition hover:text-white hover:underline hover:underline-offset-4"
                >
                  {t('footer.privacy')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegal('terms')}
                  className="text-white/70 transition hover:text-white hover:underline hover:underline-offset-4"
                >
                  {t('footer.terms')}
                </button>
              </li>
              <li className="flex items-center gap-1.5 text-white/50">
                <Lock className="h-3.5 w-3.5" />
                {t('footer.accessibility')}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-white/60">
              {t('footer.rights', { year: new Date().getFullYear() })}
            </p>
            <p className="text-xs text-white/50">{t('footer.ministry')}</p>
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(legal)}
        onClose={() => setLegal(null)}
        title={legal === 'terms' ? t('modal.terms_title') : t('modal.privacy_title')}
        size="md"
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          {legal === 'terms' ? t('modal.terms_body') : t('modal.privacy_body')}
        </p>
      </Modal>
    </footer>
  );
}
