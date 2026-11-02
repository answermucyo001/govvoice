export const ADMIN_TRANSITIONS = {
  received: ['assigned', 'overdue'],
  assigned: ['under_review', 'reopened'],
  under_review: ['awaiting_info', 'response_given', 'reopened'],
  awaiting_info: ['under_review', 'response_given', 'reopened'],
  response_given: ['resolved', 'reopened'],
  resolved: ['closed', 'reopened'],
  closed: [],
  overdue: ['assigned', 'reopened'],
  pending_citizen: ['under_review', 'response_given', 'reopened']
};

export const FINAL_STATUSES = ['resolved', 'closed'];

export const ALL_STATUSES = [
  'received',
  'assigned',
  'under_review',
  'awaiting_info',
  'response_given',
  'resolved',
  'reopened',
  'closed',
  'overdue',
  'pending_citizen'
];

export const STATUS_LABELS = {
  // English
  en: {
    received: 'Received',
    assigned: 'Assigned',
    under_review: 'Under Review',
    awaiting_info: 'Awaiting Info',
    response_given: 'Response Given',
    resolved: 'Resolved',
    reopened: 'Reopened',
    closed: 'Closed',
    overdue: 'Overdue',
    pending_citizen: 'Pending Citizen'
  },
  // Kinyarwanda
  rw: {
    received: 'Cyarwa',
    assigned: 'Abatuma',
    under_review: 'Kubwiraho',
    awaiting_info: 'Kumenya Impamvu',
    response_given: 'Igihe Cyarwa',
    resolved: 'Gusaba',
    reopened: 'Kubagura',
    closed: 'Kubera',
    overdue: 'Kubera',
    pending_citizen: 'Kwibona mu muri'
  },
  // French
  fr: {
    received: 'Reçu',
    assigned: 'Assigné',
    under_review: 'En examen',
    awaiting_info: 'En attente d\'info',
    response_given: 'Réponses données',
    resolved: 'Résolu',
    reopened: 'Réouvert',
    closed: 'Fermé',
    overdue: 'En retard',
    pending_citizen: 'En attente de citoyen'
  }
};

export const STATUS_TONES = {
  received: 'border-sky-200 bg-sky-50 text-sky-700',
  assigned: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  under_review: 'border-amber-200 bg-amber-50 text-amber-800',
  awaiting_info: 'border-orange-200 bg-orange-50 text-orange-700',
  response_given: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  reopened: 'border-purple-200 bg-purple-50 text-purple-700',
  closed: 'border-slate-200 bg-slate-100 text-slate-600',
  overdue: 'border-red-200 bg-red-50 text-red-700',
  pending_citizen: 'border-yellow-200 bg-yellow-50 text-yellow-800'
};

export const canAdminTransition = (from, to) => {
  return ADMIN_TRANSITIONS[from] && ADMIN_TRANSITIONS[from].includes(to);
};

export const canConfirmResolution = (status) => status === 'response_given';

export const canReopen = (status) =>
  ['resolved', 'closed', 'response_given'].includes(status);

export const canReply = (status) =>
  ['awaiting_info', 'pending_citizen', 'overdue'].includes(status);

export default {
  ADMIN_TRANSITIONS,
  FINAL_STATUSES,
  ALL_STATUSES,
  STATUS_LABELS,
  STATUS_TONES,
  canAdminTransition,
  canConfirmResolution,
  canReopen,
  canReply
};