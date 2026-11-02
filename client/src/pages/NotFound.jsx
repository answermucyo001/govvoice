import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, Home, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFound() {
  const { t } = useTranslation();

  useDocumentTitle(`${t('notFound.title')} — GovVoice Rwanda`);

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
      <div className="container-page relative">
        <div className="mx-auto max-w-xl text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rwanda-blue-soft text-rwanda-blue-dark">
            <Compass className="h-10 w-10" />
          </span>
          <p className="mt-6 font-display text-6xl font-extrabold tracking-tight text-ink/15 sm:text-7xl">
            404
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
            {t('notFound.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
            {t('notFound.body')}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link to="/">
              <Button icon={Home} variant="green">
                {t('notFound.button')}
              </Button>
            </Link>
            <Link to="/portal">
              <Button icon={Search} variant="secondary">
                {t('nav.portal')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
