/* =========================================================
   Nursing Dashboard Database Schema
   ========================================================= */

-- ---------------------------------------------------------
-- 1) Create and select database
-- ---------------------------------------------------------
CREATE DATABASE IF NOT EXISTS nursing_dashboard;
USE nursing_dashboard;

-- =========================================================
-- 2) Core Tables (Users & Roles)
-- =========================================================

CREATE TABLE `User` (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  account_status ENUM('Active','Suspended') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `Role` (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
) ENGINE=InnoDB;

CREATE TABLE `UserRole` (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),

  CONSTRAINT fk_userrole_user
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_userrole_role
    FOREIGN KEY (role_id) REFERENCES `Role`(role_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================
-- 3) Staff & Trainees
-- =========================================================

CREATE TABLE `Nursing_staff` (
  nurse_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  middle_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  national_id_iqama VARCHAR(50) NULL,
  hospital_id_number VARCHAR(50) NULL,
  payroll_number VARCHAR(50) NULL,
  track_care_number VARCHAR(50) NULL,
  gender ENUM('Male','Female') NULL,
  nationality VARCHAR(100) NULL,
  birth_date_gregorian DATE NULL,
  birth_date_hijri VARCHAR(20) NULL,
  mobile_number VARCHAR(20) NULL,
  iau_email VARCHAR(150) NULL,
  unit VARCHAR(100) NULL,
  department VARCHAR(100) NULL,
  job_title VARCHAR(120) NOT NULL,
  position_title VARCHAR(120) NULL,
  qualification VARCHAR(100) NULL,
  license_number VARCHAR(100) UNIQUE,
  status ENUM('Active','On Leave','Terminated','Transferred','EOC') NOT NULL DEFAULT 'Active',
  hire_date DATE NULL,
  years_of_experience INT NULL,
  shift_type VARCHAR(50) NULL,
  contract_type ENUM('KFHU','SOPHS','IAUH','Business Contract','Government','SOP') NULL,
  contract_date_gregorian DATE NULL,
  contract_date_hijri VARCHAR(20) NULL,
  preferred_area_first_choice VARCHAR(100) NULL,
  preferred_area_second_choice VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_nurse_user
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE `Trainee` (
  trainee_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  university VARCHAR(150),
  training_type ENUM('Intern','Student Nurse') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
) ENGINE=InnoDB;

-- =========================================================
-- 4) Staff Files
-- =========================================================

CREATE TABLE `Staff_file` (
  file_id INT AUTO_INCREMENT PRIMARY KEY,
  nurse_id INT NOT NULL,
  file_type ENUM(
    'picture',
    'cv',
    'hospital_id',
    'national_id_iqama',
    'passport',
    'other'
  ) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_stafffile_nurse
    FOREIGN KEY (nurse_id) REFERENCES `Nursing_staff`(nurse_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 5) Certificates
-- =========================================================

CREATE TABLE `Certificate_type` (
  certificate_type_id INT AUTO_INCREMENT PRIMARY KEY,
  certificate_name VARCHAR(150) NOT NULL,
  validity_months INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `Staff_certificate` (
  nurse_id INT NOT NULL,
  certificate_type_id INT NOT NULL,
  certificate_number VARCHAR(100) NULL,
  issuing_body VARCHAR(150) NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status ENUM('Valid','Expired') NOT NULL DEFAULT 'Valid',
  file_path VARCHAR(255),
  classification_upload_path VARCHAR(500) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (nurse_id, certificate_type_id),

  CONSTRAINT fk_sc_nurse
    FOREIGN KEY (nurse_id) REFERENCES `Nursing_staff`(nurse_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_sc_type
    FOREIGN KEY (certificate_type_id) REFERENCES `Certificate_type`(certificate_type_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================
-- 6) Training
-- =========================================================

CREATE TABLE `Training_program` (
  training_id INT AUTO_INCREMENT PRIMARY KEY,
  training_name VARCHAR(150) NOT NULL,
  training_category ENUM(
    'Mandatory',
    'Inside Hospital',
    'Outside Hospital',
    'Cross Training',
    'Competency'
  ) NOT NULL DEFAULT 'Mandatory',
  training_type ENUM('Workshop','Online','Simulation','Course') NULL,
  duration_hours DECIMAL(5,2) NULL,
  facility_name VARCHAR(150) NULL,
  unit_of_training VARCHAR(100) NULL,
  mandatory BOOLEAN NOT NULL,
  description TEXT
) ENGINE=InnoDB;

CREATE TABLE `Staff_training` (
  nurse_id INT NOT NULL,
  training_id INT NOT NULL,
  start_date DATE NULL,
  completion_date DATE NULL,
  due_date DATE NULL,
  expiry_date DATE NULL,
  certificate_file_path VARCHAR(500) NULL,
  preceptor_name VARCHAR(150) NULL,
  recommendation_action_plan TEXT NULL,
  status ENUM('Completed','Pending','Expired','Overdue','In Progress') NOT NULL DEFAULT 'Pending',

  PRIMARY KEY (nurse_id, training_id),

  CONSTRAINT fk_stafftraining_nurse
    FOREIGN KEY (nurse_id) REFERENCES `Nursing_staff`(nurse_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_stafftraining_program
    FOREIGN KEY (training_id) REFERENCES `Training_program`(training_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE `Nurse_orientation` (
  orientation_id INT AUTO_INCREMENT PRIMARY KEY,
  nurse_id INT NOT NULL,
  orientation_type ENUM('General','Departmental','Unit Specific') NOT NULL,
  date_acquired DATE NULL,
  remarks TEXT NULL,

  CONSTRAINT fk_orientation_nurse
    FOREIGN KEY (nurse_id) REFERENCES `Nursing_staff`(nurse_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 7) Requests & Approvals
-- =========================================================

CREATE TABLE `Request` (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  nurse_id INT NOT NULL,
  request_type VARCHAR(100) NOT NULL,
  title VARCHAR(150) NULL,
  description TEXT NULL,
  submission_date DATE NULL,
  current_status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_request_nurse
    FOREIGN KEY (nurse_id) REFERENCES `Nursing_staff`(nurse_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE `Request_approval` (
  approval_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  approver_role ENUM('Supervisor','Assistant Director') NOT NULL,
  decision ENUM('Approved','Rejected','Pending') NOT NULL DEFAULT 'Pending',
  decision_date DATE,

  CONSTRAINT fk_approval_request
    FOREIGN KEY (request_id) REFERENCES `Request`(request_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `Request_attachment` (
  attachment_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_requestattachment_request
    FOREIGN KEY (request_id) REFERENCES `Request`(request_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 8) Staffing & Performance
-- =========================================================

CREATE TABLE `Ratio_rule` (
  ratio_id INT AUTO_INCREMENT PRIMARY KEY,
  unit VARCHAR(100) NOT NULL,
  ratio_value DECIMAL(5,2) NOT NULL,
  safe_limit INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `Daily_assignment` (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  nurse_id INT NOT NULL,
  ratio_id INT NOT NULL,
  submission_date DATE NOT NULL,
  unit VARCHAR(100) NOT NULL,

  CONSTRAINT fk_daily_nurse
    FOREIGN KEY (nurse_id) REFERENCES `Nursing_staff`(nurse_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_daily_ratio
    FOREIGN KEY (ratio_id) REFERENCES `Ratio_rule`(ratio_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE `Performance_evaluation` (
  evaluation_id INT AUTO_INCREMENT PRIMARY KEY,
  nurse_id INT NOT NULL,
  score DECIMAL(6,2) NOT NULL,
  evaluation_date DATE NOT NULL,

  CONSTRAINT fk_perf_nurse
    FOREIGN KEY (nurse_id) REFERENCES `Nursing_staff`(nurse_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 9) KPI & Research
-- =========================================================

CREATE TABLE `KPI` (
  kpi_id INT AUTO_INCREMENT PRIMARY KEY,
  kpi_name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `KPI_value` (
  kpi_value_id INT AUTO_INCREMENT PRIMARY KEY,
  kpi_id INT NOT NULL,
  unit VARCHAR(100),
  value DECIMAL(12,4) NOT NULL,
  record_date DATE NOT NULL,

  CONSTRAINT fk_kpivalue_kpi
    FOREIGN KEY (kpi_id) REFERENCES `KPI`(kpi_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `Research_project` (
  project_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(50) NOT NULL,
  start_date DATE,
  end_date DATE
) ENGINE=InnoDB;

CREATE TABLE `EvidenceGuideline` (
  guideline_id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,

  CONSTRAINT fk_guideline_project
    FOREIGN KEY (project_id) REFERENCES `Research_project`(project_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 10) Notifications
-- =========================================================

CREATE TABLE `Notification` (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  notification_type ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  category VARCHAR(100) NULL,
  related_entity_type VARCHAR(50) NULL,
  related_entity_id INT NULL,
  action_url VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME NULL,

  CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 11) Chats
-- =========================================================

CREATE TABLE `Chat` (
  chat_id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `Chat_participant` (
  chat_participant_id INT AUTO_INCREMENT PRIMARY KEY,
  chat_id INT NOT NULL,
  user_id INT NOT NULL,

  CONSTRAINT fk_chatparticipant_chat
    FOREIGN KEY (chat_id) REFERENCES `Chat`(chat_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_chatparticipant_user
    FOREIGN KEY (user_id) REFERENCES `User`(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `Message` (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  chat_id INT NOT NULL,
  sender_user_id INT NOT NULL,
  message_text TEXT NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT fk_message_chat
    FOREIGN KEY (chat_id) REFERENCES `Chat`(chat_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_message_sender
    FOREIGN KEY (sender_user_id) REFERENCES `User`(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 12) Optional Health Profile
-- =========================================================

CREATE TABLE `Staff_health_profile` (
  health_profile_id INT AUTO_INCREMENT PRIMARY KEY,
  nurse_id INT NOT NULL,
  staff_name VARCHAR(150) NULL,
  id_number VARCHAR(50) NULL,
  ehs_no VARCHAR(50) NULL,
  date_of_birth DATE NULL,
  physically_fit BOOLEAN NULL,
  comment_text TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_healthprofile_nurse
    FOREIGN KEY (nurse_id) REFERENCES `Nursing_staff`(nurse_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `Staff_health_condition` (
  condition_id INT AUTO_INCREMENT PRIMARY KEY,
  health_profile_id INT NOT NULL,
  illness_name VARCHAR(100) NOT NULL,
  has_condition BOOLEAN NULL,
  illness_since VARCHAR(50) NULL,
  remarks VARCHAR(255) NULL,

  CONSTRAINT fk_healthcondition_profile
    FOREIGN KEY (health_profile_id) REFERENCES `Staff_health_profile`(health_profile_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `Staff_vaccination` (
  vaccination_id INT AUTO_INCREMENT PRIMARY KEY,
  health_profile_id INT NOT NULL,
  vaccine_name VARCHAR(100) NOT NULL,
  vaccinated BOOLEAN NULL,
  vaccination_year VARCHAR(20) NULL,

  CONSTRAINT fk_vaccination_profile
    FOREIGN KEY (health_profile_id) REFERENCES `Staff_health_profile`(health_profile_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 13) Verification Queries
-- =========================================================

SHOW TABLES;

SELECT
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'nursing_dashboard'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

DESCRIBE `User`;
DESCRIBE `Role`;
DESCRIBE `UserRole`;
DESCRIBE `Nursing_staff`;
DESCRIBE `Trainee`;
DESCRIBE `Staff_file`;
DESCRIBE `Certificate_type`;
DESCRIBE `Staff_certificate`;
DESCRIBE `Training_program`;
DESCRIBE `Staff_training`;
DESCRIBE `Nurse_orientation`;
DESCRIBE `Request`;
DESCRIBE `Request_approval`;
DESCRIBE `Request_attachment`;
DESCRIBE `Ratio_rule`;
DESCRIBE `Daily_assignment`;
DESCRIBE `Performance_evaluation`;
DESCRIBE `KPI`;
DESCRIBE `KPI_value`;
DESCRIBE `Research_project`;
DESCRIBE `EvidenceGuideline`;
DESCRIBE `Notification`;
DESCRIBE `Chat`;
DESCRIBE `Chat_participant`;
DESCRIBE `Message`;
DESCRIBE `Staff_health_profile`;
DESCRIBE `Staff_health_condition`;
DESCRIBE `Staff_vaccination`;

SELECT * FROM `User`;
SELECT * FROM `Role`;
SELECT * FROM `UserRole`;
SELECT * FROM `Nursing_staff`;
SELECT * FROM `Trainee`;
SELECT * FROM `Staff_file`;
SELECT * FROM `Certificate_type`;
SELECT * FROM `Staff_certificate`;
SELECT * FROM `Training_program`;
SELECT * FROM `Staff_training`;
SELECT * FROM `Nurse_orientation`;
SELECT * FROM `Request`;
SELECT * FROM `Request_approval`;
SELECT * FROM `Request_attachment`;
SELECT * FROM `Ratio_rule`;
SELECT * FROM `Daily_assignment`;
SELECT * FROM `Performance_evaluation`;
SELECT * FROM `KPI`;
SELECT * FROM `KPI_value`;
SELECT * FROM `Research_project`;
SELECT * FROM `EvidenceGuideline`;
SELECT * FROM `Notification`;
SELECT * FROM `Chat`;
SELECT * FROM `Chat_participant`;
SELECT * FROM `Message`;
SELECT * FROM `Staff_health_profile`;
SELECT * FROM `Staff_health_condition`;
SELECT * FROM `Staff_vaccination`;