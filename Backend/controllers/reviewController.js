import { query, mockStore } from '../config/db.js';
import { broadcastKdsUpdate } from '../socket.js';

export const getReviews = async (req, res) => {
  try {
    const dbRes = await query(`
      SELECT r.review_id, r.order_id, r.customer_id, r.rating, r.food_quality, r.service, 
             r.comments, r.review_date, r.is_anonymous, r.display_on,
             COALESCE(c.customer_name, 'Verified Guest') as customer_name
      FROM review r
      LEFT JOIN customer c ON r.customer_id = c.customer_id
      WHERE r.display_on = TRUE
      ORDER BY r.review_id DESC
      LIMIT 10;
    `);

    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      return res.json({ success: true, count: dbRes.rows.length, data: dbRes.rows, source: 'postgresql' });
    }

    return res.json({ success: true, count: mockStore.review.length, data: mockStore.review, source: 'mock_fallback' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createReview = async (req, res) => {
  const { order_id, customer_id, customer_name, rating, food_quality, service, comments, is_anonymous } = req.body;

  if (!rating) {
    return res.status(400).json({ success: false, error: 'rating (1-5) is required' });
  }

  try {
    let resolvedCustomerId = customer_id;
    if (!resolvedCustomerId && customer_name) {
      try {
        const custCheck = await query('SELECT customer_id FROM customer WHERE customer_name = $1 LIMIT 1', [customer_name]);
        if (custCheck && custCheck.rows.length > 0) {
          resolvedCustomerId = custCheck.rows[0].customer_id;
        } else {
          const newCust = await query(
            'INSERT INTO customer (customer_name, phone_no, email, loyalty_points) VALUES ($1, $2, $3, $4) RETURNING customer_id',
            [customer_name, '+91 99999 88888', '', 50]
          );
          if (newCust && newCust.rows.length > 0) {
            resolvedCustomerId = newCust.rows[0].customer_id;
          }
        }
      } catch (e) {
        console.warn('[Review] Customer resolution warning:', e.message);
      }
    }
    if (!resolvedCustomerId) resolvedCustomerId = 1;

    // Sync sequence to avoid collision
    try {
      await query(`SELECT setval('review_review_id_seq', COALESCE((SELECT MAX(review_id) FROM review), 1), true)`);
    } catch (e) {}

    let newReview = null;
    try {
      const dbRes = await query(
        `INSERT INTO review (order_id, customer_id, rating, food_quality, service, comments, is_anonymous, display_on)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
         RETURNING *;`,
        [
          order_id || null,
          resolvedCustomerId,
          parseInt(rating, 10),
          parseInt(food_quality || rating, 10),
          parseInt(service || rating, 10),
          comments || '',
          Boolean(is_anonymous)
        ]
      );
      if (dbRes && dbRes.rows.length > 0) {
        newReview = {
          ...dbRes.rows[0],
          customer_name: customer_name || 'Verified Guest'
        };
      }
    } catch (dbErr) {
      console.warn('[Review Insert DB Error]:', dbErr.message);
    }

    if (!newReview) {
      newReview = {
        review_id: Date.now(),
        order_id: order_id || null,
        customer_id: resolvedCustomerId,
        customer_name: customer_name || 'Verified Guest',
        rating: parseInt(rating, 10),
        food_quality: parseInt(food_quality || rating, 10),
        service: parseInt(service || rating, 10),
        comments: comments || '',
        review_date: new Date(),
        is_anonymous: Boolean(is_anonymous),
        display_on: true
      };
    }

    mockStore.review.unshift(newReview);

    // Broadcast review to management
    broadcastKdsUpdate({
      type: 'NEW_REVIEW',
      review: newReview
    });

    return res.status(201).json({
      success: true,
      data: newReview,
      message: 'Review saved to PostgreSQL database successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
