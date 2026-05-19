CREATE DATABASE IF NOT EXISTS survivalkendy_tickets
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE survivalkendy_tickets;

CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id VARCHAR(64) NOT NULL,
  minecraft_username VARCHAR(16) NOT NULL,
  title VARCHAR(120) NOT NULL,
  category ENUM('Bug', 'Lag / Performance', 'Lost Items', 'Player Report', 'Appeal', 'Suggestion', 'Other') NOT NULL,
  priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
  user_impact ENUM('Just me', 'Multiple players', 'Whole server') NOT NULL,
  user_urgency ENUM('Can wait', 'Annoying but playable', 'Blocking gameplay', 'Server is unusable') NOT NULL,
  ai_severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
  ai_confidence DECIMAL(4,3) NOT NULL DEFAULT 0,
  ai_reason VARCHAR(500) NOT NULL DEFAULT 'AI classifier unavailable; defaulted to Medium.',
  admin_priority_override ENUM('Low', 'Medium', 'High', 'Critical') NULL,
  status ENUM('Open', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Open',
  description TEXT NOT NULL,
  evidence_link VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tickets_ticket_id (ticket_id),
  KEY idx_tickets_status (status),
  KEY idx_tickets_priority (priority),
  KEY idx_tickets_ai_severity (ai_severity),
  KEY idx_tickets_admin_priority_override (admin_priority_override),
  KEY idx_tickets_category (category),
  KEY idx_tickets_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_notes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  note TEXT NOT NULL,
  created_by VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_notes_ticket_id (ticket_id),
  CONSTRAINT fk_admin_notes_ticket
    FOREIGN KEY (ticket_id)
    REFERENCES tickets(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
