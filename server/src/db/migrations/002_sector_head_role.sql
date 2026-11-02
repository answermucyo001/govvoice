-- Add the sector_head role and enforce one sector head per sector.
ALTER TABLE users
  MODIFY role ENUM('citizen', 'district_head', 'sector_head', 'super_admin')
  NOT NULL DEFAULT 'citizen';

CREATE UNIQUE INDEX uq_one_sector_head_per_sector
  ON users ((CASE WHEN role = 'sector_head' THEN sector_id ELSE NULL END));
