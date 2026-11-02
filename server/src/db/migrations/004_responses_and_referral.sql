-- Referred-to-district statuses and complaint responses.
ALTER TABLE submissions
  MODIFY status ENUM('received','assigned','under_review','awaiting_info','response_given',
                    'resolved','reopened','closed','overdue','pending_citizen',
                    'referred_to_district','district_review')
  NOT NULL DEFAULT 'received';

CREATE TABLE IF NOT EXISTS complaint_responses (
  id CHAR(36) NOT NULL PRIMARY KEY,
  submission_id CHAR(36) NOT NULL,
  responder_id CHAR(36) NOT NULL,
  responder_role ENUM('sector_head','district_head','super_admin') NOT NULL,
  message TEXT NOT NULL,
  actions_taken TEXT NULL,
  progress_details TEXT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cr_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE,
  CONSTRAINT fk_cr_responder FOREIGN KEY (responder_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_cr_submission (submission_id),
  INDEX idx_cr_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS complaint_response_attachments (
  response_id CHAR(36) NOT NULL,
  attachment_id CHAR(36) NOT NULL,
  PRIMARY KEY (response_id, attachment_id),
  CONSTRAINT fk_cra_response FOREIGN KEY (response_id) REFERENCES complaint_responses (id) ON DELETE CASCADE,
  CONSTRAINT fk_cra_attachment FOREIGN KEY (attachment_id) REFERENCES attachments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
