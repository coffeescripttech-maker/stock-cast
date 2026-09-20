-- 002_password_resets.sql
-- Supports the self-service "Forgot Password?" flow.  A 6-digit numeric code is
-- generated when the user requests a reset.  Expires after 10 minutes.

CREATE TABLE IF NOT EXISTS password_resets (
  id         INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED  NOT NULL,
  code_hash  VARCHAR(255)  NOT NULL,
  expires_at DATETIME      NOT NULL,
  used       TINYINT(1)    NOT NULL DEFAULT 0,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_password_resets_user (user_id),
  INDEX idx_password_resets_expiry (expires_at),
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
