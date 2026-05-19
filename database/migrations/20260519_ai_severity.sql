USE survivalkendy_tickets;

ALTER TABLE tickets
  ADD COLUMN user_impact ENUM('Just me', 'Multiple players', 'Whole server') NOT NULL DEFAULT 'Just me' AFTER priority,
  ADD COLUMN user_urgency ENUM('Can wait', 'Annoying but playable', 'Blocking gameplay', 'Server is unusable') NOT NULL DEFAULT 'Can wait' AFTER user_impact,
  ADD COLUMN ai_severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium' AFTER user_urgency,
  ADD COLUMN ai_confidence DECIMAL(4,3) NOT NULL DEFAULT 0 AFTER ai_severity,
  ADD COLUMN ai_reason VARCHAR(500) NOT NULL DEFAULT 'AI classifier unavailable; defaulted to Medium.' AFTER ai_confidence,
  ADD COLUMN admin_priority_override ENUM('Low', 'Medium', 'High', 'Critical') NULL AFTER ai_reason,
  ADD KEY idx_tickets_ai_severity (ai_severity),
  ADD KEY idx_tickets_admin_priority_override (admin_priority_override);

UPDATE tickets
SET ai_severity = priority,
    ai_confidence = 1,
    ai_reason = 'Imported from legacy user-selected priority.'
WHERE ai_reason = 'AI classifier unavailable; defaulted to Medium.';
