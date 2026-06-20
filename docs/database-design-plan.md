# Database Design Plan

> **Ruiz Store POS** — Full-stack extension with MySQL + Node.js + Express REST API
>
> **Convention:** `snake_case` everywhere — TypeScript types → MySQL columns → JSON API keys.
>
> **Query Layer:** Direct MySQL2 driver + prepared statements. No ORM.

---

## 1. Naming & Encoding Rules

| Layer | Convention | Example |
|-------|-----------|---------|
| MySQL columns | `snake_case` | `retail_barcode`, `total_spent` |
| MySQL tables | `snake_case` (plural) | `transaction_items`, `audit_log` |
| Node.js / TS types | `snake_case` | `product_name`, `amount_tendered` |
| JSON API keys | `snake_case` | `{ "customer_name": "…" }` |
| JS constants | `SCREAMING_SNAKE` | `DEFAULT_EARN_RATE` |
| JS filenames | `kebab-case` | `transaction-routes.ts` |

- All text columns: `utf8mb4` / `utf8mb4_unicode_ci`
- All monetary columns: `DECIMAL(10,2)`
- All timestamps: `TIMESTAMP` / `DATETIME(3)` (millisecond precision for audit)
- All primary keys: `INT` / `BIGINT` with `AUTO_INCREMENT` (never expose raw PK to frontend)

---

## 2. Entity Relationship Overview

```
users
  │
  ├─< created_by ── transactions ──> customer_id >── customers
  │                    │
  │              transaction_items
  │
  ├─< voided_by ── (transactions.voided_by)
  │
  ├─< updated_by ── rewards_config
  │
  └─< user_name ── audit_log (denormalized reference)

categories ──< category_id ── products

(audit_log is a standalone table with denormalized user info
 for historical integrity after user deletion)
```

---

## 3. MySQL Schema

### 3.1 `categories`

```sql
CREATE TABLE categories (
  id          TINYINT       UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50)   NOT NULL UNIQUE,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Seed data:**

```sql
INSERT INTO categories (name) VALUES
  ('Beverage'), ('Food'), ('Snacks'), ('Dairy'),
  ('Household'), ('Personal Care'), ('Frozen'), ('Others');
```

**Frontend mapping:** `CATEGORIES` constant → `categories` table.

---

### 3.2 `users`

Replaces the hardcoded `ACCOUNTS` object.

```sql
CREATE TABLE users (
  id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)   NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,     -- bcrypt hash
  display_name  VARCHAR(100)  NOT NULL,
  role          ENUM('owner','staff') NOT NULL DEFAULT 'staff',
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

**Seed data:**

```sql
INSERT INTO users (username, password_hash, display_name, role) VALUES
  ('admin', '$2b$10$...', 'Store Owner', 'owner'),   -- bcrypt('admin123')
  ('staff', '$2b$10$...', 'Store Staff', 'staff');    -- bcrypt('staff123')
```

**TypeScript type:**

```typescript
interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  role: 'owner' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API response (never expose password_hash)
interface UserResponse {
  id: number;
  username: string;
  display_name: string;
  role: 'owner' | 'staff';
  is_active: boolean;
  created_at: string;
}

// Session (what the client caches)
interface UserSession {
  username: string;
  role: 'owner' | 'staff';
  display_name: string;
}
```

**Frontend mapping:**
| Frontend (camelCase) | DB (snake_case) | Notes |
|---------------------|-----------------|-------|
| `UserSession.name` | `display_name` | Transform at API boundary |
| `UserSession.username` | `username` | Direct match |
| `UserAccount.password` | `password_hash` | Never stored or transmitted |

---

### 3.3 `products`

```sql
CREATE TABLE products (
  id                INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  retail_barcode    VARCHAR(50)     NOT NULL,
  wholesale_barcode VARCHAR(50)     NOT NULL,
  name              VARCHAR(200)    NOT NULL,
  retail_price      DECIMAL(10,2)   NOT NULL,
  wholesale_price   DECIMAL(10,2)   NOT NULL,
  retail_stock      INT             NOT NULL DEFAULT 0,
  wholesale_stock   INT             NOT NULL DEFAULT 0,
  default_type      ENUM('rt','ws') NOT NULL DEFAULT 'rt',
  category_id       TINYINT UNSIGNED NOT NULL,
  is_active         BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (category_id) REFERENCES categories(id),

  INDEX idx_retail_barcode (retail_barcode),
  INDEX idx_wholesale_barcode (wholesale_barcode),
  INDEX idx_name (name),
  INDEX idx_category (category_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;
```

**TypeScript type:**

```typescript
interface ProductRow {
  id: number;
  retail_barcode: string;
  wholesale_barcode: string;
  name: string;
  retail_price: number;
  wholesale_price: number;
  retail_stock: number;
  wholesale_stock: number;
  default_type: 'rt' | 'ws';
  category_id: number;
  category_name?: string;         // joined from categories
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**Frontend mapping:**
| Frontend `Product` | DB (snake_case) | Notes |
|-------------------|-----------------|-------|
| `retailBarcode` | `retail_barcode` | |
| `wholesaleBarcode` | `wholesale_barcode` | |
| `retailPrice` | `retail_price` | |
| `wholesalePrice` | `wholesale_price` | |
| `retailStock` | `retail_stock` | |
| `wholesaleStock` | `wholesale_stock` | |
| `defaultType` | `default_type` | |
| `category` | `category_name` | Resolved via JOIN → `categories.name` |

---

### 3.4 `transactions`

```sql
CREATE TABLE transactions (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tx_number         VARCHAR(15)     NOT NULL UNIQUE,    -- e.g. '20260620-0001'
  cashier_id        INT UNSIGNED    NOT NULL,
  type              ENUM('rt','ws','mixed') NOT NULL,
  status            ENUM('completed','voided') NOT NULL DEFAULT 'completed',
  raw_total         DECIMAL(10,2)   NOT NULL,
  discount          DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  total             DECIMAL(10,2)   NOT NULL,
  amount_tendered   DECIMAL(10,2)   NOT NULL,
  change_amount     DECIMAL(10,2)   NOT NULL,
  customer_id       INT UNSIGNED    NULL,
  customer_name     VARCHAR(100)    NULL,               -- denormalized for history
  points_earned     INT             NULL DEFAULT 0,
  points_redeemed   INT             NULL DEFAULT 0,
  voided_at         DATETIME        NULL,
  voided_by         INT UNSIGNED    NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
```

**Transaction number generation:** Handled by the application layer:

```sql
-- Called by the API when creating a transaction
SELECT COUNT(*) + 1 AS next_seq
FROM transactions
WHERE tx_number LIKE CONCAT(DATE_FORMAT(NOW(), '%Y%m%d'), '-%');
```

**TypeScript type:**

```typescript
interface TransactionRow {
  id: number;                    // internal PK (not exposed to frontend)
  tx_number: string;             // displayed as transaction ID
  cashier_id: number;
  cashier_name?: string;         // joined from users
  type: 'rt' | 'ws' | 'mixed';
  status: 'completed' | 'voided';
  raw_total: number;
  discount: number;
  total: number;
  amount_tendered: number;
  change_amount: number;
  customer_id: number | null;
  customer_name: string | null;
  points_earned: number | null;
  points_redeemed: number | null;
  voided_at: string | null;
  voided_by: number | null;
  created_at: string;
  items?: TransactionItemRow[];  // populated when detail is needed
}
```

**Frontend mapping:**
| Frontend `Transaction` | DB / API (snake_case) |
|------------------------|----------------------|
| `id` | `tx_number` (the API sets `tx_number` as `id` in the response) |
| `date` | `created_at` |
| `cashier` | `cashier_name` (joined) |
| `rawTotal` | `raw_total` |
| `amountTendered` | `amount_tendered` |
| `change` | `change_amount` |
| `pointsEarned` | `points_earned` |
| `pointsRedeemed` | `points_redeemed` |
| `nfcTag` | `nfc_tag` |

> **Note on `id` vs `tx_number`:** The API response maps `tx_number` → `id` in the camelCase-to-snake_case transform so the frontend's `Transaction.id` remains the string ID. The internal `id` (BIGINT) is never exposed.

---

### 3.5 `transaction_items`

Normalizes the `Transaction.items[]` array.

```sql
CREATE TABLE transaction_items (
  id              BIGINT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  transaction_id  BIGINT UNSIGNED   NOT NULL,
  product_id      INT UNSIGNED      NULL,               -- nullable for historical orphan safety
  product_name    VARCHAR(200)      NOT NULL,            -- denormalized for history
  type            ENUM('rt','ws')   NOT NULL,
  price           DECIMAL(10,2)     NOT NULL,
  qty             INT               NOT NULL,
  subtotal        DECIMAL(10,2)     NOT NULL,

  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),

  INDEX idx_transaction (transaction_id)
) ENGINE=InnoDB;
```

**TypeScript type:**

```typescript
interface TransactionItemRow {
  id: number;
  transaction_id: number;
  product_id: number | null;
  product_name: string;
  type: 'rt' | 'ws';
  price: number;
  qty: number;
  subtotal: number;
}
```

**Frontend mapping:**
| Frontend `TransactionItem` | DB (snake_case) |
|---------------------|-----------------|
| `name` | `product_name` |
| `qty` | `qty` |
| `type` | `type` |
| `price` | `price` |
| `subtotal` | `subtotal` |

---

### 3.6 `customers`

```sql
CREATE TABLE customers (
  id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)    NOT NULL,
  phone         VARCHAR(20)     NOT NULL,
  nfc_tag       VARCHAR(50)     NOT NULL DEFAULT '',
  points        INT             NOT NULL DEFAULT 0,
  total_spent   DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_phone (phone),
  INDEX idx_nfc_tag (nfc_tag),
  INDEX idx_name (name)
) ENGINE=InnoDB;
```

**TypeScript type:**

```typescript
interface CustomerRow {
  id: number;
  name: string;
  phone: string;
  nfc_tag: string;
  points: number;
  total_spent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**Frontend mapping:**
| Frontend `Customer` | DB (snake_case) |
|--------------------|-----------------|
| `nfcTag` | `nfc_tag` |
| `totalSpent` | `total_spent` |
| `joinDate` | `created_at` |

---

### 3.7 `rewards_config`

A single-row configuration table.

```sql
CREATE TABLE rewards_config (
  id            TINYINT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,   -- always 1
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

-- Seed the initial row
INSERT INTO rewards_config SET id = 1;
```

**TypeScript type:**

```typescript
interface RewardsConfigRow {
  id: number;
  earn_rate: number;
  redeem_every: number;
  redeem_value: number;
  bronze_min: number;
  silver_min: number;
  gold_min: number;
  updated_by: number | null;
  updated_at: string;
}
```

**Frontend mapping:** Direct field-for-field, just snake_case.

---

### 3.8 `audit_log`

Append-only log table (never updated, never deleted via API).

```sql
CREATE TABLE audit_log (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  action      VARCHAR(50)     NOT NULL,
  details     TEXT            NOT NULL,
  user_name   VARCHAR(100)    NOT NULL,            -- denormalized for history
  user_role   VARCHAR(20)     NOT NULL,            -- denormalized for history
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),  -- millisecond precision

  INDEX idx_action (action),
  INDEX idx_user (user_name),
  INDEX idx_created_at (created_at),
  INDEX idx_action_created (action, created_at)    -- composite for filter queries
) ENGINE=InnoDB;
```

**TypeScript type:**

```typescript
interface AuditEntryRow {
  id: number;
  action: string;
  details: string;
  user_name: string;
  user_role: string;
  created_at: string;        // ISO string with milliseconds
}
```

**Frontend mapping:**
| Frontend `AuditEntry` | DB (snake_case) |
|----------------------|-----------------|
| `timestamp` | `created_at` |
| `user` | `user_name` |
| `role` | `user_role` |

---

## 4. Index & Constraint Summary

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `users` | `username` | UNIQUE | Login lookup |
| `products` | `retail_barcode` | INDEX | Scanner / search |
| `products` | `wholesale_barcode` | INDEX | Scanner / search |
| `products` | `name` | INDEX | Product search |
| `products` | `category_id` | INDEX | Category filter |
| `transactions` | `tx_number` | UNIQUE | Transaction lookup |
| `transactions` | `created_at` | INDEX | Date-range queries (reports) |
| `transactions` | `cashier_id` | INDEX | Cashier filter |
| `transactions` | `type` | INDEX | Sales-type filter |
| `transactions` | `status` | INDEX | Active vs voided |
| `transaction_items` | `transaction_id` | INDEX | Line-item lookup |
| `customers` | `phone` | INDEX | Phone search |
| `customers` | `nfc_tag` | INDEX | NFC tap lookup |
| `audit_log` | `action` | INDEX | Action filter |
| `audit_log` | `created_at` | INDEX | Time-range queries |
| `audit_log` | `(action, created_at)` | COMPOSITE | Filter + sort |

---

## 5. Express REST API Endpoints

Base URL: `/api`

### 5.1 Auth

| Method | Path | Description | DataStore Equivalent |
|--------|------|-------------|---------------------|
| `POST` | `/auth/login` | Login, return session token | `authStore.login()` |
| `POST` | `/auth/logout` | Invalidate session | `authStore.logout()` |
| `GET` | `/auth/me` | Current user session | `authStore.currentUser` |

**`POST /api/auth/login`**

```
Request:
{
  "username": "admin",
  "password": "admin123"
}

Response 200:
{
  "user": {
    "username": "admin",
    "display_name": "Store Owner",
    "role": "owner"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}

Response 401:
{ "error": "Invalid username or password" }
```

### 5.2 Products

| Method | Path | Description | DataStore Equivalent |
|--------|------|-------------|---------------------|
| `GET` | `/products` | List products (search, filter) | `dataStore.products` |
| `GET` | `/products/:id` | Single product detail | — |
| `POST` | `/products` | Create product | `addProduct()` |
| `PUT` | `/products/:id` | Update product | `updateProduct()` |
| `DELETE` | `/products/:id` | Delete product | `deleteProduct()` |
| `PATCH` | `/products/:id/stock` | Deduct stock | `deductStock()` |

**`GET /api/products`**

```
Query params:
  ?search=cola          (name or barcode LIKE)
  &category_id=1        (filter by category)
  &active=true          (default true)
  &page=1&limit=50      (pagination)

Response 200:
{
  "data": [
    {
      "id": 1,
      "retail_barcode": "1234567890",
      "wholesale_barcode": "2234567890",
      "name": "Coca Cola 350ml",
      "retail_price": 25.00,
      "wholesale_price": 240.00,
      "retail_stock": 100,
      "wholesale_stock": 12,
      "default_type": "ws",
      "category_id": 1,
      "category_name": "Beverage",
      "is_active": true,
      "created_at": "2026-06-20T00:00:00.000Z",
      "updated_at": "2026-06-20T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "low_stock_count": 3
  }
}
```

**`POST /api/products`**

```
Request:
{
  "retail_barcode": "9876543210",
  "wholesale_barcode": "229876543210",
  "name": "New Product",
  "retail_price": 50.00,
  "wholesale_price": 45.00,
  "retail_stock": 20,
  "wholesale_stock": 5,
  "default_type": "rt",
  "category_id": 3
}

Response 201:
{
  "id": 42,
  ... (the full product row)
}
```

### 5.3 Transactions

| Method | Path | Description | DataStore Equivalent |
|--------|------|-------------|---------------------|
| `GET` | `/transactions` | List transactions (search, filter) | `dataStore.transactions` |
| `GET` | `/transactions/:tx_number` | Detail with items | — |
| `POST` | `/transactions` | Complete a sale | `addTransaction()` |
| `PUT` | `/transactions/:tx_number/void` | Void transaction | `voidTransaction()` |
| `GET` | `/transactions/last-receipt` | Most recent receipt | (POS "last receipt") |

**`POST /api/transactions`**

```
Request:
{
  "cashier_id": 1,
  "type": "mixed",
  "items": [
    { "product_id": 1, "type": "ws", "qty": 12, "price": 240.00 },
    { "product_id": 2, "type": "rt", "qty": 2, "price": 85.00 }
  ],
  "amount_tendered": 4200.00,
  "customer_id": 1,
  "points_redeemed": 100
}

Response 201:
{
  "tx_number": "20260620-0001",
  "raw_total": 3050.00,
  "discount": 10.00,
  "total": 3040.00,
  "change_amount": 1160.00,
  "points_earned": 304,
  "customer_name": "Maria Santos",
  ...
}
```

**Transaction creation logic (in service layer):**

1. `START TRANSACTION`
2. Generate `tx_number` from sequence query
3. Calculate `raw_total` = SUM of (qty × price) from items
4. Calculate `discount` from points redeemed (if any)
5. Calculate `total = raw_total - discount`
6. Calculate `change_amount = amount_tendered - total`
7. Calculate `points_earned = floor(total / earn_rate)`
8. If `customer_id` provided: lock and update customer points + total_spent
9. Deduct product stock (lock row to prevent race)
10. Insert transaction row
11. Insert transaction_items rows
12. Log audit entry for `SALE_COMPLETED`
13. `COMMIT`

### 5.4 Customers

| Method | Path | Description | DataStore Equivalent |
|--------|------|-------------|---------------------|
| `GET` | `/customers` | List (search by name/phone/nfc) | `dataStore.customers` |
| `GET` | `/customers/:id` | Single customer | — |
| `POST` | `/customers` | Create customer | `addCustomer()` |
| `PUT` | `/customers/:id` | Update customer | `updateCustomer()` |
| `DELETE` | `/customers/:id` | Delete customer | `deleteCustomer()` |
| `PATCH` | `/customers/:id/points` | Adjust points | `adjustCustomerPoints()` |

### 5.5 Rewards Config

| Method | Path | Description | DataStore Equivalent |
|--------|------|-------------|---------------------|
| `GET` | `/rewards-config` | Get rewards config | `dataStore.rewardsConfig` |
| `PUT` | `/rewards-config` | Update rewards config | `updateRewardsConfig()` |

### 5.6 Audit Log

| Method | Path | Description | DataStore Equivalent |
|--------|------|-------------|---------------------|
| `GET` | `/audit-log` | List entries (search, filter) | `dataStore.auditLog` |
| `GET` | `/audit-log/actions` | Distinct action types | — |
| `DELETE` | `/audit-log` | Clear log (owner only) | `clearAuditLog()` |

### 5.7 Dashboard / Reports

| Method | Path | Description | Frontend Page |
|--------|------|-------------|---------------|
| `GET` | `/dashboard/stats` | Today's sales, counts | Dashboard |
| `GET` | `/dashboard/weekly-sales` | Daily bar chart data | Dashboard |
| `GET` | `/dashboard/low-stock` | Low stock alerts | Dashboard |
| `GET` | `/reports/transactions` | Filtered summary with aggregation | Reports |
| `GET` | `/reports/inventory` | Stock value breakdown | Reports |
| `GET` | `/reports/export/csv` | Download CSV export | Reports |

### 5.8 Categories

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/categories` | List all categories |

---

## 6. MySQL2 Query Patterns

### 6.1 Connection Pool (Node.js)

```typescript
// src/db/pool.ts
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'ruizpos',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ruizpos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});
```

### 6.2 Prepared Statements (parameterized — never interpolate)

```typescript
// ✅ CORRECT — parameterized query
const [rows] = await pool.query(
  `SELECT id, name, retail_price
   FROM products
   WHERE category_id = ?
     AND is_active = ?
     AND retail_stock > 0
   ORDER BY name`,
  [categoryId, true]
);

// ❌ NEVER — string interpolation
const [rows] = await pool.query(`SELECT * FROM products WHERE id = ${id}`);
```

### 6.3 Transaction (commit/rollback)

```typescript
import { pool } from '../db/pool';

async function createTransaction(data: CreateTransactionInput) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Generate tx number
    const [[{ next_seq }]] = await conn.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(tx_number, 10) AS UNSIGNED)), 0) + 1 AS next_seq
       FROM transactions
       WHERE tx_number LIKE CONCAT(?, '-%')`,
      [dateKey]
    );
    const txNumber = `${dateKey}-${String(next_seq).padStart(4, '0')}`;

    // 2. Insert transaction header
    const [headerResult] = await conn.query(
      `INSERT INTO transactions
         (tx_number, cashier_id, type, status, raw_total, discount, total,
          amount_tendered, change_amount, customer_id, points_earned, points_redeemed)
       VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [txNumber, data.cashierId, data.type, rawTotal, discount, total,
       data.amountTendered, change, data.customerId, pointsEarned, pointsRedeemed]
    );

    // 3. Insert line items
    for (const item of data.items) {
      await conn.query(
        `INSERT INTO transaction_items
           (transaction_id, product_id, product_name, type, price, qty, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [headerResult.insertId, item.productId, item.productName, item.type, item.price, item.qty, item.subtotal]
      );
    }

    // 4. Deduct stock
    for (const item of data.items) {
      const stockCol = item.type === 'ws' ? 'wholesale_stock' : 'retail_stock';
      await conn.query(
        `UPDATE products
         SET ${stockCol} = GREATEST(${stockCol} - ?, 0)
         WHERE id = ?`,
        [item.qty, item.productId]
      );
    }

    await conn.commit();
    return txNumber;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
```

### 6.4 Pagination (offset-based)

```typescript
const page = Math.max(1, Number(req.query.page) || 1);
const limit = Math.min(100, Number(req.query.limit) || 50);
const offset = (page - 1) * limit;

const [rows] = await pool.query(
  `SELECT SQL_CALC_FOUND_ROWS *
   FROM products
   WHERE is_active = TRUE
   ORDER BY name
   LIMIT ? OFFSET ?`,
  [limit, offset]
);
const [[{ total }]] = await pool.query('SELECT FOUND_ROWS() AS total');
```

### 6.5 Search (LIKE with sanitized input)

```typescript
const searchTerm = `%${req.query.search?.replace(/[%_]/g, '\\$&')}%`;

const [rows] = await pool.query(
  `SELECT p.*, c.name AS category_name
   FROM products p
   JOIN categories c ON c.id = p.category_id
   WHERE (p.name LIKE ? OR p.retail_barcode LIKE ?)
     AND p.is_active = TRUE
   ORDER BY p.name
   LIMIT 20`,
  [searchTerm, searchTerm]
);
```

---

## 7. TypeScript API Layer Structure

```
server/
├── src/
│   ├── db/
│   │   ├── pool.ts                 # MySQL2 connection pool
│   │   ├── schema.sql              # DDL for initial setup
│   │   └── seed.sql                # Default data
│   │
│   ├── types/
│   │   ├── product.types.ts        # ProductRow, ProductCreateInput, etc.
│   │   ├── transaction.types.ts
│   │   ├── customer.types.ts
│   │   ├── auth.types.ts
│   │   ├── audit.types.ts
│   │   └── common.types.ts         # PaginationMeta, ApiResponse<T>
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── product.routes.ts
│   │   ├── transaction.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── rewards.routes.ts
│   │   ├── audit.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── report.routes.ts
│   │   └── category.routes.ts
│   │
│   ├── controllers/               # Request parsing + response shaping
│   │   ├── auth.controller.ts
│   │   ├── product.controller.ts
│   │   └── ...
│   │
│   ├── services/                   # Business logic + SQL queries
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── transaction.service.ts
│   │   └── ...
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT verification
│   │   ├── role.middleware.ts      # Owner-only guard
│   │   ├── error.middleware.ts     # Global error handler
│   │   └── validate.middleware.ts  # Request body validation
│   │
│   ├── utils/
│   │   ├── password.ts            # bcrypt hash/compare
│   │   └── token.ts               # JWT sign/verify
│   │
│   └── app.ts                     # Express app setup
│
├── package.json
├── tsconfig.json
└── .env
```

### API Response Envelope

Every API response follows a consistent shape:

```typescript
// Success
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

// Error
interface ApiError {
  success: false;
  error: string;
  code?: string;     // e.g. 'INVALID_CREDENTIALS', 'NOT_FOUND', 'VALIDATION_ERROR'
  details?: any;
}

// Pagination
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
```

---

## 8. Authentication Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────┐
│  Frontend   │  POST   │  Express API  │  SQL   │  MySQL  │
│  (React)    │──/login──│  (Node.js)   │──query──│         │
│             │         │              │         │         │
│  Store JWT  │◄─token──│  bcrypt.compare│◄─hash──│ users   │
│  in memory  │         │  + sign JWT  │         │ table   │
│  + httponly │         │              │         │         │
│  cookie     │         │              │         │         │
└──────┬──────┘         └──────┬───────┘         └─────────┘
       │                       │
       │  All subsequent       │
       │  requests include     │
       │  Authorization:       │
       │  Bearer <token>       │
       └───────────────────────┘
```

**JWT payload:**

```typescript
interface JwtPayload {
  sub: number;           // user.id
  username: string;
  role: 'owner' | 'staff';
  display_name: string;
  iat: number;
  exp: number;           // 24h from issue
}
```

---

## 9. Middleware Pipeline

```
Request
  │
  ├─ cors()                     → Allow frontend origin
  ├─ express.json()             → Parse JSON body
  ├─ morgan()                   → HTTP request logging
  │
  ├─ auth.middleware.ts         → Verify JWT, attach req.user
  │    │
  │    ├─ (public routes pass)  → /api/auth/*, GET /api/categories
  │    │
  │    └─ role.middleware.ts    → Check user.role for owner-only routes
  │         │
  │         └─ validate.middleware.ts  → Zod schema validation
  │              │
  │              └─ controller → service → MySQL
  │                              │
  │                           response
  │
  └─ error.middleware.ts        → Catch-all error handler
```

**Owner-only routes** (mirror the frontend `OwnerRoute`):
- `POST/PUT/DELETE /api/products/*`
- `DELETE /api/transactions/*/void`
- `DELETE /api/customers/*` (if staff should not delete)
- `DELETE /api/audit-log`
- `PUT /api/rewards-config`
- `GET /api/dashboard/*`
- `GET /api/reports/*`

---

## 10. Frontend ↔ Backend Integration Plan

### Phase A: API Client Layer (in the React app)

```typescript
// src/api/client.ts — fetch wrapper with JWT injection
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T>(
  method: string,
  path: string,
  body?: any
): Promise<T> {
  const token = useAuthStore.getState().token; // or localStorage
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, err.error || 'Request failed');
  }
  return res.json();
}
```

### Phase B: Migrate Zustand Stores (incremental)

Keep the existing Zustand stores as the single source of truth. Replace the default data (from `constants.ts`) with API calls in a hydration layer:

```typescript
// src/stores/dataStore.ts — add hydration action
interface DataState {
  // ... existing fields ...

  // NEW: backend hydration
  hydrate: () => Promise<void>;
}

// Implementation
hydrate: async () => {
  const { data: products } = await api.get('/products?active=true&limit=1000');
  const { data: transactions } = await api.get('/transactions?limit=500');
  const { data: customers } = await api.get('/customers?limit=500');
  const { data: auditLog } = await api.get('/audit-log?limit=500');
  const { data: rewardsConfig } = await api.get('/rewards-config');

  set({
    products: products.map(fromSnakeCase),
    transactions: transactions.map(fromSnakeCase),
    customers: customers.map(fromSnakeCase),
    auditLog: auditLog.map(fromSnakeCase),
    rewardsConfig: fromSnakeCase(rewardsConfig),
  });
};
```

### Phase C: Snake ↔ Camel Transform

```typescript
// src/api/transform.ts
function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key.replace(/([A-Z])/g, '_$1').toLowerCase()] = value;
  }
  return result;
}

function fromSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = value;
  }
  return result;
}
```

---

## 11. Environment & Configuration

```env
# .env
DB_HOST=localhost
DB_PORT=3306
DB_USER=ruizpos
DB_PASSWORD=ruizpos_secret
DB_NAME=ruizpos

JWT_SECRET=a-strong-random-secret-at-least-32-chars
JWT_EXPIRES_IN=24h

PORT=3001
NODE_ENV=development

CORS_ORIGIN=http://localhost:5173
```

---

## 12. Future Extensibility

The schema is designed for these future additions without migration pain:

- **Multiple branches / stores:** Add `branches` table, add `branch_id` FK to `users`, `transactions`, `products`, `customers`.
- **Purchase orders / stock receiving:** Add `purchase_orders` and `purchase_order_items` tables referencing `products.id`.
- **Expiry tracking:** Add `expiry_date` to `products`, create `stock_batches` table.
- **Discount coupons / promos:** Add `promotions` table with conditions, reference in `transactions`.
- **Multiple payment methods:** Add `payments` table with split-tender support (cash/GCash/card).
- **Refunds / returns:** Add `refunds` table linking back to `transactions` and `transaction_items`.
- **User permissions (granular):** Add `permissions` and `user_permissions` tables alongside the existing `role` enum.
- **Real-time sync:** Add `updated_at` triggers and WebSocket events for multi-device stores.

---

## 13. Quick-Start SQL

The full DDL and seed data are available at `server/src/db/schema.sql` and `server/src/db/seed.sql` (to be created). To bootstrap:

```bash
mysql -u root -p -e "CREATE DATABASE ruizpos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p ruizpos < server/src/db/schema.sql
mysql -u root -p ruizpos < server/src/db/seed.sql
```

---

*Last updated: June 2026*
