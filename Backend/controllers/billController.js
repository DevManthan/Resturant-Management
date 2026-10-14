import { mockStore } from '../config/db.js';
import { calculateAggregateBill, calculateEqualSplit, calculateItemizedSplit } from '../services/splitBilling.js';
import { broadcastTableUpdate } from '../socket.js';

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
  const { order_id, customer_id, subtotal, discount_amt, tax_amount, total_bill, payment_mode } = req.body;

  if (!total_bill) {
    return res.status(400).json({ success: false, error: 'total_bill is required' });
  }

  const billId = Date.now();
  const settledBill = {
    bill_id: billId,
    order_id: order_id || null,
    customer_id: customer_id || 1,
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

  if (order_id) {
    const order = mockStore.orders.find((o) => o.order_id === order_id);
    if (order) {
      order.order_status = 'completed';
      broadcastTableUpdate({ table_id: order.table_id, status: 'Available' });
    }
  }

  return res.status(201).json({
    success: true,
    data: settledBill,
    message: `Bill #${billId} settled via ${settledBill.payment_mode}`
  });
};
