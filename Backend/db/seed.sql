-- ====================================================================
-- LUXE DINE: Initial Seed Data for PostgreSQL (Authentic Indian Royal Gastronomy)
-- Verified high-accuracy dish imagery from Wikimedia Commons
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
) ON CONFLICT (email_id) DO UPDATE SET
    restaurant_name = EXCLUDED.restaurant_name,
    address = EXCLUDED.address,
    currency = EXCLUDED.currency,
    status = EXCLUDED.status;

-- 2. Seed CUSTOMERS
INSERT INTO customer (customer_id, customer_name, phone_no, email, loyalty_points)
VALUES 
    (1, 'Aarav Mehta', '+91 98200 11223', 'aarav.mehta@gmail.com', 450),
    (2, 'Priya Sharma', '+91 98211 44556', 'priya.sharma@yahoo.com', 820),
    (3, 'Rohan Kapoor', '+91 98199 77889', 'rohan.k@outlook.com', 210),
    (4, 'Ananya Deshmukh', '+91 99300 33445', 'ananya.d@gmail.com', 640)
ON CONFLICT DO NOTHING;

-- 3. Seed MENU ITEMS (Verified authentic Indian food imagery)
DELETE FROM order_details;
DELETE FROM bill;
DELETE FROM review;
DELETE FROM orders;
DELETE FROM menu_items;

INSERT INTO menu_items (menu_id, owner_id, item_name, category, price, cost_price, prep_time, image_url, discount, in_stock, description, daily_sales)
VALUES
    (1, 1, 'Murgh Malai Kebab', 'Starters', 480.00, 160.00, 15, 'https://upload.wikimedia.org/wikipedia/commons/7/73/Chicken_Tikka.jpg', 0.00, true, 'Tender chicken morsels steeped in cream cheese, cardamom, and royal saffron, char-grilled in tandoor.', 58),
    (2, 1, 'Dahi Ke Kebab & Mint Chutney', 'Starters', 380.00, 120.00, 12, 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Shikampuri_Kabab.JPG', 0.00, true, 'Crispy spiced hung curd and paneer patties infused with green cardamom, coriander root, and roasted cumin.', 44),
    (3, 1, 'Amritsari Crispy Fish Tikka', 'Starters', 550.00, 190.00, 14, 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Tandoori_Fish_tikka.jpg', 5.00, true, 'River sole fish fillets crusted with carom seeds (ajwain), Kashmiri deghi mirch, and lemon drizzle.', 39),
    (4, 1, 'Tandoori Malai Soya Chaap', 'Starters', 360.00, 110.00, 15, 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Soya_Chaap.JPG', 0.00, false, 'Succulent soya chaap smoked over coals in rich cashew cream and aromatic spices.', 18),
    (5, 1, 'Slow-Simmered Dal Bukhara', 'Main Course', 460.00, 120.00, 12, 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Dal_Makhani.jpg', 0.00, true, 'Overnight 18-hour slow-cooked black lentils with sun-ripened plum tomatoes, white churned butter, and fragrant fenugreek.', 82),
    (6, 1, 'Royal Paneer Lababdar', 'Main Course', 490.00, 150.00, 18, 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Paneer_Butter_Masala.jpg', 0.00, true, 'Cottage cheese steeped in roasted tomato-onion gravy finished with grated khoya and ginger juliennes.', 65),
    (7, 1, 'Awadhi Dum Pukht Chicken Biryani', 'Main Course', 620.00, 200.00, 25, 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Chicken_biryani_02-06-2015_%28India%29.jpg', 0.00, true, 'Long-grain aged basmati rice layered with tender country chicken, saffron milk, and fried onions sealed with dough.', 94),
    (8, 1, 'Slow-Braised Awadhi Nalli Nihari', 'Main Course', 790.00, 270.00, 22, 'https://upload.wikimedia.org/wikipedia/commons/2/24/Nihari.JPG', 0.00, true, 'Traditional 12-hour shank braised in 32 aromatic potli spices, rose petals, and bone marrow essence.', 46),
    (9, 1, 'Classic Old Delhi Butter Chicken', 'Main Course', 580.00, 180.00, 20, 'https://upload.wikimedia.org/wikipedia/commons/4/40/Food_Indian_butter_chicken_%2852843424475%29.jpg', 0.00, true, 'Tandoor-smoked pulled chicken in satin tomato velvet sauce with fenugreek and honey glaze.', 88),
    (10, 1, 'Tandoori Garlic Butter Naan Basket', 'Main Course', 140.00, 35.00, 8, 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Garlic_Naan_%285550511620%29.jpg', 0.00, true, 'Flaky leavened clay-oven flatbread brushed with crushed roasted garlic, coriander, and desi ghee.', 112),
    (11, 1, 'Kesari Angoori Rasmalai', 'Desserts', 260.00, 75.00, 8, 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Ras-Malai.jpg', 0.00, true, 'Delicate poached cottage cheese rounds soaked in saffron and cardamom clotted milk with Iranian pistachio slivers.', 70),
    (12, 1, 'Shahi Tukda with Rabri & Gold Vark', 'Desserts', 310.00, 90.00, 10, 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Shahi_Tukda_-_Dessert_of_India.jpg', 0.00, true, 'Ghee-crisped brioche steeped in saffron syrup, layered with slow-reduced thick rabri and 24K edible gold leaf.', 52),
    (13, 1, 'Warm Gulab Jamun with Malai Kulfi', 'Desserts', 240.00, 65.00, 6, 'https://upload.wikimedia.org/wikipedia/commons/5/56/Gulab_Jamun.jpg', 0.00, true, 'Caramelized reduced milk dumplings soaked in rose syrup, paired with artisanal malai kulfi.', 61),
    (14, 1, 'Alphonso Mango Saffron Lassi', 'Beverages', 220.00, 60.00, 5, 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Mango_Lassi_.jpg', 0.00, true, 'Thick churned creamy yogurt blended with Ratnagiri Alphonso mango pulp, Kashmiri saffron, and crushed green pistachios.', 95),
    (15, 1, 'Kolkata Spiced Kulhad Chai', 'Beverages', 120.00, 25.00, 8, 'https://upload.wikimedia.org/wikipedia/commons/0/04/Masala_Chai.JPG', 0.00, true, 'Assam CTC black tea brewed with fresh ginger, crushed green cardamom, cinnamon, and whole buffalo milk in a clay kulhad.', 120),
    (16, 1, 'Kokum & Cumin Shikanji Spritzer', 'Beverages', 180.00, 40.00, 5, 'https://upload.wikimedia.org/wikipedia/commons/8/82/Shikanji-_served_with_pomegranate%2Cgrated_apple_and_mint.jpg', 0.00, true, 'Coastal Konkan kokum fruit nectar infused with roasted black cumin, mint sprig, black salt, and chilled soda.', 64);

-- 4. Seed BOOKINGS (Archived past records - tables start available for dynamic bookings)
INSERT INTO booking (booking_id, customer_id, table_id, booking_date, booking_time, guest_count, special_preferences, status)
VALUES
    (1, 1, 'T-02', CURRENT_DATE, '19:30', 4, 'Anniversary seating, window side', 'Completed'),
    (2, 2, 'Booth-01', CURRENT_DATE, '20:00', 6, 'High chair needed, quiet area', 'Completed'),
    (3, 3, 'T-01', CURRENT_DATE, '20:30', 2, 'Vegetarian preparations', 'Completed')
ON CONFLICT (booking_id) DO UPDATE SET status = EXCLUDED.status;

-- 5. Seed ACTIVE ORDERS (matching Indian menu items)
INSERT INTO orders (order_id, booking_id, customer_id, table_id, order_status, subtotal, discount, tax, total_amount, special_note)
VALUES
    (101, 1, 1, 'T-02', 'preparing', 1700.00, 0.00, 85.00, 1785.00, 'Table anniversary dessert on house'),
    (102, 2, 2, 'Booth-01', 'pending', 2260.00, 100.00, 108.00, 2268.00, 'Guests arriving soon'),
    (103, 3, 3, 'T-01', 'ready', 1030.00, 0.00, 51.50, 1081.50, 'Serve drinks and starters first');

-- 6. Seed ORDER DETAILS
INSERT INTO order_details (order_item_id, order_id, item_id, quantity, unit_price, total_price, note, status)
VALUES
    (1, 101, 1, 2, 480.00, 960.00, 'Mild spice level', 'preparing'),
    (2, 101, 5, 1, 460.00, 460.00, 'Extra butter swirl', 'ready'),
    (3, 101, 10, 2, 140.00, 280.00, 'Crisp naan', 'ready'),
    (4, 102, 7, 2, 620.00, 1240.00, 'Dum pukht sealed', 'pending'),
    (5, 102, 9, 1, 580.00, 580.00, 'Boneless butter chicken', 'pending'),
    (6, 102, 14, 2, 220.00, 440.00, 'Chilled mango lassi', 'pending'),
    (7, 103, 6, 1, 490.00, 490.00, 'Paneer Lababdar', 'ready'),
    (8, 103, 10, 2, 140.00, 280.00, 'Garlic naan', 'ready'),
    (9, 103, 11, 1, 260.00, 260.00, 'Kesari Rasmalai', 'ready');

-- 7. Seed BILLS
INSERT INTO bill (bill_id, order_id, customer_id, subtotal, discount_amt, tax_amount, total_bill, payment_mode, payment_status, payment_time)
VALUES
    (1, 103, 3, 1030.00, 0.00, 51.50, 1081.50, 'UPI', 'Settled', NOW() - INTERVAL '15 minutes');

-- 8. Seed REVIEWS (Authentic Indian Dining Experiences)
INSERT INTO review (review_id, order_id, customer_id, rating, food_quality, service, comments, is_anonymous)
VALUES
    (1, 103, 3, 5, 5, 5, 'The Awadhi Dum Pukht Biryani and Dal Bukhara are out of this world! Incredible authentic flavors and royal presentation.', false),
    (2, 101, 1, 5, 5, 5, 'Outstanding hospitality. The Murgh Malai Kebab melted in the mouth and the Garlic Butter Naan was fresh from the tandoor.', false),
    (3, 102, 2, 5, 5, 4, 'Best Old Delhi Butter Chicken and Mango Lassi in Mumbai. Truly Michelin-level Indian gastronomy.', false),
    (4, 101, 4, 5, 5, 5, 'The Shahi Tukda with Rabri and edible gold leaf was the highlight of our family celebration. Exquisite experience!', false);

-- 9. Seed DAILY REPORTS
DELETE FROM daily_reports;
INSERT INTO daily_reports (report_id, report_date, total_orders, total_customers, total_revenue, profit, profit_margin, avg_rating, most_ordered, peak_hour, cash_payment, card_payment, upi_payment)
VALUES
    (1, CURRENT_DATE - INTERVAL '1 day', 84, 168, 68450.00, 34100.00, 49.80, 4.9, 'Awadhi Dum Pukht Chicken Biryani', '8:00 PM - 9:30 PM', 8500.00, 29400.00, 30550.00);

-- Adjust sequence values to avoid collisions
SELECT setval(pg_get_serial_sequence('owner', 'owner_id'), COALESCE(MAX(owner_id), 1)) FROM owner;
SELECT setval(pg_get_serial_sequence('customer', 'customer_id'), COALESCE(MAX(customer_id), 1)) FROM customer;
SELECT setval(pg_get_serial_sequence('menu_items', 'menu_id'), COALESCE(MAX(menu_id), 16)) FROM menu_items;
SELECT setval(pg_get_serial_sequence('booking', 'booking_id'), COALESCE(MAX(booking_id), 1)) FROM booking;
SELECT setval(pg_get_serial_sequence('orders', 'order_id'), COALESCE(MAX(order_id), 103)) FROM orders;
SELECT setval(pg_get_serial_sequence('order_details', 'order_item_id'), COALESCE(MAX(order_item_id), 9)) FROM order_details;
SELECT setval(pg_get_serial_sequence('bill', 'bill_id'), COALESCE(MAX(bill_id), 1)) FROM bill;
SELECT setval(pg_get_serial_sequence('review', 'review_id'), COALESCE(MAX(review_id), 4)) FROM review;
