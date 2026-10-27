import { query, mockStore } from '../config/db.js';
import { calculateAggregateBill, calculateEqualSplit, calculateItemizedSplit } from '../services/splitBilling.js';
import { broadcastTableUpdate } from '../socket.js';
import { tableCarts } from './orderController.js';

export const getBills = async (req, res) => {
  return res.json({ success: true, count: mockStore.bill.length, data: mockStore.bill });
};

export const calculateBill = async (req, res) => {
  const { items, discount } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, error: 'items array is required' });
  }

  const result = calculateAggregateBill(items, discount);
  return res.json({ success: true, data: result });
};

export const splitBill = async (req, res) => {
  const { mode, totalBill, guestCount, guestSelections, discount } = req.body;

  if (mode === 'EQUAL') {
    if (!totalBill || !guestCount) {
      return res.status(400).json({ success: false, error: 'totalBill and guestCount are required for EQUAL split' });
    }
    const result = calculateEqualSplit(parseFloat(totalBill), parseInt(guestCount, 10));
    return res.json({ success: true, data: result });
  }

  if (mode === 'ITEMIZED') {
    if (!guestSelections || !Array.isArray(guestSelections)) {
      return res.status(400).json({ success: false, error: 'guestSelections array is required for ITEMIZED split' });
    }
    const result = calculateItemizedSplit(guestSelections, discount);
    return res.json({ success: true, data: result });
  }

  return res.status(400).json({ success: false, error: 'Invalid mode. Use EQUAL or ITEMIZED.' });
};

export const settleBill = async (req, res) => {
  const { order_id, table_id, customer_id, subtotal, discount_amt, tax_amount, total_bill, payment_mode } = req.body;

  if (!total_bill) {
    return res.status(400).json({ success: false, error: 'total_bill is required' });
  }

  let validCustomerId = null;
  if (customer_id) {
    try {
      const custCheck = await query('SELECT customer_id FROM customer WHERE customer_id = $1', [customer_id]);
      if (custCheck && custCheck.rows && custCheck.rows.length > 0) {
        validCustomerId = custCheck.rows[0].customer_id;
      }
    } catch (e) {}
  }

  const billId = Date.now();
  const settledBill = {
    bill_id: billId,
    order_id: order_id || null,
    customer_id: validCustomerId,
    bill_time: new Date(),
    subtotal: parseFloat(subtotal || (total_bill / 1.05)),
    discount_amt: parseFloat(discount_amt || 0),
    tax_amount: parseFloat(tax_amount || (total_bill - (total_bill / 1.05))),
    total_bill: parseFloat(total_bill),
    payment_mode: payment_mode || 'UPI',
    payment_status: 'Settled',
    payment_time: new Date()
  };

  mockStore.bill.unshift(settledBill);

  if (table_id) {
    const cleanTbl = String(table_id).replace(/[^0-9a-zA-Z-]/g, '');
    if (tableCarts[cleanTbl]) {
      tableCarts[cleanTbl].cart = {};
      tableCarts[cleanTbl].last_updated = Date.now();
    }
    mockStore.orders.forEach((o) => {
      if (o.table_id === table_id || o.table_id?.replace('#', '') === table_id?.replace('#', '')) {
        o.order_status = 'completed';
      }
    });
    broadcastTableUpdate({ table_id, status: 'Available' });
  } else if (order_id) {
    const order = mockStore.orders.find((o) => o.order_id === order_id);
    if (order) {
      order.order_status = 'completed';
      broadcastTableUpdate({ table_id: order.table_id, status: 'Available' });
    }
  }

  // Persist to PostgreSQL if connected
  try {
    if (table_id) {
      const cleanTable = String(table_id).replace(/[^0-9a-zA-Z-]/g, '');
      await query(
        `UPDATE orders SET order_status = 'completed', updated_at = NOW() 
         WHERE (table_id = $1 OR table_id = $2 OR REPLACE(table_id, '#', '') = $3) 
           AND order_status != 'completed'`,
        [table_id, `#${cleanTable}`, cleanTable]
      );
      broadcastTableUpdate({ table_id: `#${cleanTable}`, status: 'Available' });
    } else if (order_id) {
      await query('UPDATE orders SET order_status = $1, updated_at = NOW() WHERE order_id = $2', ['completed', order_id]);
      const ordRes = await query('SELECT table_id FROM orders WHERE order_id = $1', [order_id]);
      const tbl = ordRes?.rows?.[0]?.table_id;
      if (tbl) {
        broadcastTableUpdate({ table_id: tbl, status: 'Available' });
      }
    }

    let validOrderId = null;
    if (order_id) {
      try {
        const ordCheck = await query('SELECT order_id FROM orders WHERE order_id = $1', [order_id]);
        if (ordCheck && ordCheck.rows && ordCheck.rows.length > 0) {
          validOrderId = ordCheck.rows[0].order_id;
        }
      } catch (e) {}
    }

    try {
      await query(`SELECT setval('bill_bill_id_seq', COALESCE((SELECT MAX(bill_id) FROM bill), 1), true)`);
    } catch (e) {}

    await query(
      `INSERT INTO bill (order_id, customer_id, bill_time, subtotal, discount_amt, tax_amount, total_bill, payment_mode, payment_status, payment_time)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, 'Settled', NOW())`,
      [
        validOrderId,
        validCustomerId,
        settledBill.subtotal,
        settledBill.discount_amt,
        settledBill.tax_amount,
        settledBill.total_bill,
        settledBill.payment_mode
      ]
    );
  } catch (dbErr) {
    console.warn('[Bill Settle DB Warning]:', dbErr.message);
  }

  return res.status(201).json({
    success: true,
    data: settledBill,
    message: `Bill #${billId} settled via ${settledBill.payment_mode}`
  });
};
