import { fieldErrors } from './httpError.js';
import { passwordIssues } from './password.js';
import { normalizeLanguage } from './i18n.js';
import { isValidTrackingNumber, normalizeTrackingNumber } from './trackingNumber.js';

export const SUBMISSION_TYPES = ['complaint', 'suggestion', 'compliment'];
export const VISIBILITIES = ['public', 'private'];
export const STATUSES = [
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value);

export const normalizePhone = (value = '') => {
  const digits = String(value).replace(/[^\d+]/g, '');
  if (digits.startsWith('+250')) return `+250${digits.slice(4)}`;
  if (digits.startsWith('250')) return `+250${digits.slice(3)}`;
  if (digits.startsWith('0')) return `+250${digits.slice(1)}`;
  return digits;
};

export const normalizeNationalId = (value = '') => String(value).replace(/\s+/g, '');

export const isPhone = (value) => /^\+250[0-9]{9}$/.test(normalizePhone(value));

export const isNationalId = (value) => /^[0-9]{16}$/.test(normalizeNationalId(value));

const collect = (checks) => {
  const errors = {};
  for (const [field, message] of checks) {
    if (message && !errors[field]) errors[field] = message;
  }
  return errors;
};

export const validateRegistration = (body = {}) => {
  const value = {
    firstName: String(body.firstName || '').trim(),
    lastName: String(body.lastName || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    phone: normalizePhone(body.phone),
    nationalId: normalizeNationalId(body.nationalId),
    password: String(body.password || ''),
    language: normalizeLanguage(body.language),
    provinceId: body.provinceId || null,
    districtId: body.districtId || null,
    sectorId: body.sectorId || null,
    addressLine: body.addressLine ? String(body.addressLine).trim() : null
  };

  const errors = collect([
    ['firstName', !value.firstName ? 'First name is required.' : value.firstName.length > 100 ? 'First name is too long.' : null],
    ['lastName', !value.lastName ? 'Last name is required.' : value.lastName.length > 100 ? 'Last name is too long.' : null],
    ['email', !value.email ? 'Email is required.' : !EMAIL_PATTERN.test(value.email) ? 'Enter a valid email address.' : null],
    ['phone', !value.phone ? 'Phone number is required.' : !isPhone(value.phone) ? 'Enter a valid Rwandan phone number.' : null],
    ['nationalId', !value.nationalId ? 'National ID is required.' : !isNationalId(value.nationalId) ? 'National ID must be exactly 16 digits.' : null],
    ['password', passwordIssues(value.password)[0] || null],
    ['provinceId', value.provinceId && !isUuid(value.provinceId) ? 'Select a valid province.' : null],
    ['districtId', value.districtId && !isUuid(value.districtId) ? 'Select a valid district.' : null],
    ['sectorId', value.sectorId && !isUuid(value.sectorId) ? 'Select a valid sector.' : null]
  ]);

  if (Object.keys(errors).length) throw fieldErrors(errors);
  return value;
};

export const validateLogin = (body = {}) => {
  const identifier = String(body.email || body.phone || body.identifier || '').trim();
  const password = String(body.password || '');
  const errors = collect([
    ['email', !identifier ? 'Email or phone number is required.' : null],
    ['password', !password ? 'Password is required.' : null]
  ]);
  if (Object.keys(errors).length) throw fieldErrors(errors);
  return { identifier, password, phone: normalizePhone(identifier) };
};

export const validateSubmission = (body = {}) => {
  const value = {
    type: body.type,
    visibility: body.visibility,
    categoryId: body.categoryId || null,
    provinceId: body.provinceId || null,
    districtId: body.districtId || null,
    sectorId: body.sectorId || null,
    subject: String(body.subject || '').trim(),
    description: String(body.description || '').trim(),
    dateOccurred: body.dateOccurred || null,
    language: normalizeLanguage(body.language),
    attachmentIds: Array.isArray(body.attachmentIds) ? body.attachmentIds : []
  };

  const errors = collect([
    ['type', !SUBMISSION_TYPES.includes(value.type) ? 'Select a valid submission type.' : null],
    ['visibility', !VISIBILITIES.includes(value.visibility) ? 'Select a valid visibility.' : null],
    ['categoryId', !isUuid(value.categoryId) ? 'Select a category.' : null],
    ['provinceId', !isUuid(value.provinceId) ? 'Select a province.' : null],
    ['districtId', !isUuid(value.districtId) ? 'Select a district.' : null],
    ['sectorId', !isUuid(value.sectorId) ? 'Select a sector.' : null],
    ['subject', value.subject.length < 5 ? 'Subject must be at least 5 characters.' : value.subject.length > 200 ? 'Subject must be 200 characters or fewer.' : null],
    ['description', value.description.length < 10 ? 'Description must be at least 10 characters.' : value.description.length > 5000 ? 'Description must be 5000 characters or fewer.' : null],
    ['dateOccurred', value.dateOccurred && Number.isNaN(new Date(value.dateOccurred).getTime()) ? 'Enter a valid date.' : null],
    ['attachmentIds', value.attachmentIds.length > 5 ? 'You can attach at most 5 files.' : value.attachmentIds.some((id) => !isUuid(id)) ? 'One or more attachments are invalid.' : null]
  ]);

  if (Object.keys(errors).length) throw fieldErrors(errors);
  return value;
};

export const validateProfileUpdate = (body = {}) => {
  const value = {
    firstName: body.firstName === undefined ? undefined : String(body.firstName).trim(),
    lastName: body.lastName === undefined ? undefined : String(body.lastName).trim(),
    phone: body.phone === undefined ? undefined : normalizePhone(body.phone),
    language: body.language === undefined ? undefined : normalizeLanguage(body.language),
    addressLine: body.addressLine === undefined ? undefined : String(body.addressLine).trim()
  };
  const errors = collect([
    ['firstName', value.firstName !== undefined && !value.firstName ? 'First name is required.' : null],
    ['lastName', value.lastName !== undefined && !value.lastName ? 'Last name is required.' : null],
    ['phone', value.phone !== undefined && !isPhone(value.phone) ? 'Enter a valid Rwandan phone number.' : null]
  ]);
  if (Object.keys(errors).length) throw fieldErrors(errors);
  return value;
};

export const validatePasswordChange = (body = {}) => {
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');
  const errors = collect([
    ['currentPassword', !currentPassword ? 'Current password is required.' : null],
    ['newPassword', passwordIssues(newPassword)[0] || null]
  ]);
  if (Object.keys(errors).length) throw fieldErrors(errors);
  return { currentPassword, newPassword };
};

export const validateStatusUpdate = (body = {}) => {
  const value = {
    status: body.status,
    message: body.message ? String(body.message).trim() : '',
    isPublic: body.isPublic !== false
  };
  const errors = collect([
    ['status', !STATUSES.includes(value.status) ? 'Select a valid status.' : null],
    ['message', value.status === 'response_given' && value.message.length < 5 ? 'A response message of at least 5 characters is required.' : null]
  ]);
  if (Object.keys(errors).length) throw fieldErrors(errors);
  if (value.status === 'response_given' && !value.isPublic) {
    throw fieldErrors({ isPublic: 'Responses must be visible to the citizen.' });
  }
  return value;
};

export const validateSectorHead = (body = {}) => {
  const value = {
    firstName: String(body.firstName || '').trim(),
    lastName: String(body.lastName || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    phone: normalizePhone(body.phone),
    nationalId: normalizeNationalId(body.nationalId),
    sectorId: body.sectorId || null,
    language: normalizeLanguage(body.language),
    password: body.password ? String(body.password) : null
  };
  const errors = collect([
    ['firstName', !value.firstName ? 'First name is required.' : null],
    ['lastName', !value.lastName ? 'Last name is required.' : null],
    ['email', !value.email ? 'Email is required.' : !EMAIL_PATTERN.test(value.email) ? 'Enter a valid email address.' : null],
    ['phone', !value.phone ? 'Phone number is required.' : !isPhone(value.phone) ? 'Enter a valid Rwandan phone number.' : null],
    ['nationalId', !value.nationalId ? 'National ID is required.' : !isNationalId(value.nationalId) ? 'National ID must be exactly 16 digits.' : null],
    ['sectorId', !isUuid(value.sectorId) ? 'Select a sector.' : null],
    ['password', value.password && passwordIssues(value.password)[0] ? passwordIssues(value.password)[0] : null]
  ]);
  if (Object.keys(errors).length) throw fieldErrors(errors);
  return value;
};
export const validateDistrictHead = (body = {}) => {
  const value = {
    firstName: String(body.firstName || '').trim(),
    lastName: String(body.lastName || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    phone: normalizePhone(body.phone),
    nationalId: normalizeNationalId(body.nationalId),
    districtId: body.districtId || null,
    language: normalizeLanguage(body.language),
    password: body.password ? String(body.password) : null
  };
  const errors = collect([
    ['firstName', !value.firstName ? 'First name is required.' : null],
    ['lastName', !value.lastName ? 'Last name is required.' : null],
    ['email', !value.email ? 'Email is required.' : !EMAIL_PATTERN.test(value.email) ? 'Enter a valid email address.' : null],
    ['phone', !value.phone ? 'Phone number is required.' : !isPhone(value.phone) ? 'Enter a valid Rwandan phone number.' : null],
    ['nationalId', !value.nationalId ? 'National ID is required.' : !isNationalId(value.nationalId) ? 'National ID must be exactly 16 digits.' : null],
    ['districtId', !isUuid(value.districtId) ? 'Select a district.' : null],
    ['password', value.password && passwordIssues(value.password)[0] ? passwordIssues(value.password)[0] : null]
  ]);
  if (Object.keys(errors).length) throw fieldErrors(errors);
  return value;
};

export const validateTrackingNumber = (raw) => {
  const tracking = normalizeTrackingNumber(raw);
  if (!isValidTrackingNumber(tracking)) {
    throw fieldErrors({ trackingNumber: 'Enter a valid tracking number.' });
  }
  return tracking;
};

export const parsePagination = (query = {}, defaultLimit = 10) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
};

export default {
  isUuid,
  normalizePhone,
  normalizeNationalId,
  isPhone,
  isNationalId,
  validateRegistration,
  validateLogin,
  validateSubmission,
  validateProfileUpdate,
  validatePasswordChange,
  validateStatusUpdate,
  validateSectorHead,
  validateDistrictHead,
  validateTrackingNumber,
  parsePagination
};
