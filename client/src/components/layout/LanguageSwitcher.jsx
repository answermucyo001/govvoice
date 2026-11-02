import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

const LANGUAGES = [
  { code: 'rw', label: 'RW', name: 'Kinyarwanda' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Français' }
];

export default function LanguageSwitcher({ variant = 'light', className }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.split('-')[0] || 'rw';
  const dark = variant === 'dark';

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border p-0.5',
        dark ? 'border-white/20 bg-white/10' : 'border-ink/10 bg-white',
        className
      )}
      role="group"
      aria-label="Language"
    >
      {LANGUAGES.map((language) => {
        const active = current === language.code;
        return (
          <button
            key={language.code}
            type="button"
            onClick={() => i18n.changeLanguage(language.code)}
            aria-pressed={active}
            title={language.name}
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-bold tracking-wide transition',
              active
                ? dark
                  ? 'bg-white text-rwanda-green-dark shadow-sm'
                  : 'bg-rwanda-green text-white shadow-sm'
                : dark
                  ? 'text-white/70 hover:bg-white/10 hover:text-white'
                  : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
            )}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}
