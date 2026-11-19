-- CyberShield MySQL 8.0 Database Schema
-- Designed with minimal data collection, explicit consent, and indexed foreign keys.

CREATE DATABASE IF NOT EXISTS cybershield_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cybershield_db;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  preferred_language ENUM('en', 'hi', 'mr') NOT NULL DEFAULT 'en',
  encrypted_recovery_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- 2. User Roles (RBAC)
CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_name ENUM('senior', 'caregiver') NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_role (user_id, role_name)
) ENGINE=InnoDB;

-- 3. Tutorials
CREATE TABLE IF NOT EXISTS tutorials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  category VARCHAR(80) NOT NULL,
  order_index INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  title_hi VARCHAR(200) NOT NULL,
  title_mr VARCHAR(200) NOT NULL,
  summary_en TEXT NOT NULL,
  summary_hi TEXT NOT NULL,
  summary_mr TEXT NOT NULL,
  script_en TEXT NOT NULL,
  script_hi TEXT NOT NULL,
  script_mr TEXT NOT NULL,
  tips_json JSON NOT NULL,
  quiz_json JSON NOT NULL,
  INDEX idx_tutorials_order (order_index)
) ENGINE=InnoDB;

-- 4. Learning Progress
CREATE TABLE IF NOT EXISTS learning_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tutorial_id INT NOT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  voice_listened TINYINT(1) NOT NULL DEFAULT 0,
  completed_at TIMESTAMP NULL,
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_tutorial FOREIGN KEY (tutorial_id) REFERENCES tutorials(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_tutorial (user_id, tutorial_id),
  INDEX idx_progress_user (user_id)
) ENGINE=InnoDB;

-- 5. Quiz Results
CREATE TABLE IF NOT EXISTS quiz_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tutorial_id INT NOT NULL,
  score INT NOT NULL,
  total_questions INT NOT NULL,
  taken_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_tutorial FOREIGN KEY (tutorial_id) REFERENCES tutorials(id) ON DELETE CASCADE,
  INDEX idx_quiz_user (user_id)
) ENGINE=InnoDB;

-- 6. Simulation Results
CREATE TABLE IF NOT EXISTS simulation_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  scenario_id VARCHAR(64) NOT NULL,
  selected_option_id VARCHAR(64) NOT NULL,
  is_correct TINYINT(1) NOT NULL,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sim_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sim_user (user_id),
  INDEX idx_sim_scenario (scenario_id)
) ENGINE=InnoDB;

-- 7. Caregiver Consent
CREATE TABLE IF NOT EXISTS caregiver_consent (
  id INT AUTO_INCREMENT PRIMARY KEY,
  senior_user_id INT NOT NULL,
  caregiver_user_id INT NULL,
  caregiver_email VARCHAR(180) NOT NULL,
  status ENUM('pending', 'granted', 'revoked') NOT NULL DEFAULT 'pending',
  consent_code VARCHAR(16) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_consent_senior FOREIGN KEY (senior_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_consent_caregiver FOREIGN KEY (caregiver_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_consent_senior (senior_user_id),
  INDEX idx_consent_caregiver (caregiver_user_id),
  INDEX idx_consent_email (caregiver_email)
) ENGINE=InnoDB;

-- 8. Scam Check History (Saved ONLY when user explicitly opts in)
CREATE TABLE IF NOT EXISTS scam_check_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  input_type VARCHAR(32) NOT NULL,
  content_excerpt VARCHAR(200) NOT NULL,
  risk_level ENUM('Low', 'Medium', 'High') NOT NULL,
  risk_score INT NOT NULL,
  matched_patterns_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_scam_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_scam_history_user (user_id)
) ENGINE=InnoDB;
