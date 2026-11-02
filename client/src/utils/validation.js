const PHONE_PATTERN = /^(?:\+?250|0)7[2-9]\d{7}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizePhone = (value = '') => {
  const compact = String(value).replace(/[\s\-().]/g, '');
  const match = compact.match(/^(?:\+?250|0)(7[2-9]\d{7})$/);
  return match ? `+250${match[1]}` : compact;
};

export const isValidPhone = (value) => PHONE_PATTERN.test(normalizePhone(value));
export const isValidEmail = (value) => EMAIL_PATTERN.test(String(value || '').trim());
export const isValidNationalId = (value) => /^\d{16}$/.test(String(value || '').replace(/\s/g, ''));

export const passwordStrength = (value = '') => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  if (value.length >= 12) score += 1;
  return Math.min(score, 4);
};

export const passwordErrorKey = (value = '') => {
  if (value.length < 8) return 'validation.password_weak';
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) return 'validation.password_weak';
  if (!/\d/.test(value) || !/[^A-Za-z0-9]/.test(value)) return 'validation.password_weak';
  return null;
};

export const validateLogin = (form, t) => {
  const errors = {};
  if (!String(form.identifier || '').trim()) errors.identifier = t('validation.required');
  if (!form.password) errors.password = t('validation.required');
  return errors;
};

export const validateRegisterStep = (step, form, t) => {
  const errors = {};

  if (step === 0) {
    if (!form.firstName?.trim()) errors.firstName = t('validation.required');
    if (!form.lastName?.trim()) errors.lastName = t('validation.required');
    if (!form.nationalId?.trim()) errors.nationalId = t('validation.required');
    else if (!isValidNationalId(form.nationalId)) errors.nationalId = t('validation.invalid_national_id');
    if (!form.email?.trim()) errors.email = t('validation.required');
    else if (!isValidEmail(form.email)) errors.email = t('validation.invalid_email');
    if (!form.phone?.trim()) errors.phone = t('validation.required');
    else if (!isValidPhone(form.phone)) errors.phone = t('validation.invalid_phone');
  }

  if (step === 1) {
    if (!form.provinceId) errors.provinceId = t('validation.select_option');
    if (!form.districtId) errors.districtId = t('validation.select_option');
    if (!form.sectorId) errors.sectorId = t('validation.select_option');
  }

  if (step === 2) {
    if (!form.password) errors.password = t('validation.required');
    else {
      const key = passwordErrorKey(form.password);
      if (key) errors.password = t(key);
    }
    if (!form.confirmPassword) errors.confirmPassword = t('validation.required');
    else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = t('validation.password_mismatch');
    }
    if (!form.consent) errors.consent = t('validation.consent_required');
  }

  return errors;
};

export const validateSubmissionStep = (step, form, t) => {
  const errors = {};

  if (step === 0) {
    if (!form.type) errors.type = t('validation.select_option');
    if (!form.categoryId) errors.categoryId = t('validation.select_option');
    if (!form.subject?.trim()) errors.subject = t('validation.required');
    else if (form.subject.trim().length < 8) errors.subject = t('validation.subject_short');
    if (!form.description?.trim()) errors.description = t('validation.required');
    else if (form.description.trim().length < 20) errors.description = t('validation.description_short');
    if (!form.dateOccurred) errors.dateOccurred = t('validation.required');
    else if (new Date(form.dateOccurred) > new Date()) errors.dateOccurred = t('validation.date_future');
  }

  if (step === 1) {
    if (!form.provinceId) errors.provinceId = t('validation.select_option');
    if (!form.districtId) errors.districtId = t('validation.select_option');
    if (!form.sectorId) errors.sectorId = t('validation.select_option');
    if (!form.visibility) errors.visibility = t('validation.select_option');
  }

  if (step === 2) {
    if ((form.attachments?.length || 0) > 5) errors.attachments = t('validation.max_files');
  }

  return errors;
};

export const validateProfile = (form, t) => {
  const errors = {};
  if (!form.phone?.trim()) errors.phone = t('validation.required');
  else if (!isValidPhone(form.phone)) errors.phone = t('validation.invalid_phone');
  return errors;
};

export const validateChangePassword = (form, t) => {
  const errors = {};
  if (!form.currentPassword) errors.currentPassword = t('validation.required');
  if (!form.newPassword) errors.newPassword = t('validation.required');
  else {
    const key = passwordErrorKey(form.newPassword);
    if (key) errors.newPassword = t(key);
  }
  if (!form.confirmPassword) errors.confirmPassword = t('validation.required');
  else if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = t('validation.password_mismatch');
  }
  return errors;
};
