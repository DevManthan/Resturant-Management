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
  customer: [],
  booking: [],
  menu_items: [],
  orders: [],
  order_details: [],
  bill: [],
  review: [],
  daily_reports: []
};

export const initDb = async () => {
  let config;
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (dbUrl) {
    // Hosted PostgreSQL / Supabase connection via connection string URI
    const isSsl = dbUrl.includes('supabase') || dbUrl.includes('pooler') || process.env.PG_SSL === 'true' || process.env.NODE_ENV === 'production';
    config = {
      connectionString: dbUrl,
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000
    };
  } else {
    // Discrete local environment parameters
    config = {
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432', 10),
      database: process.env.PG_DATABASE || 'luxedine_db',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'postgres',
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000
    };
  }

  try {
    pool = new Pool(config);
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    isPgConnected = true;
    const target = dbUrl ? 'Cloud PostgreSQL / Supabase' : `"${config.database}" on ${config.host}:${config.port}`;
    console.log(`[Database] Successfully connected to PostgreSQL: ${target}`);
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
