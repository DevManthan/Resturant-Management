import { query, mockStore } from '../config/db.js';

export const getMenuItems = async (req, res) => {
  try {
    const { category, in_stock } = req.query;
    let sql = 'SELECT * FROM menu_items WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    if (in_stock !== undefined) {
      params.push(in_stock === 'true');
      sql += ` AND in_stock = $${params.length}`;
    }
    sql += ' ORDER BY category ASC, item_name ASC';

    const dbRes = await query(sql, params);
    if (dbRes && dbRes.rows) {
      return res.json({ success: true, count: dbRes.rows.length, data: dbRes.rows, source: 'postgresql' });
    }

    let items = [...mockStore.menu_items];
    if (category && category !== 'All') {
      items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }
    if (in_stock !== undefined) {
      const boolVal = in_stock === 'true';
      items = items.filter((i) => i.in_stock === boolVal);
    }

    return res.json({ success: true, count: items.length, data: items, source: 'mock_fallback' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const addMenuItem = async (req, res) => {
  const {
    item_name,
    category,
    price,
    cost_price,
    prep_time,
    image_url,
    discount,
    in_stock,
    description
  } = req.body;

  if (!item_name || !price) {
    return res.status(400).json({ success: false, error: 'item_name and price are required' });
  }

  const parsedPrice = parseFloat(price);
  const parsedCost = parseFloat(cost_price) || Math.round(parsedPrice * 0.35);
  const parsedPrep = parseInt(prep_time, 10) || 15;
  const parsedDiscount = parseFloat(discount) || 0;
  const inStockBool = in_stock !== undefined ? Boolean(in_stock) : true;

  try {
    const sql = `
      INSERT INTO menu_items (
        owner_id, item_name, category, price, cost_price, prep_time, image_url, discount, in_stock, description
      ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const dbRes = await query(sql, [
      item_name,
      category || 'Mains',
      parsedPrice,
      parsedCost,
      parsedPrep,
      image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      parsedDiscount,
      inStockBool,
      description || ''
    ]);

    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      return res.status(201).json({ success: true, data: dbRes.rows[0], message: 'Dish added to menu in PostgreSQL' });
    }

    const newItem = {
      menu_id: Date.now(),
      owner_id: 1,
      item_name,
      category: category || 'Mains',
      price: parsedPrice,
      cost_price: parsedCost,
      prep_time: parsedPrep,
      image_url: image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      discount: parsedDiscount,
      in_stock: inStockBool,
      description: description || '',
      daily_sales: 0
    };
    mockStore.menu_items.unshift(newItem);

    return res.status(201).json({ success: true, data: newItem, message: 'Dish added to menu' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const toggleStockStatus = async (req, res) => {
  const menuId = parseInt(req.params.id, 10);
  const { in_stock } = req.body;

  try {
    const updateSql = `
      UPDATE menu_items 
      SET in_stock = COALESCE($1, NOT in_stock)
      WHERE menu_id = $2
      RETURNING *;
    `;
    const dbRes = await query(updateSql, [in_stock !== undefined ? in_stock : null, menuId]);
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      return res.json({ success: true, data: dbRes.rows[0], message: 'Stock status updated in PostgreSQL' });
    }

    const index = mockStore.menu_items.findIndex((m) => m.menu_id === menuId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    const newStatus = in_stock !== undefined ? Boolean(in_stock) : !mockStore.menu_items[index].in_stock;
    mockStore.menu_items[index].in_stock = newStatus;

    return res.json({
      success: true,
      data: mockStore.menu_items[index],
      message: `${mockStore.menu_items[index].item_name} is now ${newStatus ? 'In Stock' : 'Out of Stock (86\'d)'}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  const menuId = parseInt(req.params.id, 10);
  try {
    const dbRes = await query('DELETE FROM menu_items WHERE menu_id = $1 RETURNING *', [menuId]);
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      return res.json({ success: true, message: 'Item deleted from PostgreSQL' });
    }

    const index = mockStore.menu_items.findIndex((m) => m.menu_id === menuId);
    if (index !== -1) {
      mockStore.menu_items.splice(index, 1);
      return res.json({ success: true, message: 'Item removed from menu' });
    }
    return res.status(404).json({ success: false, error: 'Item not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
