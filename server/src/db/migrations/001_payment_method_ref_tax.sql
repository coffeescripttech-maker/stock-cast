-- 001 — Payment method, reference, and tax per sale
-- ------------------------------------------------------------------
-- Adds to `transactions`:
--   payment_method  ENUM('cash','gcash','maya') NOT NULL DEFAULT 'cash'
--   payment_ref     VARCHAR(50) NULL
--   tax_amount      DECIMAL(10,2) NOT NULL DEFAULT 0.00
-- Additive + idempotent: skips columns that already exist, so it is
-- safe even when the columns were applied previously by hand.

SET @db = DATABASE();

SELECT 'payment_method' AS step;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'payment_method');
SET @s := IF(@c = 0,
  'ALTER TABLE transactions ADD COLUMN payment_method ENUM(''cash'',''gcash'',''maya'') NOT NULL DEFAULT ''cash'' AFTER change_amount',
  'SELECT ''payment_method: already exists, skipping'' AS status');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'payment_ref' AS step;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'payment_ref');
SET @s := IF(@c = 0,
  'ALTER TABLE transactions ADD COLUMN payment_ref VARCHAR(50) NULL AFTER payment_method',
  'SELECT ''payment_ref: already exists, skipping'' AS status');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'tax_amount' AS step;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'tax_amount');
SET @s := IF(@c = 0,
  'ALTER TABLE transactions ADD COLUMN tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER payment_ref',
  'SELECT ''tax_amount: already exists, skipping'' AS status');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;