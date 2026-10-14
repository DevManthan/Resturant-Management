# Luxe Dine - Backend REST & WebSocket API

Production-grade, full-stack backend service for Luxe Dine Smart Restaurant Management and Business Intelligence SaaS suite.

---

## Architecture Overview

* **Runtime:** Node.js (ES Modules)
* **Framework:** Express.js REST API
* **Real-time Layer:** Socket.io (WebSocket for KDS ticketing and waiter calls)
* **Database:** PostgreSQL (9 Normalized Relational Tables) with resilient mock fallback
* **Port:** `5000` (configurable via `.env`)

---

## Directory Structure

```
Backend/
├── .env.example            # Environment template
├── .env                    # Active local environment variables
├── package.json            # Dependencies & scripts
├── server.js               # Express app, Socket.io, & HTTP bootstrap
├── socket.js               # WebSocket events for KDS & waiter calls
├── config/
│   └── db.js               # PostgreSQL pool connection & in-memory mock store
├── db/
│   ├── schema.sql          # PostgreSQL DDL for all 9 normalized tables
│   ├── seed.sql            # Seed dataset matching Luxe Dine mock data
│   └── initDb.js           # Automated database initializer
├── controllers/
│   ├── ownerController.js  # Restaurant owner configuration & profile
│   ├── menuController.js   # Menu catalog, stock 86'ing & dish addition
│   ├── orderController.js  # Order placement & KDS ticketing
│   ├── bookingController.js# Table reservations & floorplan states
│   ├── billController.js   # 5% GST computation & smart split-billing
│   ├── reviewController.js # Guest feedback and rating metrics
│   └── reportController.js # BI analytics & EOD batch pipeline
├── services/
│   ├── kdsScheduler.js     # FIFO, prep-time sync, and SLA escalation (>80%)
│   ├── splitBilling.js     # 5% GST aggregate calculation & equal/itemized split
│   └── eodPipeline.js      # Automated midnight analytical aggregation
└── routes/
    ├── ownerRoutes.js      # /api/owner
    ├── menuRoutes.js       # /api/menu
    ├── orderRoutes.js      # /api/orders
    ├── bookingRoutes.js    # /api/bookings
    ├── billRoutes.js       # /api/bills
    ├── reviewRoutes.js     # /api/reviews
    └── reportRoutes.js     # /api/reports
```

---

## Database Architecture (PostgreSQL)

The database persistence layer consists of **9 fully normalized relational tables**:

1. **`owner`**: Multi-tenant/Single restaurant profile, legal address, statutory GSTIN, currency, operating hours, and encrypted password hash.
2. **`customer`**: Guest profiles, phone, email, and visit/loyalty history.
3. **`booking`**: Table reservation schedules with party count stepper, preferences, and status.
4. **`menu_items`**: Dish catalog, categories, selling price, food cost price, kitchen `prep_time`, and `in_stock` boolean.
5. **`orders`**: Master orders linked to table, booking, and customer with tax, subtotal, and status.
6. **`order_details`**: Line items with **snapshotted `unit_price`** to preserve historical pricing integrity.
7. **`bill`**: Settlement invoice records with aggregate **5% GST** tax calculation and payment modes (Cash, Card, UPI, Split).
8. **`review`**: Customer ratings (Food quality, Service, Comments, Anonymous toggle).
9. **`daily_reports`**: EOD analytical snapshots (Total revenue, Profit, Margin %, Peak hour, Payment breakdown).

---

## Setup & PostgreSQL Configuration

### 1. Configure `.env`
Update `Backend/.env` with your PostgreSQL database credentials:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=luxedine_db
PG_USER=postgres
PG_PASSWORD=your_password_here
PG_SSL=false
```

### 2. Initialize PostgreSQL Database (Schema + Seed Data)
Create the database in PostgreSQL if it doesn't already exist:
```sql
CREATE DATABASE luxedine_db;
```

Run the automated initializer script:
```bash
npm run db:init
```
This executes `db/schema.sql` (creating all 9 tables and indexes) followed by `db/seed.sql` (populating initial menu, owner, and active orders).

### 3. Start the Server
```bash
# Production mode
npm start

# Development mode (auto-reload)
npm run dev
```

> **Note on Database Resiliency:** If PostgreSQL is temporarily offline or credentials are not yet configured, the backend automatically boots in **Resilient In-Memory Relational Mock Mode** with all 9 tables seeded, allowing API testing and frontend integration without interruptions.

---

## REST API Reference

### Owner & Settings
* `GET /api/owner` — Get current owner and restaurant profile.
* `PUT /api/owner` — Update restaurant details, GST rules, or operating hours.

### Menu Catalog & Inventory Stock Toggles
* `GET /api/menu` — Fetch catalog (query params: `?category=Mains&in_stock=true`).
* `POST /api/menu` — Add new dish (name, category, price, cost price, prep time, initial stock).
* `PATCH /api/menu/:id/stock` — Toggle In-Stock / 86'd out-of-stock status.
* `DELETE /api/menu/:id` — Delete menu item.

### Orders & Kitchen Display System (KDS)
* `GET /api/orders` — List all orders with line items.
* `GET /api/orders/kds` — Retrieve prioritized KDS queue (FIFO + prep sync + SLA escalation >80%).
* `POST /api/orders` — Place order (snapshots historical price, emits WebSocket to kitchen).
* `PATCH /api/orders/:id/status` — Advance order state (`pending` $\rightarrow$ `preparing` $\rightarrow$ `ready` $\rightarrow$ `served` $\rightarrow$ `completed`).

### Bookings & Floorplan
* `GET /api/bookings` — Fetch table reservations.
* `POST /api/bookings` — Create reservation (broadcasts `Reserved` table status).
* `PATCH /api/bookings/:id/status` — Update booking status (`Confirmed`, `Seated`, `Cancelled`).

### Billing, 5% GST & Split-Billing
* `GET /api/bills` — Get settled bills.
* `POST /api/bills/calculate` — Compute 5% GST across aggregate subtotal.
* `POST /api/bills/split` — Split bill (`EQUAL` with penny distribution or `ITEMIZED` with pro-rata tax).
* `POST /api/bills/settle` — Finalize bill payment (Cash, Card, UPI, Split).

### Business Intelligence & Daily Reports
* `GET /api/reports/analytics` — Executive dashboard KPIs, category revenue breakdown, and sales trends.
* `GET /api/reports/daily` — Historical daily EOD snapshots.
* `POST /api/reports/eod` — Trigger End-of-Day analytical pipeline for date.

---

## WebSocket Events (Socket.io)

| Event Name | Direction | Payload Description |
| :--- | :--- | :--- |
| `join_room` | Client $\rightarrow$ Server | Room identifier (`kitchen`, `admin`, `table-102`) |
| `call_waiter` | Client $\rightarrow$ Server | `{ table_id, reason }` (Triggered by customer FAB) |
| `waiter_called` | Server $\rightarrow$ Client | Broadcasts waiter alert with timestamp to staff |
| `acknowledge_waiter_call` | Client $\rightarrow$ Server | Staff marks waiter request resolved |
| `kds_ticket_updated` | Bi-directional | Real-time kitchen ticket status sync |
| `table_status_updated` | Server $\rightarrow$ Client | Table floorplan occupancy updates |
