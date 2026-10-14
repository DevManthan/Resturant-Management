-- ====================================================================
-- LUXE DINE: Initial Seed Data for PostgreSQL
-- ====================================================================

-- 1. Seed OWNER
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
) ON CONFLICT (email_id) DO NOTHING;

-- 2. Seed CUSTOMERS
INSERT INTO customer (customer_id, customer_name, phone_no, email, loyalty_points)
VALUES 
    (1, 'Aarav Mehta', '+91 98200 11223', 'aarav.mehta@gmail.com', 450),
    (2, 'Priya Sharma', '+91 98211 44556', 'priya.sharma@yahoo.com', 820),
    (3, 'Rohan Kapoor', '+91 98199 77889', 'rohan.k@outlook.com', 210),
    (4, 'Ananya Deshmukh', '+91 99300 33445', 'ananya.d@gmail.com', 640)
ON CONFLICT DO NOTHING;

-- 3. Seed MENU ITEMS
INSERT INTO menu_items (menu_id, owner_id, item_name, category, price, cost_price, prep_time, image_url, discount, in_stock, description, daily_sales)
VALUES
    (1, 1, 'Truffle Infused Wild Mushroom Risotto', 'Main Course', 890.00, 280.00, 22, 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=500', 0.00, true, 'Arborio rice cooked with black truffle butter, forest mushrooms, and aged Parmigiano Reggiano.', 42),
    (2, 1, 'Pan-Seared Chilean Sea Bass', 'Main Course', 1450.00, 520.00, 25, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500', 5.00, true, 'Glazed in lemon beurre blanc with asparagus spear emulsion and crushed baby potatoes.', 28),
    (3, 1, 'Slow Braised New Zealand Lamb Shanks', 'Main Course', 1250.00, 480.00, 30, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500', 0.00, true, '12-hour braised shank in rosemary jus served on silk potato mash.', 35),
    (4, 1, 'Burrata Pugliese with Heirloom Tomatoes', 'Starters', 690.00, 210.00, 12, 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=500', 0.00, true, 'Handmade cream burrata, pesto genovese, balsamic reduction, sourdough crostini.', 68),
    (5, 1, 'Wagyu Beef Carpaccio & Capers', 'Starters', 780.00, 195.00, 14, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500', 10.00, false, 'Thinly sliced wagyu tenderloin, citrus vinaigrette, crisp shallots, microgreens.', 15),
    (6, 1, 'Crisp Calamari Fritti with Garlic Aioli', 'Starters', 590.00, 190.00, 15, 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=500', 0.00, true, 'Golden panko-crusted baby squid rings with zesty house tartar sauce.', 54),
    (7, 1, 'Deconstructed Valrhona Dark Chocolate Fondant', 'Desserts', 520.00, 140.00, 18, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500', 0.00, true, '70% French chocolate lava heart with Madagascar vanilla bean gelato.', 49),
    (8, 1, 'Classic Venetian Tiramisu', 'Desserts', 480.00, 130.00, 10, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500', 0.00, true, 'Espresso soaked savoiardi biscuits, mascarpone cream, Dutch cocoa powder.', 62),
    (9, 1, 'Smoked Hibiscus Botanical Spritz', 'Beverages', 420.00, 80.00, 8, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500', 0.00, true, 'Artisanal hibiscus reduction, rosemary smoke tincture, sparkling tonic.', 76),
    (10, 1, 'Aged Barrel Bourbon Old Fashioned', 'Beverages', 650.00, 160.00, 6, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500', 0.00, true, 'Angostura bitters, maraschino cherry, flambeed orange peel, oak smoke.', 58)
ON CONFLICT DO NOTHING;

-- 4. Seed BOOKINGS
INSERT INTO booking (booking_id, customer_id, table_id, booking_date, booking_time, guest_count, special_preferences, status)
VALUES
    (1, 1, 'T-02', CURRENT_DATE, '19:30', 4, 'Anniversary seating, window side', 'Seated'),
    (2, 2, 'Booth-01', CURRENT_DATE, '20:00', 6, 'High chair needed, quiet area', 'Confirmed'),
    (3, 3, 'T-01', CURRENT_DATE, '20:30', 2, 'Vegetarian preparations', 'Confirmed')
ON CONFLICT DO NOTHING;

-- 5. Seed ACTIVE ORDERS (matching KDS)
INSERT INTO orders (order_id, booking_id, customer_id, table_id, order_status, subtotal, discount, tax, total_amount, special_note)
VALUES
    (101, 1, 1, 'T-02', 'preparing', 2570.00, 0.00, 128.50, 2698.50, 'Table anniversary dessert on house'),
    (102, 2, 2, 'Booth-01', 'pending', 3420.00, 100.00, 166.00, 3486.00, 'Guests arriving soon'),
    (103, 3, 3, 'T-01', 'ready', 1470.00, 0.00, 73.50, 1543.50, 'Serve drinks first')
ON CONFLICT DO NOTHING;

-- 6. Seed ORDER DETAILS (Snapshot pricing)
INSERT INTO order_details (order_item_id, order_id, item_id, quantity, unit_price, total_price, note, status)
VALUES
    (1, 101, 1, 2, 890.00, 1780.00, 'Extra parmesan', 'preparing'),
    (2, 101, 4, 1, 690.00, 690.00, 'Pesto on side', 'ready'),
    (3, 102, 2, 2, 1450.00, 2900.00, 'Medium-well sea bass', 'pending'),
    (4, 102, 7, 1, 520.00, 520.00, 'Allergy check: nuts', 'pending'),
    (5, 103, 6, 1, 590.00, 590.00, 'Extra lemon', 'ready'),
    (6, 103, 1, 1, 890.00, 890.00, 'Standard', 'ready')
ON CONFLICT DO NOTHING;

-- 7. Seed BILLS
INSERT INTO bill (bill_id, order_id, customer_id, subtotal, discount_amt, tax_amount, total_bill, payment_mode, payment_status, payment_time)
VALUES
    (1, 103, 3, 1470.00, 0.00, 73.50, 1543.50, 'UPI', 'Settled', NOW() - INTERVAL '15 minutes')
ON CONFLICT DO NOTHING;

-- 8. Seed REVIEWS
INSERT INTO review (review_id, order_id, customer_id, rating, food_quality, service, comments, is_anonymous)
VALUES
    (1, 103, 3, 5, 5, 5, 'Exceptional black truffle risotto! Service was remarkably swift.', false),
    (2, 101, 1, 4, 5, 4, 'Great ambiance and well-timed dish courses. Loved the burrata.', false)
ON CONFLICT DO NOTHING;

-- 9. Seed DAILY REPORTS
INSERT INTO daily_reports (report_id, report_date, total_orders, total_customers, total_revenue, profit, profit_margin, avg_rating, most_ordered, peak_hour, cash_payment, card_payment, upi_payment)
VALUES
    (1, CURRENT_DATE - INTERVAL '1 day', 84, 168, 62450.00, 28100.00, 45.00, 4.8, 'Truffle Infused Wild Mushroom Risotto', '8:00 PM - 9:00 PM', 8500.00, 29400.00, 24550.00)
ON CONFLICT (report_date) DO NOTHING;

-- Adjust sequence values to avoid collisions
SELECT setval(pg_get_serial_sequence('owner', 'owner_id'), COALESCE(MAX(owner_id), 1)) FROM owner;
SELECT setval(pg_get_serial_sequence('customer', 'customer_id'), COALESCE(MAX(customer_id), 1)) FROM customer;
SELECT setval(pg_get_serial_sequence('menu_items', 'menu_id'), COALESCE(MAX(menu_id), 1)) FROM menu_items;
SELECT setval(pg_get_serial_sequence('booking', 'booking_id'), COALESCE(MAX(booking_id), 1)) FROM booking;
SELECT setval(pg_get_serial_sequence('orders', 'order_id'), COALESCE(MAX(order_id), 103)) FROM orders;
SELECT setval(pg_get_serial_sequence('order_details', 'order_item_id'), COALESCE(MAX(order_item_id), 6)) FROM order_details;
SELECT setval(pg_get_serial_sequence('bill', 'bill_id'), COALESCE(MAX(bill_id), 1)) FROM bill;
SELECT setval(pg_get_serial_sequence('review', 'review_id'), COALESCE(MAX(review_id), 2)) FROM review;
SELECT setval(pg_get_serial_sequence('daily_reports', 'report_id'), COALESCE(MAX(report_id), 1)) FROM daily_reports;
