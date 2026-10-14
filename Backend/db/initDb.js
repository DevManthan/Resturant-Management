import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initPostgres() {
  const client = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    database: process.env.PG_DATABASE || 'luxedine_db',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log(`[DB Init] Connecting to PostgreSQL database "${process.env.PG_DATABASE || 'luxedine_db'}"...`);
    await client.connect();
    console.log('[DB Init] Connected! Applying schema.sql...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('[DB Init] ✓ Schema successfully applied! (All 9 tables created)');

    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('[DB Init] ✓ Seed data successfully populated!');

    await client.end();
    console.log('[DB Init] Database initialization complete.');
  } catch (err) {
    console.error('[DB Init Error]:', err.message);
    process.exit(1);
  }
}

initPostgres();
