import { query, mockStore, getDbStatus } from '../config/db.js';

export const getOwnerProfile = async (req, res) => {
  try {
    const dbRes = await query('SELECT * FROM owner ORDER BY owner_id ASC LIMIT 1');
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      return res.json({ success: true, data: dbRes.rows[0], source: 'postgresql' });
    }
    const mockData = mockStore.owner[0];
    return res.json({ success: true, data: mockData, source: 'mock_fallback' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateOwnerProfile = async (req, res) => {
  const {
    owner_name,
    restaurant_name,
    email_id,
    phone_no,
    address,
    gstin,
    currency,
    open_time,
    close_time,
    status
  } = req.body;

  try {
    const sql = `
      UPDATE owner SET
        owner_name = COALESCE($1, owner_name),
        restaurant_name = COALESCE($2, restaurant_name),
        email_id = COALESCE($3, email_id),
        phone_no = COALESCE($4, phone_no),
        address = COALESCE($5, address),
        gstin = COALESCE($6, gstin),
        currency = COALESCE($7, currency),
        open_time = COALESCE($8, open_time),
        close_time = COALESCE($9, close_time),
        status = COALESCE($10, status),
        updated_at = NOW()
      WHERE owner_id = 1
      RETURNING *;
    `;
    const dbRes = await query(sql, [
      owner_name,
      restaurant_name,
      email_id,
      phone_no,
      address,
      gstin,
      currency,
      open_time,
      close_time,
      status
    ]);

    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      return res.json({ success: true, data: dbRes.rows[0], message: 'Owner profile updated in PostgreSQL' });
    }

    // In-memory update
    const current = mockStore.owner[0];
    mockStore.owner[0] = {
      ...current,
      ...req.body
    };

    return res.json({ success: true, data: mockStore.owner[0], message: 'Owner profile updated in session store' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
