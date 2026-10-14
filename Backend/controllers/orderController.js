import { query, mockStore } from '../config/db.js';
import { prioritizeKdsQueue } from '../services/kdsScheduler.js';
import { calculateAggregateBill } from '../services/splitBilling.js';
import { broadcastKdsUpdate, broadcastTableUpdate } from '../socket.js';

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
      params.push(table_id);
      sql += ` AND o.table_id = $${params.length}`;
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
    // Resolve menu items and snapshot historical unit prices
    const catalog = mockStore.menu_items;
    const snapshottedItems = items.map((itm) => {
      const menuItem = catalog.find((m) => m.menu_id === itm.item_id) || {};
      const unitPrice = parseFloat(itm.unit_price || menuItem.price || 0);
      const qty = parseInt(itm.quantity || 1, 10);
      return {
        item_id: itm.item_id,
        item_name: menuItem.item_name || 'Special Dish',
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

    const orderId = Date.now();
    const newOrder = {
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
      created_at: new Date(),
      items: snapshottedItems
    };

    mockStore.orders.unshift(newOrder);
    snapshottedItems.forEach((itm, idx) => {
      mockStore.order_details.push({
        order_item_id: orderId + idx,
        order_id: orderId,
        ...itm
      });
    });

    // Real-time broadcast to KDS
    broadcastKdsUpdate({ type: 'ORDER_CREATED', order: newOrder });
    broadcastTableUpdate({ table_id, status: 'Occupied', orderId });

    return res.status(201).json({
      success: true,
      data: newOrder,
      billing,
      message: 'Order placed and dispatched to Lumiere Kitchen'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'status is required' });
  }

  try {
    // 1. Update in PostgreSQL if table exists
    const dbRes = await query('UPDATE orders SET order_status = $1, updated_at = NOW() WHERE order_id = $2 RETURNING *', [status, orderId]);

    // 2. Also keep mockStore in sync
    const order = mockStore.orders.find((o) => o.order_id === orderId);
    if (order) {
      order.order_status = status;
      order.updated_at = new Date();
    }

    // If order is completed/served, update table status
    if (status === 'completed' || status === 'served') {
      const tableId = order ? order.table_id : (dbRes && dbRes.rows && dbRes.rows[0]?.table_id);
      if (tableId) {
        broadcastTableUpdate({ table_id: tableId, status: 'Available' });
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
