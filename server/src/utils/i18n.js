const MESSAGES = {
  submission_received: {
    rw: 'Ikirego cyanyu cyakiriwe. Nimero yo gukurikirana: {{tracking}}.',
    en: 'Your submission has been received. Tracking number: {{tracking}}.',
    fr: 'Votre soumission a bien été reçue. Numéro de suivi : {{tracking}}.'
  },
  status_changed: {
    rw: 'Imiterere y\'ikirego {{tracking}} yahindutse: {{status}}.',
    en: 'The status of submission {{tracking}} changed to {{status}}.',
    fr: 'Le statut de la soumission {{tracking}} est passé à {{status}}.'
  },
  response_given: {
    rw: 'Igisubizo cyatanzwe ku kirego {{tracking}}. Mwabona ibisubizo mu mwirondoro w\'ikirego.',
    en: 'A response has been provided for submission {{tracking}}.',
    fr: 'Une réponse a été fournie pour la soumission {{tracking}}.'
  },
  overdue: {
    rw: 'Ikirego {{tracking}} cyarenze igihe giteganyijwe. Kirakurikiranwa n\'ubuyobozi.',
    en: 'Submission {{tracking}} is overdue and has been escalated.',
    fr: 'La soumission {{tracking}} est en retard et a été escaladée.'
  },
  resolution_confirmed: {
    rw: 'Umunyamuryango yemeje ko ikirego {{tracking}} cyakemutse.',
    en: 'The citizen confirmed the resolution of submission {{tracking}}.',
    fr: 'Le citoyen a confirmé la résolution de la soumission {{tracking}}.'
  },
  reopened: {
    rw: 'Ikirego {{tracking}} cyongeye gufungurwa.',
    en: 'Submission {{tracking}} has been reopened.',
    fr: 'La soumission {{tracking}} a été réouverte.'
  },
  reply_received: {
    rw: 'Ubutumwa bushya bwakiriwe ku kirego {{tracking}}.',
    en: 'A new message was posted on submission {{tracking}}.',
    fr: 'Un nouveau message a été publié sur la soumission {{tracking}}.'
  },
  account_created: {
    rw: 'Konti yanyu yashyizweho muri GovVoice Rwanda.',
    en: 'Your GovVoice Rwanda account has been created.',
    fr: 'Votre compte GovVoice Rwanda a été créé.'
  },
  password_reset: {
    rw: 'Ijambobanga ryanyu ryahinduwe. Koresha ijambobanga rishya uhabwa n\'ubuyobozi.',
    en: 'Your password has been reset. Use the temporary password provided by the administrator.',
    fr: 'Votre mot de passe a été réinitialisé. Utilisez le mot de passe temporaire fourni.'
  }
};

const STATUS_LABELS = {
  rw: {
    received: 'Byakiriwe',
    assigned: 'Byahawe umukozi',
    under_review: 'Birasuzumwa',
    awaiting_info: 'Hategerejwe amakuru',
    response_given: 'Igisubizo cyatanzwe',
    resolved: 'Byakemutse',
    reopened: 'Byongeye gufungurwa',
    closed: 'Byafunzwe',
    overdue: 'Byarenze igihe',
    pending_citizen: 'Bitegereje umuturage',
    referred_to_district: 'Byoherejwe ku karere',
    district_review: 'Birasuzumwa ku karere'
  },
  en: {
    received: 'Received',
    assigned: 'Assigned',
    under_review: 'Under review',
    awaiting_info: 'Awaiting information',
    response_given: 'Response given',
    resolved: 'Resolved',
    reopened: 'Reopened',
    closed: 'Closed',
    overdue: 'Overdue',
    pending_citizen: 'Pending citizen',
    referred_to_district: 'Referred to district',
    district_review: 'District review'
  },
  fr: {
    received: 'Reçu',
    assigned: 'Assigné',
    under_review: 'En cours d\'examen',
    awaiting_info: 'En attente d\'informations',
    response_given: 'Réponse fournie',
    resolved: 'Résolu',
    reopened: 'Réouvert',
    closed: 'Fermé',
    overdue: 'En retard',
    pending_citizen: 'En attente du citoyen',
    referred_to_district: 'Transféré au district',
    district_review: 'Examen par le district'
  }
};

export const normalizeLanguage = (value) => {
  const language = String(value || '').toLowerCase().slice(0, 2);
  return ['rw', 'en', 'fr'].includes(language) ? language : 'rw';
};

export const translate = (key, language = 'rw', vars = {}) => {
  const lang = normalizeLanguage(language);
  const entry = MESSAGES[key];
  if (!entry) return key;
  const template = entry[lang] || entry.en;
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value ?? '')),
    template
  );
};

export const statusLabel = (status, language = 'rw') =>
  STATUS_LABELS[normalizeLanguage(language)]?.[status] || status;

export const localizedMessages = (key, vars = {}) => ({
  rw: translate(key, 'rw', vars),
  en: translate(key, 'en', vars),
  fr: translate(key, 'fr', vars)
});

export default { translate, statusLabel, localizedMessages, normalizeLanguage };
