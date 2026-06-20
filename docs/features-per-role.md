# Features per Role

> **Ruiz Store POS** — Role-based access matrix

Two roles are available: **Owner** (admin) and **Staff**. Access to pages and features is controlled at the routing layer, with role badges displayed in the navigation bar.

---

## Role Overview

| Role     | Username | Default Password | Pages Accessible |
|----------|----------|------------------|------------------|
| **Owner** | `admin` | `admin123` | All 7 pages |
| **Staff** | `staff` | `staff123` | 2 pages: POS, Rewards |

---

## Feature Matrix

### 1. Point of Sale `/pos`
| Feature | Owner | Staff |
|---------|-------|-------|
| Search products by name or barcode | ✅ | ✅ |
| Keyboard navigation in search results | ✅ | ✅ |
| Add items to cart (auto-detect RT/WS type) | ✅ | ✅ |
| Toggle between Retail (RT) / Wholesale (WS) per item | ✅ | ✅ |
| Adjust item quantity (+/-) | ✅ | ✅ |
| Remove items from cart | ✅ | ✅ |
| Clear entire cart | ✅ | ✅ |
| Link customer via NFC tag or phone number | ✅ | ✅ |
| View customer tier (Bronze/Silver/Gold) when linked | ✅ | ✅ |
| Redeem customer loyalty points | ✅ | ✅ |
| View real-time order totals (subtotal, discount, grand total) | ✅ | ✅ |
| Process payment (cash tendered, change computation) | ✅ | ✅ |
| Print receipt (Enter or F4) | ✅ | ✅ |
| View and print last receipt | ✅ | ✅ |
| Barcode scanner modal (F12) | ✅ | ✅ |
| Keyboard shortcuts (F4, F8, F9, F11, F12) | ✅ | ✅ |

### 2. Dashboard `/dashboard`
| Feature | Owner | Staff |
|---------|-------|-------|
| Today's sales stat card | ✅ | ❌ |
| Retail low stock count (≤10 units) | ✅ | ❌ |
| Wholesale low stock count (≤30 units) | ✅ | ❌ |
| Today's transaction count | ✅ | ❌ |
| Weekly sales bar chart | ✅ | ❌ |
| Retail stock alerts with AI reorder recommendations | ✅ | ❌ |
| Wholesale stock alerts with AI reorder recommendations | ✅ | ❌ |
| Recent transactions list | ✅ | ❌ |
| Link to Inventory page from alerts | ✅ | ❌ |
| Link to Transactions page from recent list | ✅ | ❌ |

### 3. Inventory `/inventory`
| Feature | Owner | Staff |
|---------|-------|-------|
| View product stats (total, low stock, stock value) | ✅ | ❌ |
| Filter products by category | ✅ | ❌ |
| Search products by name or barcode | ✅ | ❌ |
| Product table (barcodes, prices, stock levels) | ✅ | ❌ |
| Add new product | ✅ | ❌ |
| Edit existing product | ✅ | ❌ |
| Delete product (with confirmation) | ✅ | ❌ |
| View retail & wholesale barcodes (modal) | ✅ | ❌ |
| Print barcodes | ✅ | ❌ |
| Simulate barcode generation on add/edit | ✅ | ❌ |
| Stock status indicators (Low Retail, Low Wholesale, In Stock) | ✅ | ❌ |

### 4. Transactions `/transactions`
| Feature | Owner | Staff |
|---------|-------|-------|
| Search transactions by ID or cashier | ✅ | ❌ |
| Filter by sale type (All, Retail, Wholesale, Mixed) | ✅ | ❌ |
| View transaction list (sorted by date) | ✅ | ❌ |
| View transaction detail modal | ✅ | ❌ |
| See customer info on linked transactions | ✅ | ❌ |
| View item breakdown with prices | ✅ | ❌ |
| View payment details (tendered, change) | ✅ | ❌ |
| Void transaction (with confirmation) | ✅ | ❌ |

### 5. Rewards & Customers `/rewards`
| Feature | Owner | Staff |
|---------|-------|-------|
| View customer stats (total customers, points issued) | ✅ | ✅ |
| Search customers by name, phone, or NFC tag | ✅ | ✅ |
| Customer cards with tier badges | ✅ | ✅ |
| View customer points and total spent | ✅ | ✅ |
| Add new customer | ✅ | ✅ |
| Edit customer details | ✅ | ✅ |
| Delete customer | ✅ | ✅ |
| Adjust customer points (+ / -) | ✅ | ✅ |
| Configure rewards settings (earn rate, redeem, tier thresholds) | ✅ | ✅ |

### 6. Reports `/reports`
| Feature | Owner | Staff |
|---------|-------|-------|
| Switch between Transaction & Inventory reports | ✅ | ❌ |
| Filter transactions by period (Past Week, Past Month, All Time) | ✅ | ❌ |
| Total Sales, Transaction Count, Avg per Transaction stats | ✅ | ❌ |
| Daily sales bar chart | ✅ | ❌ |
| Sales by type pie chart (Retail vs Wholesale vs Mixed) | ✅ | ❌ |
| Transaction detail table | ✅ | ❌ |
| Inventory stock value total | ✅ | ❌ |
| Stock value breakdown by product (horizontal bar chart) | ✅ | ❌ |
| Inventory detail table (per-product stock & value) | ✅ | ❌ |
| Export report as CSV | ✅ | ❌ |

### 7. Audit Trail `/audit`
| Feature | Owner | Staff |
|---------|-------|-------|
| Search audit entries by action, user, or details | ✅ | ❌ |
| Filter by action type | ✅ | ❌ |
| View entry count | ✅ | ❌ |
| View action, timestamp, user, and role per entry | ✅ | ❌ |
| Color-coded action badges | ✅ | ❌ |
| Clear audit log (with confirmation) | ✅ | ❌ |

---

## Navigation

The top navigation bar automatically adapts to the logged-in user's role:

- **Owner** sees all 7 navigation tabs: Dashboard, Point of Sale, Inventory, Transactions, Rewards, Reports, Audit Trail.
- **Staff** sees only 2 navigation tabs: Point of Sale, Rewards.

Unauthorized page access is blocked at the route level — staff are redirected to `/pos` if they manually navigate to an owner-only URL.

---

## Authentication

| Feature | Owner | Staff |
|---------|-------|-------|
| Login with username/password | ✅ | ✅ |
| Role-based landing page (Dashboard vs POS) | ✅ | ✅ |
| Session-based authentication (Zustand store) | ✅ | ✅ |
| Audit logging of login/logout | ✅ | ✅ |
| Demo accounts displayed on login page | ✅ | ✅ |

---

*Last updated: June 2026*
