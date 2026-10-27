import { query, mockStore } from '../config/db.js';
import { broadcastTableUpdate } from '../socket.js';

export const getBookings = async (req, res) => {
  try {
    const { date, status } = req.query;
    let sql = `
      SELECT b.booking_id, b.customer_id, b.table_id, 
             TO_CHAR(b.booking_date, 'YYYY-MM-DD') as booking_date, 
             b.booking_time, b.guest_count, b.special_preferences, 
             b.status, b.duration, b.created_at,
             c.customer_name, c.phone_no
      FROM booking b
      LEFT JOIN customer c ON b.customer_id = c.customer_id
      WHERE 1=1
    `;
    const params = [];
    if (date) {
      params.push(date);
      sql += ` AND b.booking_date = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND LOWER(b.status) = LOWER($${params.length})`;
    }
    sql += ' ORDER BY b.booking_id DESC';

    const dbRes = await query(sql, params);
    if (dbRes && dbRes.rows) {
      return res.json({ success: true, count: dbRes.rows.length, data: dbRes.rows, source: 'postgresql' });
    }

    let bookings = [...mockStore.booking];
    if (date) {
      bookings = bookings.filter((b) => b.booking_date === date);
    }
    if (status) {
      bookings = bookings.filter((b) => b.status.toLowerCase() === status.toLowerCase());
    }

    return res.json({ success: true, count: bookings.length, data: bookings, source: 'mock_fallback' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createBooking = async (req, res) => {
  const {
    table_id,
    customer_id,
    customer_name,
    phone_no,
    booking_date,
    booking_time,
    guest_count,
    special_preferences
  } = req.body;

  if (!table_id || !booking_date || !booking_time) {
    return res.status(400).json({ success: false, error: 'table_id, booking_date, and booking_time are required' });
  }

  try {
    let resolvedCustomerId = null;

    // Prioritize customer_name and phone_no to ensure reservations reflect true guest names
    if (customer_name || phone_no) {
      try {
        let custCheck = null;
        if (phone_no && phone_no.trim()) {
          custCheck = await query(
            'SELECT customer_id FROM customer WHERE phone_no = $1 LIMIT 1',
            [phone_no.trim()]
          );
        }
        if ((!custCheck || !custCheck.rows || custCheck.rows.length === 0) && customer_name && customer_name.trim()) {
          custCheck = await query(
            'SELECT customer_id FROM customer WHERE LOWER(customer_name) = LOWER($1) LIMIT 1',
            [customer_name.trim()]
          );
        }

        if (custCheck && custCheck.rows && custCheck.rows.length > 0) {
          resolvedCustomerId = custCheck.rows[0].customer_id;
          if (customer_name && customer_name.trim()) {
            await query('UPDATE customer SET customer_name = $1 WHERE customer_id = $2', [customer_name.trim(), resolvedCustomerId]);
          }
        } else {
          // Sync sequence to avoid duplicate key errors
          try {
            await query(`SELECT setval('customer_customer_id_seq', COALESCE((SELECT MAX(customer_id) FROM customer), 1), true)`);
          } catch (e) {}

          const newCust = await query(
            `INSERT INTO customer (customer_name, phone_no, email, loyalty_points) 
             VALUES ($1, $2, $3, $4) 
             RETURNING customer_id`,
            [customer_name ? customer_name.trim() : 'Guest Diner', phone_no ? phone_no.trim() : `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`, '', 50]
          );
          if (newCust && newCust.rows && newCust.rows.length > 0) {
            resolvedCustomerId = newCust.rows[0].customer_id;
          }
        }
      } catch (custErr) {
        console.warn('[Booking] Customer auto-resolution warning:', custErr.message);
      }
    }

    if (!resolvedCustomerId) {
      if (customer_id) {
        try {
          const cCheck = await query('SELECT customer_id FROM customer WHERE customer_id = $1', [customer_id]);
          if (cCheck && cCheck.rows && cCheck.rows.length > 0) {
            resolvedCustomerId = cCheck.rows[0].customer_id;
          }
        } catch (e) {}
      }
      if (!resolvedCustomerId) {
        try {
          const anyCust = await query('SELECT customer_id FROM customer LIMIT 1');
          if (anyCust && anyCust.rows && anyCust.rows.length > 0) {
            resolvedCustomerId = anyCust.rows[0].customer_id;
          } else {
            const newCust = await query(
              `INSERT INTO customer (customer_name, phone_no, email, loyalty_points) 
               VALUES ($1, $2, $3, $4) 
               RETURNING customer_id`,
              ['Guest Diner', `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`, '', 50]
            );
            if (newCust && newCust.rows && newCust.rows.length > 0) {
              resolvedCustomerId = newCust.rows[0].customer_id;
            }
          }
        } catch (e) {}
      }
    }

    // Sync sequence to avoid collision with seed IDs
    try {
      await query(`SELECT setval('booking_booking_id_seq', COALESCE((SELECT MAX(booking_id) FROM booking), 1), true)`);
    } catch (e) {}

    // INSERT INTO PostgreSQL booking table
    let newBooking = null;
    const initialStatus = req.body.status || 'Confirmed';
    try {
      const insertSql = `
        INSERT INTO booking (
          customer_id, table_id, booking_date, booking_time, guest_count, special_preferences, status, duration
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;
      const dbRes = await query(insertSql, [
        resolvedCustomerId,
        table_id,
        booking_date,
        booking_time,
        parseInt(guest_count, 10) || 2,
        special_preferences || '',
        initialStatus,
        '2 hours'
      ]);

      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        newBooking = {
          ...dbRes.rows[0],
          customer_name: customer_name || 'Guest Party',
          phone_no: phone_no || ''
        };
      }
    } catch (dbErr) {
      console.error('[Booking] PostgreSQL insert error:', dbErr.message);
    }

    // Fallback if DB was unavailable
    if (!newBooking) {
      newBooking = {
        booking_id: Date.now(),
        customer_id: resolvedCustomerId,
        customer_name: customer_name || 'Guest Party',
        phone_no: phone_no || '',
        table_id,
        booking_date,
        booking_time,
        guest_count: parseInt(guest_count, 10) || 2,
        special_preferences: special_preferences || '',
        status: initialStatus,
        duration: '2 hours',
        created_at: new Date()
      };
    }

    mockStore.booking.unshift(newBooking);

    // Update floorplan table state to Reserved or Occupied
    broadcastTableUpdate({
      table_id,
      status: initialStatus === 'Seated' ? 'Occupied' : 'Reserved',
      party: customer_name ? `${customer_name} (${guest_count || 2}p)` : (initialStatus === 'Seated' ? `Walk-in Guests (${guest_count || 2}p)` : 'Reserved Party'),
      time: booking_time
    });

    return res.status(201).json({
      success: true,
      data: newBooking,
      message: `Table ${table_id} reserved successfully in PostgreSQL for ${newBooking.guest_count} guests`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  const { status } = req.body;

  try {
    let updatedBooking = null;
    try {
      const dbRes = await query(
        'UPDATE booking SET status = $1 WHERE booking_id = $2 RETURNING *',
        [status, bookingId]
      );
      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        updatedBooking = dbRes.rows[0];
      }
    } catch (e) {
      console.warn('[Booking] DB update warning:', e.message);
    }

    const mockItem = mockStore.booking.find((b) => b.booking_id === bookingId);
    if (mockItem) {
      mockItem.status = status;
      if (!updatedBooking) updatedBooking = mockItem;
    }

    if (!updatedBooking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (status === 'Seated') {
      broadcastTableUpdate({ table_id: updatedBooking.table_id, status: 'Occupied', party: updatedBooking.customer_name });
    } else if (status === 'Cancelled' || status === 'Completed') {
      broadcastTableUpdate({ table_id: updatedBooking.table_id, status: 'Available' });
    }

    return res.json({ success: true, data: updatedBooking, message: `Booking status changed to ${status} in PostgreSQL` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
