export const ACTIVE_STATUSES = [
  'received',
  'assigned',
  'under_review',
  'awaiting_info',
  'response_given',
  'reopened',
  'overdue',
  'pending_citizen'
];

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
  'pending_citizen',
  'referred_to_district',
  'district_review'
];

export const SUBMISSION_TYPES = ['complaint', 'suggestion', 'compliment'];
export const VISIBILITIES = ['public', 'private'];

export const statusTone = (status) => {
  const tones = {
    received: 'border-sky-200 bg-sky-50 text-sky-700',
    assigned: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    under_review: 'border-amber-200 bg-amber-50 text-amber-800',
    awaiting_info: 'border-orange-200 bg-orange-50 text-orange-700',
    response_given: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    reopened: 'border-purple-200 bg-purple-50 text-purple-700',
    closed: 'border-slate-200 bg-slate-100 text-slate-600',
    overdue: 'border-red-200 bg-red-50 text-red-700',
    pending_citizen: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    referred_to_district: 'border-violet-200 bg-violet-50 text-violet-700',
    district_review: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700'
  };
  return tones[status] || 'border-ink/15 bg-ink/5 text-ink-soft';
};

export const statusDot = (status) => {
  const dots = {
    received: 'bg-sky-500',
    assigned: 'bg-indigo-500',
    under_review: 'bg-amber-500',
    awaiting_info: 'bg-orange-500',
    response_given: 'bg-cyan-500',
    resolved: 'bg-emerald-500',
    reopened: 'bg-purple-500',
    closed: 'bg-slate-400',
    overdue: 'bg-red-500',
    pending_citizen: 'bg-yellow-500',
    referred_to_district: 'bg-violet-500',
    district_review: 'bg-fuchsia-500'
  };
  return dots[status] || 'bg-ink-muted';
};

export const typeTone = (type) => {
  const tones = {
    complaint: 'border-red-200 bg-red-50 text-red-700',
    suggestion: 'border-rwanda-blue/25 bg-rwanda-blue-soft text-rwanda-blue-dark',
    compliment: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  };
  return tones[type] || 'border-ink/15 bg-ink/5 text-ink-soft';
};

export const canConfirmResolution = (submission) =>
  submission?.status === 'response_given';

export const canReopen = (submission) =>
  ['resolved', 'closed', 'response_given'].includes(submission?.status);

export const canReply = (submission) =>
  ['awaiting_info', 'pending_citizen', 'overdue'].includes(submission?.status);

export const homeForRole = (role) => {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'district_head' || role === 'sector_head') return '/admin';
  return '/dashboard';
};
