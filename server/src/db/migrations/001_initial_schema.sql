-- CFCS Rwanda initial schema (MySQL 8, InnoDB, utf8mb4)

CREATE TABLE IF NOT EXISTS provinces (
  id CHAR(36) NOT NULL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name_rw VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_fr VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS districts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  province_id CHAR(36) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  name_rw VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_fr VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_district_province FOREIGN KEY (province_id) REFERENCES provinces (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sectors (
  id CHAR(36) NOT NULL PRIMARY KEY,
  district_id CHAR(36) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  name_rw VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  name_fr VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sector_district FOREIGN KEY (district_id) REFERENCES districts (id) ON DELETE CASCADE,
  INDEX idx_sector_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name_rw VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  name_fr VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  department_id CHAR(36) NULL,
  name_rw VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  name_fr VARCHAR(150) NOT NULL,
  description_rw TEXT NULL,
  description_en TEXT NULL,
  description_fr TEXT NULL,
  sla_hours INT NOT NULL DEFAULT 72,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_category_department FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(150) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  national_id_encrypted VARBINARY(512) NULL,
  national_id_hash CHAR(64) NULL UNIQUE,
  language ENUM('rw','en','fr') NOT NULL DEFAULT 'rw',
  role ENUM('citizen','district_head','super_admin') NOT NULL DEFAULT 'citizen',
  province_id CHAR(36) NULL,
  district_id CHAR(36) NULL,
  sector_id CHAR(36) NULL,
  address_line VARCHAR(255) NULL,
  account_status ENUM('active','suspended','deleted') NOT NULL DEFAULT 'active',
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_province FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE SET NULL,
  CONSTRAINT fk_user_district FOREIGN KEY (district_id) REFERENCES districts (id) ON DELETE SET NULL,
  CONSTRAINT fk_user_sector FOREIGN KEY (sector_id) REFERENCES sectors (id) ON DELETE SET NULL,
  INDEX idx_user_role (role),
  INDEX idx_user_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enforce a single district head per district at the database level.
CREATE UNIQUE INDEX uq_one_head_per_district
  ON users ((CASE WHEN role = 'district_head' THEN district_id ELSE NULL END));

CREATE TABLE IF NOT EXISTS submissions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tracking_number VARCHAR(20) NOT NULL UNIQUE,
  type ENUM('complaint','suggestion','compliment') NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category_id CHAR(36) NULL,
  department_id CHAR(36) NULL,
  province_id CHAR(36) NULL,
  district_id CHAR(36) NULL,
  sector_id CHAR(36) NULL,
  date_occurred DATE NULL,
  visibility ENUM('public','private') NOT NULL DEFAULT 'private',
  submitted_by CHAR(36) NOT NULL,
  language ENUM('rw','en','fr') NOT NULL DEFAULT 'rw',
  status ENUM(
    'received','assigned','under_review','awaiting_info','response_given',
    'resolved','reopened','closed','overdue','pending_citizen'
  ) NOT NULL DEFAULT 'received',
  priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  escalation_level TINYINT NOT NULL DEFAULT 0,
  due_at TIMESTAMP NULL,
  response_text TEXT NULL,
  response_at TIMESTAMP NULL,
  resolved_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  satisfaction_rating TINYINT NULL,
  satisfaction_comment TEXT NULL,
  satisfaction_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sub_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
  CONSTRAINT fk_sub_department FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL,
  CONSTRAINT fk_sub_province FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE SET NULL,
  CONSTRAINT fk_sub_district FOREIGN KEY (district_id) REFERENCES districts (id) ON DELETE SET NULL,
  CONSTRAINT fk_sub_sector FOREIGN KEY (sector_id) REFERENCES sectors (id) ON DELETE SET NULL,
  CONSTRAINT fk_sub_user FOREIGN KEY (submitted_by) REFERENCES users (id),
  INDEX idx_sub_status (status),
  INDEX idx_sub_district (district_id),
  INDEX idx_sub_visibility (visibility),
  INDEX idx_sub_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attachments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  submission_id CHAR(36) NULL,
  uploaded_by CHAR(36) NULL,
  original_name VARCHAR(255) NOT NULL,
  storage_provider VARCHAR(20) NOT NULL DEFAULT 'local',
  storage_key VARCHAR(512) NOT NULL,
  url TEXT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT NOT NULL,
  file_kind ENUM('image','document') NOT NULL,
  visibility ENUM('public','private') NOT NULL DEFAULT 'private',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attachment_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE,
  CONSTRAINT fk_attachment_user FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_attachment_submission (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS timeline_entries (
  id CHAR(36) NOT NULL PRIMARY KEY,
  submission_id CHAR(36) NOT NULL,
  actor_id CHAR(36) NULL,
  actor_role VARCHAR(30) NULL,
  status VARCHAR(30) NULL,
  message TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_timeline_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE,
  CONSTRAINT fk_timeline_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_timeline_submission (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  submission_id CHAR(36) NULL,
  type VARCHAR(50) NOT NULL,
  message_rw TEXT NULL,
  message_en TEXT NULL,
  message_fr TEXT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE,
  INDEX idx_notification_user (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id CHAR(36) NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  replaced_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_refresh_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faq (
  id CHAR(36) NOT NULL PRIMARY KEY,
  question_rw TEXT NULL,
  question_en TEXT NULL,
  question_fr TEXT NULL,
  answer_rw TEXT NULL,
  answer_en TEXT NULL,
  answer_fr TEXT NULL,
  display_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonials (
  id CHAR(36) NOT NULL PRIMARY KEY,
  quote_rw TEXT NULL,
  quote_en TEXT NULL,
  quote_fr TEXT NULL,
  author_display VARCHAR(100) NULL,
  location_display VARCHAR(100) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
