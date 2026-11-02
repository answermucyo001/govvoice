const LOCALES = {
  rw: 'rw-RW',
  en: 'en-GB',
  fr: 'fr-FR'
};

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value, language = 'rw', options = {}) => {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(LOCALES[language] || LOCALES.rw, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  }).format(date);
};

export const formatDateTime = (value, language = 'rw') => {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(LOCALES[language] || LOCALES.rw, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatNumber = (value, language = 'rw') => {
  const number = Number(value);
  if (Number.isNaN(number)) return '0';
  return new Intl.NumberFormat(LOCALES[language] || LOCALES.rw).format(number);
};

export const localizedName = (entity, language = 'rw', prefix = 'name') => {
  if (!entity) return '';
  return (
    entity[`${prefix}_${language}`] ||
    entity[`${prefix}_en`] ||
    entity[`${prefix}_rw`] ||
    entity.name ||
    ''
  );
};

export const initials = (firstName = '', lastName = '') =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';

export const fullName = (person) =>
  person ? [person.firstName, person.lastName].filter(Boolean).join(' ') : '';

export const formatFileSize = (bytes) => {
  const value = Number(bytes);
  if (!value || value < 0) return '0 KB';
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const todayISO = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
};

export const truncate = (value = '', max = 90) =>
  value.length > max ? `${value.slice(0, max).trimEnd()}…` : value;

export const humanizeAction = (action = '') =>
  action
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const percentage = (value, total) => {
  if (!total) return 0;
  return Math.round((Number(value) / Number(total)) * 100);
};
