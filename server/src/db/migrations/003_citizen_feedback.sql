-- Citizen satisfaction decisions and reopening history.
CREATE TABLE IF NOT EXISTS citizen_feedback (
  id CHAR(36) NOT NULL PRIMARY KEY,
  submission_id CHAR(36) NOT NULL,
  citizen_id CHAR(36) NOT NULL,
  decision ENUM('satisfied', 'not_satisfied') NOT NULL,
  rating TINYINT NULL,
  comment TEXT NULL,
  reason TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cf_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE,
  CONSTRAINT fk_cf_citizen FOREIGN KEY (citizen_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_cf_submission (submission_id),
  INDEX idx_cf_decision (decision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
