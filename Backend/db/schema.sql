-- ====================================================================
-- LUXE DINE: Relational Database Architecture (PostgreSQL DDL)
-- 9 Fully Normalized Relational Tables
-- ====================================================================

-- 1. OWNER: Restaurant profile, license, tax & fiscal rules
CREATE TABLE IF NOT EXISTS owner (
    owner_id SERIAL PRIMARY KEY,
    owner_name VARCHAR(150) NOT NULL,
    email_id VARCHAR(150) UNIQUE NOT NULL,
    phone_no VARCHAR(25) NOT NULL,
    restaurant_name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    gstin VARCHAR(30) DEFAULT '27AABCL1234F1Z9',
    currency VARCHAR(10) DEFAULT '₹',
    gst_rate NUMERIC(5,2) DEFAULT 5.00,
    open_time VARCHAR(20) DEFAULT '12:00 PM',
    close_time VARCHAR(20) DEFAULT '11:30 PM',
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CUSTOMER: Guest identities, visits, and loyalty tracking
CREATE TABLE IF NOT EXISTS customer (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    phone_no VARCHAR(25) NOT NULL,
    email VARCHAR(150),
    loyalty_points INT DEFAULT 0,
    first_visit TIMESTAMPTZ DEFAULT NOW(),
    last_visit TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BOOKING: Pre-arrival reservations with party steppers
CREATE TABLE IF NOT EXISTS booking (
    booking_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customer(customer_id) ON DELETE SET NULL,
    table_id VARCHAR(50) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time VARCHAR(20) NOT NULL,
    guest_count INT NOT NULL DEFAULT 2,
    special_preferences TEXT,
    status VARCHAR(50) DEFAULT 'Confirmed', -- Confirmed, Seated, Cancelled, Completed
    duration VARCHAR(50) DEFAULT '2 hours',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MENU_ITEMS: Catalog, pricing, cost margin, and kitchen prep SLA
CREATE TABLE IF NOT EXISTS menu_items (
    menu_id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES owner(owner_id) ON DELETE SET NULL,
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL, -- Mains, Starters, Desserts, Beverages
    price NUMERIC(10,2) NOT NULL,
    cost_price NUMERIC(10,2) DEFAULT 0,
    prep_time INT NOT NULL DEFAULT 15, -- Minutes required for cook
    image_url TEXT,
    discount NUMERIC(5,2) DEFAULT 0,
    in_stock BOOLEAN DEFAULT TRUE,
    description TEXT,
    daily_sales INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDERS: Master order tickets
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES booking(booking_id) ON DELETE SET NULL,
    customer_id INT REFERENCES customer(customer_id) ON DELETE SET NULL,
    table_id VARCHAR(50) NOT NULL,
    order_status VARCHAR(50) DEFAULT 'pending', -- pending, preparing, ready, served, completed, cancelled
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount NUMERIC(10,2) DEFAULT 0,
    tax NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    special_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDER_DETAILS: Order line items with snapshotted pricing
CREATE TABLE IF NOT EXISTS order_details (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    item_id INT REFERENCES menu_items(menu_id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL, -- Snapshotted historical unit price
    total_price NUMERIC(10,2) NOT NULL,
    note TEXT,
    status VARCHAR(50) DEFAULT 'pending' -- item-level prep tracking
);

-- 7. BILL: Settlement and statutory 5% GST tax receipts
CREATE TABLE IF NOT EXISTS bill (
    bill_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) ON DELETE SET NULL,
    customer_id INT REFERENCES customer(customer_id) ON DELETE SET NULL,
    bill_time TIMESTAMPTZ DEFAULT NOW(),
    subtotal NUMERIC(10,2) NOT NULL,
    discount_amt NUMERIC(10,2) DEFAULT 0,
    tax_amount NUMERIC(10,2) NOT NULL, -- 5% GST calculated over aggregate subtotal
    total_bill NUMERIC(10,2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'UPI', -- Cash, Card, UPI, Split
    payment_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Settled, Refunded
    payment_time TIMESTAMPTZ
);

-- 8. REVIEW: Guest ratings & feedback
CREATE TABLE IF NOT EXISTS review (
    review_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) ON DELETE SET NULL,
    customer_id INT REFERENCES customer(customer_id) ON DELETE SET NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    food_quality INT CHECK (food_quality >= 1 AND food_quality <= 5),
    service INT CHECK (service >= 1 AND service <= 5),
    comments TEXT,
    review_date TIMESTAMPTZ DEFAULT NOW(),
    is_anonymous BOOLEAN DEFAULT FALSE,
    display_on BOOLEAN DEFAULT TRUE
);

-- 9. DAILY_REPORTS: EOD automated midnight aggregation snapshots
CREATE TABLE IF NOT EXISTS daily_reports (
    report_id SERIAL PRIMARY KEY,
    report_date DATE NOT NULL UNIQUE,
    total_orders INT DEFAULT 0,
    total_customers INT DEFAULT 0,
    total_revenue NUMERIC(12,2) DEFAULT 0,
    profit NUMERIC(12,2) DEFAULT 0,
    profit_margin NUMERIC(5,2) DEFAULT 0,
    avg_rating NUMERIC(3,2) DEFAULT 0,
    most_ordered VARCHAR(200),
    peak_hour VARCHAR(50),
    cash_payment NUMERIC(12,2) DEFAULT 0,
    card_payment NUMERIC(12,2) DEFAULT 0,
    upi_payment NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_order_details_order ON order_details(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_booking_date ON booking(booking_date);
CREATE INDEX IF NOT EXISTS idx_bill_order ON bill(order_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
