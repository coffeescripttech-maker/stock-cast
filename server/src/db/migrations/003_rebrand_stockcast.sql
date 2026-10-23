-- 003 — Rebrand stored settings from Ruiz Store to StockCast
-- ------------------------------------------------------------------
-- Updates the single-row JSON settings document so existing installs
-- show the new system name on the login page and printed receipts.
-- Additive + idempotent: only rewrites values that still contain the
-- old brand, so it is safe to run repeatedly.

UPDATE system_settings
SET settings = CAST(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(CAST(settings AS CHAR), 'RUIZ STORE', 'STOCKCAST'),
      'Ruiz Store', 'StockCast'),
    'Ruiz POS', 'StockCast'),
  'RuizStore', 'StockCast')
  AS JSON)
WHERE CAST(settings AS CHAR) LIKE '%Ruiz%';
