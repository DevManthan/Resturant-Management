import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

let pool = null;
let isPgConnected = false;

// Mock Store data matching PostgreSQL tables for instant offline/standalone resilience
export const mockStore = {
  owner: [
    {
      owner_id: 1,
      owner_name: 'Vikramaditya Singhania',
      email_id: 'vikram@luxedine.in',
      phone_no: '+91 98765 43210',
      restaurant_name: 'Luxe Dine & Gastropub',
      address: 'Level 4, High Street Phoenix, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013',
      password_hash: '$2a$12$K8j7XqW9aBcDeFgHiJkLmNOpQrStUvWxYz0123456789aBcDeFgHi',
      gstin: '27AABCL1234F1Z9',
      currency: '₹',
      gst_rate: 5.00,
      open_time: '12:00 PM',
      close_time: '11:30 PM',
      status: 'OPEN'
    }
  ],
  customer: [
    { customer_id: 1, customer_name: 'Aarav Mehta', phone_no: '+91 98200 11223', email: 'aarav.mehta@gmail.com', loyalty_points: 450 },
    { customer_id: 2, customer_name: 'Priya Sharma', phone_no: '+91 98211 44556', email: 'priya.sharma@yahoo.com', loyalty_points: 820 },
    { customer_id: 3, customer_name: 'Rohan Kapoor', phone_no: '+91 98199 77889', email: 'rohan.k@outlook.com', loyalty_points: 210 }
  ],
  booking: [
    { booking_id: 1, customer_id: 1, table_id: 'T-02', booking_date: new Date().toISOString().split('T')[0], booking_time: '19:30', guest_count: 4, special_preferences: 'Window table', status: 'Seated', duration: '2 hours' },
    { booking_id: 2, customer_id: 2, table_id: 'Booth-01', booking_date: new Date().toISOString().split('T')[0], booking_time: '20:00', guest_count: 6, special_preferences: 'High chair needed', status: 'Confirmed', duration: '2 hours' },
    { booking_id: 3, customer_id: 3, table_id: 'T-01', booking_date: new Date().toISOString().split('T')[0], booking_time: '20:30', guest_count: 2, special_preferences: '', status: 'Confirmed', duration: '2 hours' }
  ],
  menu_items: [
    { menu_id: 1, owner_id: 1, item_name: 'Truffle Infused Wild Mushroom Risotto', category: 'Main Course', price: 890, cost_price: 280, prep_time: 22, image_url: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=500', discount: 0, in_stock: true, description: 'Arborio rice cooked with black truffle butter, forest mushrooms, and aged Parmigiano Reggiano.', daily_sales: 42 },
    { menu_id: 2, owner_id: 1, item_name: 'Pan-Seared Chilean Sea Bass', category: 'Main Course', price: 1450, cost_price: 520, prep_time: 25, image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500', discount: 5, in_stock: true, description: 'Glazed in lemon beurre blanc with asparagus spear emulsion and crushed baby potatoes.', daily_sales: 28 },
    { menu_id: 3, owner_id: 1, item_name: 'Slow Braised New Zealand Lamb Shanks', category: 'Main Course', price: 1250, cost_price: 480, prep_time: 30, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500', discount: 0, in_stock: true, description: '12-hour braised shank in rosemary jus served on silk potato mash.', daily_sales: 35 },
    { menu_id: 4, owner_id: 1, item_name: 'Burrata Pugliese with Heirloom Tomatoes', category: 'Starters', price: 690, cost_price: 210, prep_time: 12, image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=500', discount: 0, in_stock: true, description: 'Handmade cream burrata, pesto genovese, balsamic reduction, sourdough crostini.', daily_sales: 68 },
    { menu_id: 5, owner_id: 1, item_name: 'Wagyu Beef Carpaccio & Capers', category: 'Starters', price: 780, cost_price: 195, prep_time: 14, image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500', discount: 10, in_stock: false, description: 'Thinly sliced wagyu tenderloin, citrus vinaigrette, crisp shallots, microgreens.', daily_sales: 15 },
    { menu_id: 6, owner_id: 1, item_name: 'Crisp Calamari Fritti with Garlic Aioli', category: 'Starters', price: 590, cost_price: 190, prep_time: 15, image_url: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=500', discount: 0, in_stock: true, description: 'Golden panko-crusted baby squid rings with zesty house tartar sauce.', daily_sales: 54 },
    { menu_id: 7, owner_id: 1, item_name: 'Deconstructed Valrhona Dark Chocolate Fondant', category: 'Desserts', price: 520, cost_price: 140, prep_time: 18, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500', discount: 0, in_stock: true, description: '70% French chocolate lava heart with Madagascar vanilla bean gelato.', daily_sales: 49 },
    { menu_id: 8, owner_id: 1, item_name: 'Classic Venetian Tiramisu', category: 'Desserts', price: 480, cost_price: 130, prep_time: 10, image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500', discount: 0, in_stock: true, description: 'Espresso soaked savoiardi biscuits, mascarpone cream, Dutch cocoa powder.', daily_sales: 62 },
    { menu_id: 9, owner_id: 1, item_name: 'Smoked Hibiscus Botanical Spritz', category: 'Beverages', price: 420, cost_price: 80, prep_time: 8, image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500', discount: 0, in_stock: true, description: 'Artisanal hibiscus reduction, rosemary smoke tincture, sparkling tonic.', daily_sales: 76 }
  ],
  orders: [
    { order_id: 101, booking_id: 1, customer_id: 1, table_id: '#102', order_status: 'preparing', subtotal: 2570, discount: 0, tax: 128.5, total_amount: 2698.5, special_note: 'No garlic on scallops', created_at: new Date(Date.now() - 12 * 60000) },
    { order_id: 102, booking_id: 2, customer_id: 2, table_id: '#103', order_status: 'pending', subtotal: 1450, discount: 0, tax: 72.5, total_amount: 1522.5, special_note: 'UberEats dispatch', created_at: new Date(Date.now() - 3 * 60000) },
    { order_id: 103, booking_id: 3, customer_id: 3, table_id: '#205', order_status: 'ready', subtotal: 1890, discount: 0, tax: 94.5, total_amount: 1984.5, special_note: '', created_at: new Date(Date.now() - 25 * 60000) }
  ],
  order_details: [
    { order_item_id: 1, order_id: 101, item_id: 1, quantity: 2, unit_price: 890, total_price: 1780, note: 'Extra truffle butter', status: 'preparing' },
    { order_item_id: 2, order_id: 101, item_id: 4, quantity: 1, unit_price: 690, total_price: 690, note: 'Pesto on side', status: 'ready' },
    { order_item_id: 3, order_id: 102, item_id: 2, quantity: 1, unit_price: 1450, total_price: 1450, note: '', status: 'pending' },
    { order_item_id: 4, order_id: 103, item_id: 6, quantity: 1, unit_price: 590, total_price: 590, note: '', status: 'ready' },
    { order_item_id: 5, order_id: 103, item_id: 3, quantity: 1, unit_price: 1250, total_price: 1250, note: '', status: 'ready' }
  ],
  bill: [
    { bill_id: 1, order_id: 103, customer_id: 3, bill_time: new Date(), subtotal: 1840, discount_amt: 0, tax_amount: 92, total_bill: 1932, payment_mode: 'UPI', payment_status: 'Settled', payment_time: new Date() }
  ],
  review: [
    { review_id: 1, order_id: 103, customer_id: 3, rating: 5, food_quality: 5, service: 5, comments: 'Superb wild mushroom risotto! Impeccable presentation.', review_date: new Date(), is_anonymous: false, display_on: true }
  ],
  daily_reports: [
    { report_id: 1, report_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], total_orders: 84, total_customers: 168, total_revenue: 62450, profit: 28100, profit_margin: 45, avg_rating: 4.8, most_ordered: 'Truffle Infused Wild Mushroom Risotto', peak_hour: '8:00 PM - 9:00 PM', cash_payment: 8500, card_payment: 29400, upi_payment: 24550 }
  ]
};

export const initDb = async () => {
  const config = {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    database: process.env.PG_DATABASE || 'luxedine_db',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 2500
  };

  try {
    pool = new Pool(config);
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    isPgConnected = true;
    console.log(`[Database] Successfully connected to PostgreSQL database: "${config.database}" on ${config.host}:${config.port}`);
  } catch (err) {
    isPgConnected = false;
    console.warn(`[Database] PostgreSQL connection failed (${err.message}).`);
    console.log(`[Database] Running in resilient In-Memory Mock Store mode with full 9-table schema support.`);
  }

  return { isPgConnected, pool };
};

export const query = async (text, params = []) => {
  if (isPgConnected && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('[Database Query Error]:', err.message);
      throw err;
    }
  }
  return null;
};

export const getDbStatus = () => ({
  isPgConnected,
  type: isPgConnected ? 'PostgreSQL' : 'In-Memory Relational Mock'
});
