import { query, mockStore } from '../config/db.js';
import { prioritizeKdsQueue } from '../services/kdsScheduler.js';
import { calculateAggregateBill } from '../services/splitBilling.js';
import { broadcastKdsUpdate, broadcastTableUpdate } from '../socket.js';

// In-memory shared table carts store for real-time multi-device sync
export const tableCarts = {};

export const getAllOrders = async (req, res) => {
  try {
    const { status, table_id } = req.query;
    let sql = `
      SELECT o.*, 
        COALESCE(json_agg(
          json_build_object(
            'order_item_id', od.order_item_id,
            'item_id', od.item_id,
            'item_name', m.item_name,
            'category', m.category,
            'quantity', od.quantity,
            'unit_price', od.unit_price,
            'total_price', od.total_price,
            'note', od.note,
            'status', od.status
          )
        ) FILTER (WHERE od.order_item_id IS NOT NULL), '[]') as items
      FROM orders o
      LEFT JOIN order_details od ON o.order_id = od.order_id
      LEFT JOIN menu_items m ON od.item_id = m.menu_id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      params.push(status);
      sql += ` AND o.order_status = $${params.length}`;
    }
    if (table_id) {
      const cleanTable = String(table_id).replace(/[^0-9a-zA-Z-]/g, '');
      params.push(table_id);
      params.push(cleanTable);
      params.push(`#${cleanTable}`);
      sql += ` AND (o.table_id = $${params.length - 2} OR o.table_id = $${params.length - 1} OR o.table_id = $${params.length} OR REPLACE(o.table_id, '#', '') = $${params.length - 1})`;
    }
    sql += ' GROUP BY o.order_id ORDER BY o.created_at DESC';

    const dbRes = await query(sql, params);
    if (dbRes && dbRes.rows) {
      return res.json({ success: true, count: dbRes.rows.length, data: dbRes.rows, source: 'postgresql' });
    }

    // Mock fallback
    let orders = mockStore.orders.map((o) => {
      const items = mockStore.order_details
        .filter((d) => d.order_id === o.order_id)
        .map((d) => {
          const m = mockStore.menu_items.find((x) => x.menu_id === d.item_id) || {};
          return {
            ...d,
            item_name: m.item_name || 'Dish',
            category: m.category || 'Mains'
          };
        });
      return { ...o, items };
    });

    if (status) {
      orders = orders.filter((o) => o.order_status === status);
    }
    if (table_id) {
      orders = orders.filter((o) => o.table_id === table_id);
    }

    return res.json({ success: true, count: orders.length, data: orders, source: 'mock_fallback' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getKdsQueue = async (req, res) => {
  try {
    let rawOrders = [];
    let rawDetails = [];
    let menuCatalog = [];

    const dbOrders = await query("SELECT * FROM orders WHERE order_status IN ('pending', 'preparing', 'ready')");
    const dbDetails = await query('SELECT * FROM order_details');
    const dbMenu = await query('SELECT * FROM menu_items');

    if (dbOrders && dbOrders.rows && dbMenu && dbMenu.rows) {
      rawOrders = dbOrders.rows;
      rawDetails = dbDetails?.rows || [];
      menuCatalog = dbMenu.rows;
    } else {
      rawOrders = mockStore.orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.order_status));
      rawDetails = mockStore.order_details;
      menuCatalog = mockStore.menu_items;
    }

    const prioritizedTickets = prioritizeKdsQueue(rawOrders, rawDetails, menuCatalog);

    return res.json({
      success: true,
      count: prioritizedTickets.length,
      data: prioritizedTickets,
      sla_alert_count: prioritizedTickets.filter((t) => t.sla.isSlaBreached).length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createOrder = async (req, res) => {
  const { table_id, customer_id, booking_id, items, special_note } = req.body;

  if (!table_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'table_id and an array of items are required' });
  }

  try {
    // 1. Resolve menu catalog to snapshot prices & prep times
    let menuCatalog = [];
    const dbMenu = await query('SELECT * FROM menu_items');
    if (dbMenu && dbMenu.rows && dbMenu.rows.length > 0) {
      menuCatalog = dbMenu.rows;
    } else {
      menuCatalog = mockStore.menu_items;
    }

    const snapshottedItems = items.map((itm) => {
      const menuItem = menuCatalog.find((m) => m.menu_id === itm.item_id) || {};
      const unitPrice = parseFloat(itm.unit_price || menuItem.price || 0);
      const qty = parseInt(itm.quantity || 1, 10);
      return {
        item_id: itm.item_id || menuItem.menu_id || null,
        item_name: itm.item_name || menuItem.item_name || 'Special Dish',
        category: menuItem.category || 'Mains',
        prep_time: menuItem.prep_time || 15,
        quantity: qty,
        unit_price: unitPrice,
        total_price: Math.round(unitPrice * qty * 100) / 100,
        note: itm.note || '',
        status: 'pending'
      };
    });

    const billing = calculateAggregateBill(snapshottedItems);

    let createdOrder = null;

    // 2. Insert into PostgreSQL orders table
    try {
      const orderInsertSql = `
        INSERT INTO orders (
          booking_id, customer_id, table_id, order_status, subtotal, discount, tax, total_amount, special_note
        ) VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8)
        RETURNING *;
      `;
      const orderRes = await query(orderInsertSql, [
        booking_id || null,
        customer_id || 1,
        table_id,
        billing.subtotal,
        billing.discount,
        billing.taxAmount,
        billing.totalBill,
        special_note || ''
      ]);

      if (orderRes && orderRes.rows && orderRes.rows.length > 0) {
        createdOrder = orderRes.rows[0];
        const newOrderId = createdOrder.order_id;

        // Insert order line items into order_details table
        for (const itm of snapshottedItems) {
          const detailSql = `
            INSERT INTO order_details (
              order_id, item_id, quantity, unit_price, total_price, note, status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            RETURNING *;
          `;
          await query(detailSql, [
            newOrderId,
            itm.item_id,
            itm.quantity,
            itm.unit_price,
            itm.total_price,
            itm.note || ''
          ]);
        }
      }
    } catch (pgErr) {
      console.warn('[orderController] PostgreSQL insertion fallback:', pgErr.message);
    }

    const orderId = createdOrder ? createdOrder.order_id : Date.now();
    const finalOrder = {
      order_id: orderId,
      booking_id: booking_id || null,
      customer_id: customer_id || 1,
      table_id,
      order_status: 'pending',
      subtotal: billing.subtotal,
      discount: billing.discount,
      tax: billing.taxAmount,
      total_amount: billing.totalBill,
      special_note: special_note || '',
      created_at: createdOrder ? createdOrder.created_at : new Date(),
      items: snapshottedItems
    };

    // Update in-memory mockStore for fallback resilience
    mockStore.orders.unshift(finalOrder);
    snapshottedItems.forEach((itm, idx) => {
      mockStore.order_details.push({
        order_item_id: orderId + idx,
        order_id: orderId,
        ...itm
      });
    });

    // Clear server-side shared cart for this table once order is sent to kitchen
    const cleanTbl = String(table_id || '102').replace(/[^0-9a-zA-Z-]/g, '');
    if (tableCarts[cleanTbl]) {
      tableCarts[cleanTbl].cart = {};
      tableCarts[cleanTbl].last_updated = Date.now();
    }

    // Real-time broadcast to KDS & Table status
    broadcastKdsUpdate({ type: 'ORDER_CREATED', order: finalOrder });
    broadcastTableUpdate({ table_id, status: 'Occupied', orderId });

    return res.status(201).json({
      success: true,
      data: finalOrder,
      billing,
      message: 'Order placed and dispatched to Lumiere Kitchen'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  const orderId = parseInt(String(req.params.id).replace(/[^0-9]/g, ''), 10);
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'status is required' });
  }

  try {
    // 1. Update in PostgreSQL
    const dbRes = await query(
      'UPDATE orders SET order_status = $1, updated_at = NOW() WHERE order_id = $2 RETURNING *',
      [status, orderId]
    );

    // If order moved to ready or completed, update its order_details status as well
    if (status === 'ready' || status === 'completed' || status === 'served') {
      await query(
        'UPDATE order_details SET status = $1 WHERE order_id = $2',
        [status, orderId]
      );
    }

    // 2. Keep mockStore in sync
    const order = mockStore.orders.find((o) => o.order_id === orderId);
    if (order) {
      order.order_status = status;
      order.updated_at = new Date();
    }

    // If order is completed (paid & settled), free the table
    if (status === 'completed') {
      const tableId = (dbRes && dbRes.rows && dbRes.rows[0]?.table_id) || order?.table_id;
      if (tableId) {
        broadcastTableUpdate({ table_id, status: 'Available' });
      }
    }

    broadcastKdsUpdate({ type: 'STATUS_UPDATED', orderId, status });

    return res.json({
      success: true,
      data: (dbRes && dbRes.rows && dbRes.rows[0]) || order,
      message: `Order #${orderId} status updated to ${status}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const callWaiter = async (req, res) => {
  const { table_id, request_type } = req.body;
  const table = table_id || '#102';
  const type = request_type || 'Server Assistance';

  try {
    // Ensure table exists in PostgreSQL
    await query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        request_id SERIAL PRIMARY KEY,
        table_id VARCHAR(50) NOT NULL,
        request_type VARCHAR(100) DEFAULT 'Server Assistance',
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    let serviceRecord = null;
    try {
      const dbRes = await query(
        `INSERT INTO service_requests (table_id, request_type, status)
         VALUES ($1, $2, 'pending')
         RETURNING *`,
        [table, type]
      );
      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        serviceRecord = dbRes.rows[0];
      }
    } catch (e) {
      console.warn('[Call Waiter DB Warning]:', e.message);
    }

    // Broadcast alert to staff
    broadcastKdsUpdate({
      type: 'WAITER_CALL',
      table_id: table,
      request_type: type,
      time: new Date()
    });

    return res.status(200).json({
      success: true,
      data: serviceRecord || { table_id: table, request_type: type, status: 'pending' },
      message: `Staff notified! A server is on their way to Table ${table}.`
    });
  } catch (err) {
    console.error('[Call Waiter Error]:', err.message);
    return res.status(200).json({
      success: true,
      message: `Staff notified for Table ${table}.`
    });
  }
};

export const getTableCart = async (req, res) => {
  const cleanTable = String(req.params.tableId || '102').replace(/[^0-9a-zA-Z-]/g, '');
  if (!tableCarts[cleanTable]) {
    tableCarts[cleanTable] = {
      cart: {},
      guest_count: 2,
      split_bill: false,
      last_updated: Date.now(),
      last_item_title: null,
      last_sender_id: null,
      last_action: null
    };
  }
  return res.json({
    success: true,
    table_id: cleanTable,
    ...tableCarts[cleanTable]
  });
};

export const updateTableCart = async (req, res) => {
  const cleanTable = String(req.params.tableId || '102').replace(/[^0-9a-zA-Z-]/g, '');
  const { action, cart, item_id, dish_title, guest_count, split_bill, sender_id } = req.body;

  if (!tableCarts[cleanTable]) {
    tableCarts[cleanTable] = {
      cart: {},
      guest_count: 2,
      split_bill: false,
      last_updated: Date.now(),
      last_item_title: null,
      last_sender_id: null,
      last_action: null
    };
  }

  const tableState = tableCarts[cleanTable];

  if (action === 'add' && item_id) {
    tableState.cart[item_id] = (tableState.cart[item_id] || 0) + 1;
    tableState.last_item_title = dish_title || null;
  } else if (action === 'remove' && item_id) {
    const current = tableState.cart[item_id] || 0;
    if (current <= 1) {
      delete tableState.cart[item_id];
    } else {
      tableState.cart[item_id] = current - 1;
    }
  } else if (action === 'sync' && cart && typeof cart === 'object') {
    tableState.cart = { ...cart };
  } else if (action === 'clear') {
    tableState.cart = {};
  }

  if (guest_count !== undefined && !isNaN(guest_count)) {
    tableState.guest_count = Math.max(1, parseInt(guest_count, 10));
  }

  if (split_bill !== undefined) {
    tableState.split_bill = Boolean(split_bill);
  }

  tableState.last_updated = Date.now();
  tableState.last_action = action;
  tableState.last_sender_id = sender_id || null;

  return res.json({
    success: true,
    table_id: cleanTable,
    dish_title: dish_title || tableState.last_item_title || null,
    sender_id: sender_id || null,
    ...tableState
  });
};

