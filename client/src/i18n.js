import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import rw from './locales/rw.json';
import fr from './locales/fr.json';

export const LANGUAGE_STORAGE_KEY = 'govvoice.language';
export const SUPPORTED_LANGUAGES = ['rw', 'en', 'fr'];

const stored =
  typeof window !== 'undefined'
    ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    : null;

const initialLanguage = SUPPORTED_LANGUAGES.includes(stored) ? stored : 'rw';

i18n.use(initReactI18next).init({
  resources: {
    rw: { translation: rw },
    en: { translation: en },
    fr: { translation: fr }
  },
  lng: initialLanguage,
  fallbackLng: 'rw',
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    escapeValue: false
  },
  returnNull: false,
  react: {
    useSuspense: false
  }
});

const applyDocumentLanguage = (language) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
};

applyDocumentLanguage(initialLanguage);

i18n.on('languageChanged', (language) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
  applyDocumentLanguage(language);
});

export default i18n;
