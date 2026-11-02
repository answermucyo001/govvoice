import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import env from '../config/env.js';
import { closePool, execute, query, queryOne } from '../config/db.js';
import { hashPassword } from '../utils/password.js';
import { encryptValue, hashNationalId } from '../services/encryption.service.js';
import { generateTrackingNumber } from '../utils/trackingNumber.js';

// rwanda-geo's ESM build relies on a browser-style require shim; load the CJS build.
const require = createRequire(import.meta.url);
const {
  getAllProvinces,
  getDistrictsByProvince,
  getSectorsByDistrict,
  getCounts
} = require('rwanda-geo');

const FRENCH_PROVINCES = {
  'RW-01': 'Ville de Kigali',
  'RW-02': 'Province du Sud',
  'RW-03': 'Province de l’Ouest',
  'RW-04': 'Province du Nord',
  'RW-05': 'Province de l’Est'
};

const DEPARTMENTS = [
  { code: 'MININFRA', rw: 'Minisiteri y’Ibikorwa Remezo', en: 'Ministry of Infrastructure', fr: 'Ministère des Infrastructures' },
  { code: 'WASAC', rw: 'Amazi n’Isuku', en: 'Water and Sanitation Corporation', fr: 'Eau et Assainissement' },
  { code: 'REG', rw: 'Ikigo cy’Ingufu mu Rwanda', en: 'Rwanda Energy Group', fr: 'Groupe Énergie du Rwanda' },
  { code: 'MINISANTE', rw: 'Minisiteri y’Ubuzima', en: 'Ministry of Health', fr: 'Ministère de la Santé' },
  { code: 'MINEDUC', rw: 'Minisiteri y’Uburezi', en: 'Ministry of Education', fr: 'Ministère de l’Éducation' },
  { code: 'RLMUA', rw: 'Ubutaka n’Ubwubatsi', en: 'Land and Housing Authority', fr: 'Autorité du Foncier et du Logement' },
  { code: 'MIFOTRA', rw: 'Minisiteri y’Abakozi ba Leta', en: 'Ministry of Public Service and Labour', fr: 'Ministère de la Fonction Publique et du Travail' },
  { code: 'RNP', rw: 'Polisi y’Igihugu y’u Rwanda', en: 'Rwanda National Police', fr: 'Police Nationale du Rwanda' },
  { code: 'REMA', rw: 'Ikigo gishinzwe Ibidukikije', en: 'Rwanda Environment Management Authority', fr: 'Autorité de Gestion de l’Environnement' },
  { code: 'MINALOC', rw: 'Minisiteri y’Ubutegetsi bw’Igihugu', en: 'Ministry of Local Government', fr: 'Ministère de l’Administration Locale' }
];

const CATEGORIES = [
  { slug: 'infrastructure', dept: 'MININFRA', rw: 'Ibikorwa remezo', en: 'Infrastructure', fr: 'Infrastructures', sla: 120, sort: 1 },
  { slug: 'water-sanitation', dept: 'WASAC', rw: 'Amazi n’isuku', en: 'Water and sanitation', fr: 'Eau et assainissement', sla: 48, sort: 2 },
  { slug: 'electricity', dept: 'REG', rw: 'Amashanyarazi', en: 'Electricity', fr: 'Électricité', sla: 48, sort: 3 },
  { slug: 'health', dept: 'MINISANTE', rw: 'Ubuzima', en: 'Health', fr: 'Santé', sla: 24, sort: 4 },
  { slug: 'education', dept: 'MINEDUC', rw: 'Uburezi', en: 'Education', fr: 'Éducation', sla: 72, sort: 5 },
  { slug: 'land-housing', dept: 'RLMUA', rw: 'Ubutaka n’ubwubatsi', en: 'Land and housing', fr: 'Foncier et logement', sla: 168, sort: 6 },
  { slug: 'public-service', dept: 'MIFOTRA', rw: 'Serivisi z’ubutegetsi', en: 'Public service', fr: 'Service public', sla: 72, sort: 7 },
  { slug: 'security-justice', dept: 'RNP', rw: 'Umutekano n’ubutabera', en: 'Security and justice', fr: 'Sécurité et justice', sla: 24, sort: 8 },
  { slug: 'environment', dept: 'REMA', rw: 'Ibidukikije', en: 'Environment', fr: 'Environnement', sla: 120, sort: 9 },
  { slug: 'other', dept: 'MINALOC', rw: 'Ibindi', en: 'Other', fr: 'Autre', sla: 96, sort: 10 }
];

const upsertProvince = async (province, rwName) => {
  await execute(
    `INSERT INTO provinces (id, code, name_rw, name_en, name_fr)
     VALUES (UUID(), ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name_rw = VALUES(name_rw), name_en = VALUES(name_en), name_fr = VALUES(name_fr)`,
    [province.code, rwName, province.name, FRENCH_PROVINCES[province.code] || province.name]
  );
  const row = await queryOne('SELECT id FROM provinces WHERE code = ?', [province.code]);
  return row.id;
};

const upsertDistrict = async (provinceId, district) => {
  await execute(
    `INSERT INTO districts (id, province_id, code, name_rw, name_en, name_fr)
     VALUES (UUID(), ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE province_id = VALUES(province_id), name_rw = VALUES(name_rw),
       name_en = VALUES(name_en), name_fr = VALUES(name_fr)`,
    [provinceId, district.code, district.name, district.name, district.name]
  );
  const row = await queryOne('SELECT id FROM districts WHERE code = ?', [district.code]);
  return row.id;
};

const upsertSector = async (districtId, sector) => {
  await execute(
    `INSERT INTO sectors (id, district_id, code, name_rw, name_en, name_fr)
     VALUES (UUID(), ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE district_id = VALUES(district_id), name_rw = VALUES(name_rw),
       name_en = VALUES(name_en), name_fr = VALUES(name_fr)`,
    [districtId, sector.code, sector.name, sector.name, sector.name]
  );
};

const seedLocations = async () => {
  const counts = getCounts();
  if (counts.provinces !== 5 || counts.districts !== 30 || counts.sectors !== 416) {
    throw new Error(
      `Unexpected rwanda-geo dataset (${counts.provinces}/${counts.districts}/${counts.sectors})`
    );
  }

  const provincesEn = getAllProvinces({ language: 'en' });
  const provincesRw = getAllProvinces({ language: 'rw' });
  const rwByCode = new Map(provincesRw.map((province) => [province.code, province.name]));

  for (const province of provincesEn) {
    const provinceId = await upsertProvince(province, rwByCode.get(province.code) || province.name);
    for (const district of getDistrictsByProvince(province.code)) {
      const districtId = await upsertDistrict(provinceId, district);
      for (const sector of getSectorsByDistrict(district.code)) {
        await upsertSector(districtId, sector);
      }
    }
  }

  return counts;
};

const seedDepartmentsAndCategories = async () => {
  const departmentIds = new Map();
  for (const department of DEPARTMENTS) {
    await execute(
      `INSERT INTO departments (id, code, name_rw, name_en, name_fr)
       VALUES (UUID(), ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name_rw = VALUES(name_rw), name_en = VALUES(name_en), name_fr = VALUES(name_fr)`,
      [department.code, department.rw, department.en, department.fr]
    );
    const row = await queryOne('SELECT id FROM departments WHERE code = ?', [department.code]);
    departmentIds.set(department.code, row.id);
  }

  for (const category of CATEGORIES) {
    await execute(
      `INSERT INTO categories
         (id, slug, department_id, name_rw, name_en, name_fr, sla_hours, sort_order, is_active)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE department_id = VALUES(department_id), name_rw = VALUES(name_rw),
         name_en = VALUES(name_en), name_fr = VALUES(name_fr), sla_hours = VALUES(sla_hours),
         sort_order = VALUES(sort_order), is_active = TRUE`,
      [
        category.slug,
        departmentIds.get(category.dept) || null,
        category.rw,
        category.en,
        category.fr,
        category.sla,
        category.sort
      ]
    );
  }

  return { departments: DEPARTMENTS.length, categories: CATEGORIES.length };
};

const seedSuperAdmin = async () => {
  const existing = await queryOne('SELECT id, email FROM users WHERE email = ?', [
    env.superAdmin.email
  ]);
  if (existing) return { id: existing.id, email: existing.email, created: false };

  const passwordHash = await hashPassword(env.superAdmin.password);
  await execute(
    `INSERT INTO users
       (id, first_name, last_name, phone, email, password_hash, national_id_encrypted,
        national_id_hash, language, role, account_status, must_change_password)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 'en', 'super_admin', 'active', FALSE)`,
    [
      env.superAdmin.firstName,
      env.superAdmin.lastName,
      env.superAdmin.phone,
      env.superAdmin.email,
      passwordHash,
      encryptValue(env.superAdmin.nationalId),
      hashNationalId(env.superAdmin.nationalId)
    ]
  );

  return { email: env.superAdmin.email, created: true };
};

const DEMO_SUBMISSIONS = [
  {
    type: 'complaint',
    category: 'water-sanitation',
    subject: 'No water supply in Kimironko for five days',
    description:
      'Residents of Kimironko sector have had no piped water for five days. Taps are dry and families are buying water from vendors at high prices. We request urgent intervention from WASAC.',
    visibility: 'public',
    status: 'under_review',
    daysAgo: 6,
    language: 'en',
    district: 'Gasabo',
    sector: 'Kimironko'
  },
  {
    type: 'complaint',
    category: 'electricity',
    subject: 'Street lights not working on the main road',
    description:
      'The street lights along the main road in Remera have been off for two weeks, making the area unsafe at night. Please repair them as soon as possible.',
    visibility: 'public',
    status: 'response_given',
    daysAgo: 12,
    language: 'en',
    district: 'Gasabo',
    sector: 'Remera',
    response:
      'Thank you for reporting this. REG has scheduled a maintenance team to replace the faulty lamps this week.'
  },
  {
    type: 'suggestion',
    category: 'education',
    subject: 'Add a computer lab to the sector school',
    description:
      'The sector school has enough space for a computer lab. Adding one would help learners gain digital skills and prepare for national exams.',
    visibility: 'public',
    status: 'received',
    daysAgo: 2,
    language: 'en',
    district: 'Kicukiro',
    sector: 'Niboye'
  },
  {
    type: 'compliment',
    category: 'public-service',
    subject: 'Excellent service at the sector office',
    description:
      'I want to thank the staff at the sector office for processing my documents quickly and explaining every step clearly. Keep up the good work.',
    visibility: 'public',
    status: 'resolved',
    daysAgo: 20,
    language: 'en',
    district: 'Nyarugenge',
    sector: 'Nyamirambo',
    response: 'Thank you for your kind words. We have shared your message with the team.',
    rating: 5
  },
  {
    type: 'complaint',
    category: 'infrastructure',
    subject: 'Potholes damaging vehicles near the market',
    description:
      'Large potholes near the market are damaging vehicles and causing accidents. The road needs urgent repairs before the rainy season.',
    visibility: 'public',
    status: 'overdue',
    daysAgo: 30,
    language: 'en',
    district: 'Huye',
    sector: 'Ngoma',
    escalation: 2
  },
  {
    type: 'complaint',
    category: 'health',
    subject: 'Medicine shortage at the health post',
    description:
      'The health post has been out of essential medicine for two weeks. Patients are being referred to distant facilities. Please restock urgently.',
    visibility: 'private',
    status: 'awaiting_info',
    daysAgo: 8,
    language: 'en',
    district: 'Musanze',
    sector: 'Muhoza'
  }
];

const seedDemo = async () => {
  if (String(process.env.SEED_DEMO || '').toLowerCase() !== 'true') return null;

  let citizen = await queryOne('SELECT id FROM users WHERE email = ?', ['citizen@example.rw']);
  if (!citizen) {
    await execute(
      `INSERT INTO users
         (id, first_name, last_name, phone, email, password_hash, national_id_encrypted,
          national_id_hash, language, role, province_id, district_id, sector_id, account_status)
       VALUES (UUID(), 'Aline', 'Uwase', '+250788111222', 'citizen@example.rw', ?, ?, ?, 'en', 'citizen',
         (SELECT id FROM provinces WHERE code = 'RW-01'),
         (SELECT id FROM districts WHERE name_en = 'Gasabo'),
         (SELECT id FROM sectors WHERE name_en = 'Kimironko'), 'active')`,
      [
        await hashPassword('Citizen123!'),
        encryptValue('1199070012345678'),
        hashNationalId('1199070012345678')
      ]
    );
    citizen = await queryOne('SELECT id FROM users WHERE email = ?', ['citizen@example.rw']);
  }

  for (const demo of DEMO_SUBMISSIONS) {
    const tracking = generateTrackingNumber();
    const category = await queryOne('SELECT id, department_id, sla_hours FROM categories WHERE slug = ?', [
      demo.category
    ]);
    const district = await queryOne('SELECT id, province_id FROM districts WHERE name_en = ? LIMIT 1', [
      demo.district
    ]);
    const sector = district
      ? await queryOne('SELECT id FROM sectors WHERE name_en = ? AND district_id = ? LIMIT 1', [
          demo.sector,
          district.id
        ])
      : null;

    await execute(
      `INSERT INTO submissions
         (id, tracking_number, type, subject, description, category_id, department_id, province_id,
          district_id, sector_id, date_occurred, visibility, submitted_by, language, status,
          priority, escalation_level, due_at, response_text, response_at, resolved_at,
          satisfaction_rating, created_at, updated_at)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_SUB(CURDATE(), INTERVAL ? DAY), ?, ?, ?, ?, 'normal', ?,
          DATE_ADD(DATE_SUB(NOW(), INTERVAL ? DAY), INTERVAL ? HOUR), ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [
        tracking,
        demo.type,
        demo.subject,
        demo.description,
        category?.id || null,
        category?.department_id || null,
        district?.province_id || null,
        district?.id || null,
        sector?.id || null,
        demo.daysAgo + 1,
        demo.visibility,
        citizen.id,
        demo.language,
        demo.status,
        demo.escalation || 0,
        demo.daysAgo,
        Number(category?.sla_hours || 72),
        demo.response || null,
        demo.response ? new Date() : null,
        demo.status === 'resolved' ? new Date() : null,
        demo.rating || null,
        demo.daysAgo,
        demo.daysAgo
      ]
    );

    const submission = await queryOne('SELECT id FROM submissions WHERE tracking_number = ?', [tracking]);
    await execute(
      `INSERT INTO timeline_entries (id, submission_id, actor_id, actor_role, status, message, is_public, created_at)
       VALUES (UUID(), ?, ?, 'citizen', 'received', ?, TRUE, DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [
        submission.id,
        citizen.id,
        `Submission ${tracking} received by GovVoice Rwanda.`,
        demo.daysAgo
      ]
    );

    if (demo.response) {
      await execute(
        `INSERT INTO timeline_entries (id, submission_id, actor_id, actor_role, status, message, is_public, created_at)
         VALUES (UUID(), ?, NULL, 'district_head', 'response_given', ?, TRUE, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [submission.id, demo.response, Math.max(0, demo.daysAgo - 3)]
      );
    }
  }

  return { citizen: 'citizen@example.rw', submissions: DEMO_SUBMISSIONS.length };
};

const seed = async () => {
  try {
    const counts = await seedLocations();
    const content = await seedDepartmentsAndCategories();
    const admin = await seedSuperAdmin();
    const demo = await seedDemo();

    console.log(
      `[seed] locations: ${counts.provinces} provinces, ${counts.districts} districts, ${counts.sectors} sectors`
    );
    console.log(`[seed] departments: ${content.departments}, categories: ${content.categories}`);
    console.log(
      admin.created
        ? `[seed] super admin created: ${admin.email}`
        : `[seed] super admin already exists: ${admin.email}`
    );
    if (demo) {
      console.log(`[seed] demo citizen: ${demo.citizen} (password Citizen123!)`);
      console.log(`[seed] demo submissions: ${demo.submissions}`);
    }
    console.log('[seed] complete');
  } catch (error) {
    console.error('[seed] failed:', error.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
};

seed();
