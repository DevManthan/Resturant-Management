-- ====================================================================
-- LUXE DINE: Complete Supabase Database Setup & Seed Script
-- Instructions:
-- 1. Open your Supabase Project -> Go to "SQL Editor" -> Click "New query"
-- 2. Paste this entire file and click "Run" (green button)
-- 3. All 9 tables, indexes, sequences, and royal Indian menu items will be created!
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

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_order_details_order ON order_details(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_booking_date ON booking(booking_date);
CREATE INDEX IF NOT EXISTS idx_bill_order ON bill(order_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);

-- ====================================================================
-- SEED DATA
-- ====================================================================

-- Seed Owner
INSERT INTO owner (owner_id, owner_name, email_id, phone_no, restaurant_name, address, password_hash, gstin, currency, gst_rate, open_time, close_time, status)
VALUES (
    1,
    'Vikramaditya Singhania',
    'vikram@luxedine.in',
    '+91 98765 43210',
    'Luxe Dine & Gastropub',
    'Level 4, High Street Phoenix, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013',
    '$2a$12$K8j7XqW9aBcDeFgHiJkLmNOpQrStUvWxYz0123456789aBcDeFgHi',
    '27AABCL1234F1Z9',
    '₹',
    5.00,
    '12:00 PM',
    '11:30 PM',
    'OPEN'
) ON CONFLICT (email_id) DO UPDATE SET
    restaurant_name = EXCLUDED.restaurant_name,
    address = EXCLUDED.address,
    currency = EXCLUDED.currency,
    status = EXCLUDED.status;

-- Seed Customers
INSERT INTO customer (customer_id, customer_name, phone_no, email, loyalty_points)
VALUES 
    (1, 'Aarav Mehta', '+91 98200 11223', 'aarav.mehta@gmail.com', 450),
    (2, 'Priya Sharma', '+91 98211 44556', 'priya.sharma@yahoo.com', 820),
    (3, 'Rohan Kapoor', '+91 98199 77889', 'rohan.k@outlook.com', 210),
    (4, 'Ananya Deshmukh', '+91 99300 33445', 'ananya.d@gmail.com', 640)
ON CONFLICT (customer_id) DO NOTHING;

-- Seed Menu Items (All 16 authentic Indian Royal dishes)
INSERT INTO menu_items (menu_id, owner_id, item_name, category, price, cost_price, prep_time, image_url, discount, in_stock, description, daily_sales)
VALUES
    (1, 1, 'Murgh Malai Kebab', 'Starters', 480.00, 160.00, 15, 'https://upload.wikimedia.org/wikipedia/commons/7/73/Chicken_Tikka.jpg', 0.00, true, 'Tender chicken morsels steeped in cream cheese, cardamom, and royal saffron, char-grilled in tandoor.', 58),
    (2, 1, 'Dahi Ke Kebab & Mint Chutney', 'Starters', 380.00, 120.00, 12, 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Shikampuri_Kabab.JPG', 0.00, true, 'Crispy spiced hung curd and paneer patties infused with green cardamom, coriander root, and roasted cumin.', 44),
    (3, 1, 'Amritsari Crispy Fish Tikka', 'Starters', 550.00, 190.00, 14, 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Tandoori_Fish_tikka.jpg', 5.00, true, 'River sole fish fillets crusted with carom seeds (ajwain), Kashmiri deghi mirch, and lemon drizzle.', 39),
    (4, 1, 'Tandoori Malai Soya Chaap', 'Starters', 360.00, 110.00, 15, 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Soya_Chaap.JPG', 0.00, false, 'Succulent soya chaap smoked over coals in rich cashew cream and aromatic spices.', 18),
    (5, 1, 'Slow-Simmered Dal Bukhara', 'Main Course', 460.00, 120.00, 12, 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Dal_Makhani.jpg', 0.00, true, 'Overnight 18-hour slow-cooked black lentils with sun-ripened plum tomatoes, white churned butter, and fragrant fenugreek.', 82),
    (6, 1, 'Royal Paneer Lababdar', 'Main Course', 490.00, 140.00, 18, 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Paneer_Butter_Masala.jpg', 0.00, true, 'Cottage cheese batons simmered in a luscious tomato, melon seed, and caramelised onion gravy with grated paneer.', 64),
    (7, 1, 'Awadhi Dum Pukht Chicken Biryani', 'Main Course', 620.00, 210.00, 25, 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Chicken_biryani_02-06-2015_%28India%29.jpg', 0.00, true, 'Fragrant aged Basmati rice layered with spring chicken, ittar, kewra water, and caramelized onions, sealed with dough.', 91),
    (8, 1, 'Rogan Josh Kashmiri Lamb', 'Main Course', 690.00, 240.00, 22, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Mutton_Rogan_Josh.jpg', 0.00, true, 'Slow-braised tender mountain lamb infused with Kashmiri ratanjot bark, sun-dried ginger, and crushed fennel seeds.', 53),
    (9, 1, 'Classic Old Delhi Butter Chicken', 'Main Course', 580.00, 180.00, 20, 'https://upload.wikimedia.org/wikipedia/commons/4/40/Food_Indian_butter_chicken_%2852843424475%29.jpg', 0.00, true, 'Clay-oven smoked tandoori chicken pulled and glazed in a velvety satin makhani gravy with kasuri methi.', 110),
    (10, 1, 'Tandoori Garlic Butter Naan Basket', 'Main Course', 140.00, 35.00, 8, 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Garlic_Naan_%285550511620%29.jpg', 0.00, true, 'Refined flour leavened flatbread brushed with crushed roasted garlic, fresh coriander leaves, and salted white butter.', 135),
    (11, 1, 'Kesari Angoori Rasmalai', 'Desserts', 260.00, 80.00, 8, 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Ras-Malai.jpg', 0.00, true, 'Poached chenna dumplings soaked in cold saffron-pistachio thickened milk scented with green cardamom.', 72),
    (12, 1, 'Shahi Tukda with Rabri & Gold Vark', 'Desserts', 310.00, 95.00, 10, 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Shahi_Tukda_-_Dessert_of_India.jpg', 0.00, true, 'Crispy ghee-fried bread pillows soaked in saffron-cardamom sugar syrup, topped with rich malai rabri and edible silver leaf.', 48),
    (13, 1, 'Warm Gulab Jamun with Pista Crumb', 'Desserts', 220.00, 60.00, 6, 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Gulab_jamun_%28halwaai_style%29.jpg', 0.00, true, 'Golden caramelized khoya dumplings soaked in rose petal and green cardamom nectar.', 65),
    (14, 1, 'Alphonso Mango Saffron Lassi', 'Beverages', 220.00, 65.00, 5, 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Mango_Lassi_.jpg', 0.00, true, 'Rich churned yogurt blended with authentic Ratnagiri Alphonso mango pulp and saffron essence.', 88),
    (15, 1, 'Kolkata Spiced Kulhad Chai', 'Beverages', 120.00, 25.00, 8, 'https://upload.wikimedia.org/wikipedia/commons/0/04/Masala_Chai.JPG', 0.00, true, 'Brewed Assam CTC tea leaves infused with freshly crushed green cardamom, ginger, cloves, and milk, served in an earthen clay kulhad.', 95),
    (16, 1, 'Kokum & Cumin Shikanji Spritzer', 'Beverages', 180.00, 40.00, 5, 'https://upload.wikimedia.org/wikipedia/commons/8/82/Shikanji-_served_with_pomegranate%2Cgrated_apple_and_mint.jpg', 0.00, true, 'Refreshing Konkan coastal kokum extract muddled with roasted jeera, rock salt, mint leaves, and effervescent soda.', 52)
ON CONFLICT (menu_id) DO UPDATE SET
    item_name = EXCLUDED.item_name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    cost_price = EXCLUDED.cost_price,
    prep_time = EXCLUDED.prep_time,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description;

-- Seed Sample Bookings
INSERT INTO booking (booking_id, customer_id, table_id, booking_date, booking_time, guest_count, special_preferences, status)
VALUES
    (1, 1, '#102', CURRENT_DATE, '19:30', 4, 'Window table preferred', 'Seated'),
    (2, 2, '#103', CURRENT_DATE, '20:00', 6, 'Birthday celebration cake', 'Confirmed'),
    (3, 3, '#101', CURRENT_DATE, '20:30', 2, 'Quiet anniversary seating', 'Confirmed')
ON CONFLICT (booking_id) DO NOTHING;

-- Seed Sample Active Orders
INSERT INTO orders (order_id, booking_id, customer_id, table_id, order_status, subtotal, discount, tax, total_amount, special_note)
VALUES
    (101, 1, 1, '#102', 'preparing', 1580.00, 0.00, 79.00, 1659.00, 'Mild spice level on Biryani'),
    (102, 2, 2, '#103', 'pending', 960.00, 0.00, 48.00, 1008.00, 'Serve with extra mint chutney'),
    (103, 3, 3, '#101', 'ready', 1890.00, 0.00, 94.50, 1984.50, 'Table 101 anniversary couple')
ON CONFLICT (order_id) DO NOTHING;

-- Seed Order Items
INSERT INTO order_details (order_item_id, order_id, item_id, quantity, unit_price, total_price, note, status)
VALUES
    (1, 101, 7, 2, 620.00, 1240.00, 'Medium spicy', 'preparing'),
    (2, 101, 14, 2, 220.00, 440.00, 'Chilled', 'ready'),
    (3, 102, 1, 2, 480.00, 960.00, 'Extra creamy', 'pending'),
    (4, 103, 9, 2, 580.00, 1160.00, 'Boneless', 'ready'),
    (5, 103, 10, 4, 140.00, 560.00, 'Crispy', 'ready')
ON CONFLICT (order_item_id) DO NOTHING;

-- Seed Sample Verified Reviews for Landing Page
INSERT INTO review (review_id, order_id, customer_id, rating, food_quality, service, comments, is_anonymous, display_on)
VALUES
    (1, 103, 3, 5, 5, 5, 'The Awadhi Dum Biryani and Dal Bukhara were transcendent. Truly a Michelin-caliber Indian dining experience.', false, true),
    (2, 101, 1, 5, 5, 5, 'Seamless contactless table ordering! We ordered 3 separate rounds from our phones and each arrived hot and synchronized.', false, true),
    (3, 102, 2, 5, 5, 5, 'The Shahi Tukda with Rabri brought me back to Old Delhi. Exemplary floor service and gorgeous presentation.', false, true)
ON CONFLICT (review_id) DO NOTHING;

-- Seed Initial Daily Financial Report
INSERT INTO daily_reports (report_date, total_orders, total_customers, total_revenue, profit, profit_margin, avg_rating, most_ordered, peak_hour, cash_payment, card_payment, upi_payment)
VALUES (
    CURRENT_DATE,
    14,
    38,
    18450.00,
    9200.00,
    49.80,
    4.9,
    'Classic Old Delhi Butter Chicken',
    '8:00 PM - 9:30 PM',
    2400.00,
    6800.00,
    9250.00
) ON CONFLICT (report_date) DO NOTHING;

-- Ensure sequences are synced so new inserts don't collide with seeded IDs
SELECT setval('owner_owner_id_seq', COALESCE((SELECT MAX(owner_id) FROM owner), 1));
SELECT setval('customer_customer_id_seq', COALESCE((SELECT MAX(customer_id) FROM customer), 1));
SELECT setval('booking_booking_id_seq', COALESCE((SELECT MAX(booking_id) FROM booking), 1));
SELECT setval('menu_items_menu_id_seq', COALESCE((SELECT MAX(menu_id) FROM menu_items), 1));
SELECT setval('orders_order_id_seq', COALESCE((SELECT MAX(order_id) FROM orders), 103));
SELECT setval('order_details_order_item_id_seq', COALESCE((SELECT MAX(order_item_id) FROM order_details), 5));
SELECT setval('bill_bill_id_seq', COALESCE((SELECT MAX(bill_id) FROM bill), 1));
SELECT setval('review_review_id_seq', COALESCE((SELECT MAX(review_id) FROM review), 3));
SELECT setval('daily_reports_report_id_seq', COALESCE((SELECT MAX(report_id) FROM daily_reports), 1));
