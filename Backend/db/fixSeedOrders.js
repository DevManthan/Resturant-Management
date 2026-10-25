import { query, initDb } from '../config/db.js';

async function fix() {
  await initDb();
  // Ensure the 3 seed orders are active across pending, preparing, ready
  await query("UPDATE orders SET order_status = 'pending' WHERE order_id = 101");
  await query("UPDATE orders SET order_status = 'preparing' WHERE order_id = 102");
  await query("UPDATE orders SET order_status = 'ready' WHERE order_id = 103");
  
  const res = await query("SELECT order_id, table_id, order_status FROM orders");
  console.log('Orders now in PostgreSQL:', res.rows);
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
