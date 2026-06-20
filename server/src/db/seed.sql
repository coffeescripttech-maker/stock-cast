-- Ruiz Store POS — Seed Data
-- Run after schema.sql: mysql -u root -p ruizpos < server/src/db/seed.sql

USE ruizpos;

-- -----------------------------------------------------------
-- Categories (matches CATEGORIES constant in frontend)
-- -----------------------------------------------------------
INSERT INTO categories (name) VALUES
  ('Beverage'),
  ('Food'),
  ('Snacks'),
  ('Dairy'),
  ('Household'),
  ('Personal Care'),
  ('Frozen'),
  ('Others')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- -----------------------------------------------------------
-- Users (default accounts; passwords are bcrypt hashes)
-- admin / admin123
-- staff / staff123
-- -----------------------------------------------------------
INSERT INTO users (username, password_hash, display_name, role) VALUES
  ('admin', '$2b$10$0ilZFXwEGqvV.ttP.aN7/u2qjqQ0AZ6FP0Mm1gLnrVcAsGEEE1yJW', 'Store Owner', 'owner'),
  ('staff', '$2b$10$M16NNZg0h/zO5vLk.ccnsO8yHZHpDKwFz4auEfc.Zk1GNOcPMAPW2', 'Store Staff', 'staff')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- -----------------------------------------------------------
-- Products (sample data matching defaultProducts)
-- -----------------------------------------------------------
SET @bev_id = (SELECT id FROM categories WHERE name = 'Beverage');
SET @snack_id = (SELECT id FROM categories WHERE name = 'Snacks');
SET @food_id = (SELECT id FROM categories WHERE name = 'Food');

INSERT INTO products (retail_barcode, wholesale_barcode, name, retail_price, wholesale_price, retail_stock, wholesale_stock, default_type, category_id) VALUES
  ('1234567890', '2234567890', 'Coca Cola 350ml',        25,   240,  100, 12,  'ws', @bev_id),
  ('1234567898', '2234567898', 'Pringles Original',       85,    70,  10,  30,  'rt', @snack_id),
  ('1234567892', '2234567892', 'Nestle Coffee 3-in-1',    8.5,   7,  163, 10,  'rt', @bev_id),
  ('1234567893', '2234567893', 'Lucky Me Pancit Canton', 15,    12,  150,  3,  'rt', @food_id),
  ('33',         '2200000033', 'Sky Flakes Crackers',     30,    25,   5,  33,  'rt', @snack_id);

-- -----------------------------------------------------------
-- Customers (sample loyalty customers)
-- -----------------------------------------------------------
INSERT INTO customers (name, phone, nfc_tag, points, total_spent) VALUES
  ('Maria Santos',  '09171234567', 'NFC-001234',  580,  5800),
  ('Juan dela Cruz', '09281234567', 'NFC-002345', 2100, 21000),
  ('Ana Reyes',     '09391234567', 'NFC-003456',  250,  2500);

-- -----------------------------------------------------------
-- Rewards Config (single default row)
-- -----------------------------------------------------------
INSERT INTO rewards_config (id, earn_rate, redeem_every, redeem_value, bronze_min, silver_min, gold_min)
VALUES (1, 10, 100, 10, 0, 500, 2000)
ON DUPLICATE KEY UPDATE id = id;

-- -----------------------------------------------------------
-- Sample Transactions (so dashboard/reports have data)
-- -----------------------------------------------------------
-- Reference IDs: admin = 1, staff = 2
-- Products: Coca Cola=1, Pringles=2, Nestle Coffee=3, Lucky Me=4, Sky Flakes=5
-- Customers: Maria=1, Juan=2, Ana=3

INSERT INTO transactions (tx_number, cashier_id, type, status, raw_total, discount, total, amount_tendered, change_amount, customer_id, points_earned, created_at)
VALUES
  ('20260619-0001', 1, 'ws', 'completed', 2880, 0, 2880, 3000, 120, NULL, 288, NOW() - INTERVAL 2 DAY),
  ('20260619-0002', 1, 'ws', 'completed', 6000, 0, 6000, 6000, 0, 1, 600, NOW() - INTERVAL 2 DAY),
  ('20260618-0001', 1, 'mixed', 'completed', 4162, 0, 4162, 4200, 38, 2, 416, NOW() - INTERVAL 3 DAY),
  ('20260618-0002', 1, 'rt', 'completed', 8.5, 0, 8.5, 10, 1.5, NULL, 0, NOW() - INTERVAL 3 DAY),
  ('20260620-0001', 2, 'ws', 'completed', 240, 10, 230, 250, 20, 1, 23, NOW()),
  ('20260620-0002', 1, 'rt', 'completed', 170, 0, 170, 200, 30, NULL, 17, NOW()),
  ('20260620-0003', 1, 'mixed', 'completed', 520, 20, 500, 500, 0, 3, 50, NOW());

-- Update customer_name denormalized fields and customer points/spent via transaction history
UPDATE transactions SET customer_name = 'Maria Santos' WHERE customer_id = 1;
UPDATE transactions SET customer_name = 'Juan dela Cruz' WHERE customer_id = 2;
UPDATE transactions SET customer_name = 'Ana Reyes' WHERE customer_id = 3;

INSERT INTO transaction_items (transaction_id, product_id, product_name, type, price, qty, subtotal)
SELECT t.id, 1, 'Coca Cola 350ml', 'ws', 240, 12, 2880
FROM transactions t WHERE t.tx_number = '20260619-0001';

INSERT INTO transaction_items (transaction_id, product_id, product_name, type, price, qty, subtotal)
SELECT t.id, 4, 'Lucky Me Pancit Canton', 'ws', 12, 25, 6000
FROM transactions t WHERE t.tx_number = '20260619-0002';

INSERT INTO transaction_items (transaction_id, product_id, product_name, type, price, qty, subtotal)
SELECT t.id, 2, 'Pringles Original', 'rt', 85, 2, 170
FROM transactions t WHERE t.tx_number = '20260618-0001'
UNION ALL
SELECT t.id, 1, 'Coca Cola 350ml', 'ws', 42, 97, 4074
FROM transactions t WHERE t.tx_number = '20260618-0001';

INSERT INTO transaction_items (transaction_id, product_id, product_name, type, price, qty, subtotal)
SELECT t.id, 3, 'Nestle Coffee 3-in-1', 'rt', 8.5, 1, 8.5
FROM transactions t WHERE t.tx_number = '20260618-0002';

INSERT INTO transaction_items (transaction_id, product_id, product_name, type, price, qty, subtotal)
SELECT t.id, 1, 'Coca Cola 350ml', 'ws', 240, 1, 240
FROM transactions t WHERE t.tx_number = '20260620-0001';

INSERT INTO transaction_items (transaction_id, product_id, product_name, type, price, qty, subtotal)
SELECT t.id, 2, 'Pringles Original', 'rt', 85, 2, 170
FROM transactions t WHERE t.tx_number = '20260620-0002';

INSERT INTO transaction_items (transaction_id, product_id, product_name, type, price, qty, subtotal)
SELECT t.id, 5, 'Sky Flakes Crackers', 'ws', 250, 2, 500
FROM transactions t WHERE t.tx_number = '20260620-0003'
UNION ALL
SELECT t.id, 3, 'Nestle Coffee 3-in-1', 'rt', 8.5, 2, 17
FROM transactions t WHERE t.tx_number = '20260620-0003';
