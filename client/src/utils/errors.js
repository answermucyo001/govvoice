const ERROR_KEYS = {
  INVALID_CREDENTIALS: 'errors.invalid_credentials',
  ACCOUNT_LOCKED: 'errors.account_locked',
  ACCOUNT_DISABLED: 'errors.account_disabled',
  DUPLICATE_EMAIL: 'errors.duplicate_email',
  DUPLICATE_PHONE: 'errors.duplicate_phone',
  DUPLICATE_NATIONAL_ID: 'errors.duplicate_national_id',
  DUPLICATE_TRACKING_NUMBER: 'errors.generic',
  INVALID_STATUS_TRANSITION: 'errors.invalid_status_transition',
  RESPONSE_REQUIRED: 'errors.response_required',
  FILE_TYPE_INVALID: 'errors.file_type_invalid',
  FILE_TOO_LARGE: 'errors.file_too_large',
  ATTACHMENT_INVALID: 'errors.attachment_invalid',
  TOO_MANY_FILES: 'validation.max_files',
  INVALID_REFRESH_TOKEN: 'errors.invalid_refresh_token',
  RATE_LIMITED: 'errors.rate_limited',
  UNAUTHORIZED: 'errors.unauthorized',
  FORBIDDEN: 'errors.forbidden',
  NOT_FOUND: 'errors.not_found',
  SERVER_ERROR: 'errors.server_error',
  INVALID_LOCATION_HIERARCHY: 'validation.invalid_location_hierarchy',
  VALIDATION_ERROR: 'errors.generic',
  DISTRICT_HEAD_EXISTS: 'errors.district_head_exists',
  SECTOR_HEAD_EXISTS: 'errors.sector_head_exists',
  SUBMISSION_NOT_EDITABLE: 'errors.invalid_status_transition'
};

export const getErrorMessage = (error, t) => {
  if (!error?.response) {
    return t('errors.network');
  }

  const payload = error.response.data?.error || {};
  const key = ERROR_KEYS[payload.code];
  if (key) {
    const translated = t(key);
    if (translated && !translated.startsWith(key)) return translated;
  }

  return payload.message || t('errors.generic');
};

export const getFieldErrors = (error) => error?.response?.data?.error?.details || {};

export const applyServerFieldErrors = (error, setErrors) => {
  const details = getFieldErrors(error);
  if (!details || !Object.keys(details).length) return false;
  const next = {};
  Object.entries(details).forEach(([field, message]) => {
    next[field] = message;
  });
  setErrors((current) => ({ ...current, ...next }));
  return true;
};
