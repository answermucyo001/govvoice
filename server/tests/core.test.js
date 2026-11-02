import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateTrackingNumber,
  isValidTrackingNumber,
  normalizeTrackingNumber
} from '../src/utils/trackingNumber.js';
import {
  isPhone,
  normalizePhone,
  isNationalId,
  normalizeNationalId,
  isUuid,
  parsePagination,
  validateLogin,
  validateSubmission,
  validateStatusUpdate
} from '../src/utils/validation.js';
import { passwordIssues } from '../src/utils/password.js';
import { allowedTransitions, mapSubmission } from '../src/services/submissionView.service.js';
import { normalizeLanguage, statusLabel, translate } from '../src/utils/i18n.js';

const VALID_UUID = '3f0c3f1e-6f0e-4a4b-9f0e-1f2a3b4c5d6e';

test('tracking numbers follow the public CFCS format and stay unique', () => {
  const values = new Set(Array.from({ length: 100 }, () => generateTrackingNumber()));
  assert.equal(values.size, 100);
  for (const value of values) {
    assert.match(value, /^CFCS-\d{8}-[A-HJ-NP-Z2-9]{6}$/);
    assert.equal(isValidTrackingNumber(value), true);
  }
  assert.equal(normalizeTrackingNumber('  cfcs-20260101-abc234 '), 'CFCS-20260101-ABC234');
  assert.equal(isValidTrackingNumber('CFCS-2026-ABC'), false);
});

test('phone numbers normalize to the Rwandan +250 format', () => {
  const cases = [
    ['0788123456', '+250788123456'],
    ['+250 788 123 456', '+250788123456'],
    ['250788123456', '+250788123456'],
    ['0788-123-456', '+250788123456']
  ];
  for (const [input, expected] of cases) {
    assert.equal(normalizePhone(input), expected);
    assert.equal(isPhone(input), true, input);
  }
  assert.equal(isPhone('12345'), false);
  assert.equal(isPhone('+254788123456'), false);
});

test('national IDs require exactly 16 digits', () => {
  assert.equal(isNationalId('1199070012345678'), true);
  assert.equal(isNationalId('1199 0700 1234 5678'), true);
  assert.equal(normalizeNationalId('1199 0700 1234 5678'), '1199070012345678');
  assert.equal(isNationalId('123'), false);
  assert.equal(isNationalId('123456789012345a'), false);
});

test('weak passwords are rejected with actionable messages', () => {
  assert.ok(passwordIssues('password').length > 0);
  assert.ok(passwordIssues('Short1!').length > 0);
  assert.deepEqual(passwordIssues('StrongPass123!'), []);
});

test('login accepts either an email address or a phone number', () => {
  const byEmail = validateLogin({ email: 'citizen@example.rw', password: 'Secret123!' });
  assert.equal(byEmail.identifier, 'citizen@example.rw');
  const byPhone = validateLogin({ phone: '0788111222', password: 'Secret123!' });
  assert.equal(byPhone.identifier, '0788111222');
  assert.equal(byPhone.phone, '+250788111222');

  assert.throws(() => validateLogin({ email: '', password: '' }), (error) => {
    assert.equal(error.code, 'VALIDATION_ERROR');
    assert.ok(error.details.email);
    assert.ok(error.details.password);
    return true;
  });
});

test('submission validation enforces type, location, and content rules', () => {
  const valid = validateSubmission({
    type: 'complaint',
    visibility: 'public',
    categoryId: VALID_UUID,
    provinceId: VALID_UUID,
    districtId: VALID_UUID,
    sectorId: VALID_UUID,
    subject: 'Broken water pipe',
    description: 'The water pipe on our street has been leaking for three days.',
    dateOccurred: '2026-10-01',
    language: 'rw',
    attachmentIds: [VALID_UUID]
  });
  assert.equal(valid.language, 'rw');
  assert.equal(valid.attachmentIds.length, 1);

  assert.throws(
    () =>
      validateSubmission({
        type: 'question',
        visibility: 'secret',
        subject: 'Hi',
        description: 'Too short',
        categoryId: 'nope'
      }),
    (error) => {
      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.ok(error.details.type);
      assert.ok(error.details.visibility);
      assert.ok(error.details.subject);
      assert.ok(error.details.description);
      assert.ok(error.details.categoryId);
      return true;
    }
  );
});

test('status updates require a public response message when responding', () => {
  assert.throws(() => validateStatusUpdate({ status: 'response_given', message: '' }), (error) => {
    assert.ok(error.details.message);
    return true;
  });
  assert.throws(
    () =>
      validateStatusUpdate({
        status: 'response_given',
        message: 'We repaired the pipe.',
        isPublic: false
      }),
    (error) => {
      assert.ok(error.details.isPublic);
      return true;
    }
  );
  const update = validateStatusUpdate({ status: 'under_review', isPublic: true });
  assert.equal(update.status, 'under_review');
});

test('status transitions respect the workflow', () => {
  assert.deepEqual(allowedTransitions('received'), [
    'assigned',
    'under_review',
    'awaiting_info',
    'overdue',
    'referred_to_district'
  ]);
  assert.equal(allowedTransitions('received').includes('resolved'), false);
  assert.equal(allowedTransitions('response_given').includes('resolved'), true);
  assert.equal(allowedTransitions('resolved').includes('closed'), true);
  assert.deepEqual(allowedTransitions('unknown-status'), []);
});

test('notifications render in the selected language', () => {
  const rw = translate('submission_received', 'rw', { tracking: 'CFCS-20260101-ABC234' });
  const fr = translate('submission_received', 'fr', { tracking: 'CFCS-20260101-ABC234' });
  assert.match(rw, /cyakiriwe/i);
  assert.match(fr, /reçue/);
  assert.match(translate('resolution_confirmed', 'en', { tracking: 'X' }), /confirmed/);
  assert.equal(statusLabel('resolved', 'rw'), 'Byakemutse');
  assert.equal(statusLabel('overdue', 'fr'), 'En retard');
  assert.equal(normalizeLanguage('FR'), 'fr');
  assert.equal(normalizeLanguage('de'), 'rw');
});

test('pagination is clamped to safe bounds', () => {
  assert.deepEqual(parsePagination({}, 10), { page: 1, limit: 10, offset: 0 });
  assert.deepEqual(parsePagination({ page: '3', limit: '1000' }, 10), {
    page: 3,
    limit: 50,
    offset: 100
  });
  assert.deepEqual(parsePagination({ page: '-2', limit: '0' }, 10), {
    page: 1,
    limit: 10,
    offset: 0
  });
});

test('submission rows map to the camelCase API contract', () => {
  const mapped = mapSubmission(
    {
      id: VALID_UUID,
      tracking_number: 'CFCS-20260101-ABC234',
      type: 'complaint',
      subject: 'Broken pipe',
      description: 'Leaking pipe',
      status: 'under_review',
      visibility: 'public',
      language: 'en',
      priority: 'normal',
      escalation_level: 1,
      due_at: new Date('2026-01-01T00:00:00Z'),
      response_text: null,
      response_at: null,
      resolved_at: null,
      closed_at: null,
      satisfaction_rating: null,
      satisfaction_comment: null,
      created_at: new Date('2026-01-01T00:00:00Z'),
      updated_at: new Date('2026-01-01T00:00:00Z'),
      date_occurred: null,
      submitted_by: VALID_UUID,
      c_id: VALID_UUID,
      c_slug: 'water-sanitation',
      c_name_rw: 'Amazi n’isuku',
      c_name_en: 'Water and sanitation',
      c_name_fr: 'Eau et assainissement',
      dist_id: VALID_UUID,
      dist_name_rw: 'Gasabo',
      dist_name_en: 'Gasabo',
      dist_name_fr: 'Gasabo',
      sec_id: VALID_UUID,
      sec_name_rw: 'Kimironko',
      sec_name_en: 'Kimironko',
      sec_name_fr: 'Kimironko',
      citizen_first_name: 'Aline',
      citizen_last_name: 'Uwase',
      citizen_phone: '+250788111222',
      citizen_email: 'citizen@example.rw',
      attachment_count: 2
    },
    { includeCitizen: true }
  );

  assert.equal(mapped.trackingNumber, 'CFCS-20260101-ABC234');
  assert.equal(mapped.status, 'under_review');
  assert.equal(mapped.escalationLevel, 1);
  assert.equal(mapped.attachmentCount, 2);
  assert.equal(mapped.isOverdue, true);
  assert.equal(mapped.category.name_en, 'Water and sanitation');
  assert.equal(mapped.location.district.name_en, 'Gasabo');
  assert.equal(mapped.citizen.firstName, 'Aline');
  assert.equal(allowedTransitions(mapped.status).includes('response_given'), true);
  assert.equal(isUuid(mapped.id), true);
});
