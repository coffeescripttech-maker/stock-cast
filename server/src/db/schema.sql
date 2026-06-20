-- Ruiz Store POS — Database Schema
-- Run: mysql -u root -p ruizpos < server/src/db/schema.sql

CREATE DATABASE IF NOT EXISTS ruizpos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ruizpos;

-- -----------------------------------------------------------
-- Categories (lookup table, seeded from CATEGORIES constant)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id         TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Users (replaces hardcoded ACCOUNTS object)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)       NOT NULL UNIQUE,
  password_hash VARCHAR(255)      NOT NULL,
  display_name  VARCHAR(100)      NOT NULL,
  role          ENUM('owner','staff') NOT NULL DEFAULT 'staff',
  is_active     BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Products (inventory catalog)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
  retail_barcode    VARCHAR(50)       NOT NULL,
  wholesale_barcode VARCHAR(50)       NOT NULL,
  name              VARCHAR(200)      NOT NULL,
  retail_price      DECIMAL(10,2)     NOT NULL,
  wholesale_price   DECIMAL(10,2)     NOT NULL,
  retail_stock      INT               NOT NULL DEFAULT 0,
  wholesale_stock   INT               NOT NULL DEFAULT 0,
  default_type      ENUM('rt','ws')   NOT NULL DEFAULT 'rt',
  category_id       TINYINT UNSIGNED  NOT NULL,
  is_active         BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (category_id) REFERENCES categories(id),

  INDEX idx_retail_barcode (retail_barcode),
  INDEX idx_wholesale_barcode (wholesale_barcode),
  INDEX idx_name (name),
  INDEX idx_category (category_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Customers (loyalty / rewards program)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id          INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)   NOT NULL,
  phone       VARCHAR(20)    NOT NULL,
  nfc_tag     VARCHAR(50)    NOT NULL DEFAULT '',
  points      INT            NOT NULL DEFAULT 0,
  total_spent DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_phone (phone),
  INDEX idx_nfc_tag (nfc_tag),
  INDEX idx_name (name)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Transactions (sale headers)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id              BIGINT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  tx_number       VARCHAR(15)       NOT NULL UNIQUE,
  cashier_id      INT UNSIGNED      NOT NULL,
  type            ENUM('rt','ws','mixed') NOT NULL,
  status          ENUM('completed','voided') NOT NULL DEFAULT 'completed',
  raw_total       DECIMAL(10,2)     NOT NULL,
  discount        DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  total           DECIMAL(10,2)     NOT NULL,
  amount_tendered DECIMAL(10,2)     NOT NULL,
  change_amount   DECIMAL(10,2)     NOT NULL,
  customer_id     INT UNSIGNED      NULL,
  customer_name   VARCHAR(100)      NULL,
  points_earned   INT               NULL DEFAULT 0,
  points_redeemed INT               NULL DEFAULT 0,
  voided_at       DATETIME          NULL,
  voided_by       INT UNSIGNED      NULL,
  created_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (cashier_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (voided_by) REFERENCES users(id),

  INDEX idx_tx_number (tx_number),
  INDEX idx_created_at (created_at),
  INDEX idx_cashier (cashier_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_customer (customer_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Transaction Items (normalized line items)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS transaction_items (
  id              BIGINT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  transaction_id  BIGINT UNSIGNED   NOT NULL,
  product_id      INT UNSIGNED      NULL,
  product_name    VARCHAR(200)      NOT NULL,
  type            ENUM('rt','ws')   NOT NULL,
  price           DECIMAL(10,2)     NOT NULL,
  qty             INT               NOT NULL,
  subtotal        DECIMAL(10,2)     NOT NULL,

  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),

  INDEX idx_transaction (transaction_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Rewards Config (single-row configuration)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS rewards_config (
  id            TINYINT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  earn_rate     DECIMAL(5,1)      NOT NULL DEFAULT 10.0,
  redeem_every  INT               NOT NULL DEFAULT 100,
  redeem_value  DECIMAL(10,2)     NOT NULL DEFAULT 10.00,
  bronze_min    INT               NOT NULL DEFAULT 0,
  silver_min    INT               NOT NULL DEFAULT 500,
  gold_min      INT               NOT NULL DEFAULT 2000,
  updated_by    INT UNSIGNED      NULL,
  updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Audit Log (append-only system activity log)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGINT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  action      VARCHAR(50)      NOT NULL,
  details     TEXT             NOT NULL,
  user_name   VARCHAR(100)     NOT NULL,
  user_role   VARCHAR(20)      NOT NULL,
  created_at  DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX idx_action (action),
  INDEX idx_user (user_name),
  INDEX idx_created_at (created_at),
  INDEX idx_action_created (action, created_at)
) ENGINE=InnoDB;
