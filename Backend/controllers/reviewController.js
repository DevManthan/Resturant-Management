import { mockStore } from '../config/db.js';

export const getReviews = async (req, res) => {
  return res.json({ success: true, count: mockStore.review.length, data: mockStore.review });
};

export const createReview = async (req, res) => {
  const { order_id, customer_id, rating, food_quality, service, comments, is_anonymous } = req.body;

  if (!rating) {
    return res.status(400).json({ success: false, error: 'rating (1-5) is required' });
  }

  const newReview = {
    review_id: Date.now(),
    order_id: order_id || null,
    customer_id: customer_id || 1,
    rating: parseInt(rating, 10),
    food_quality: parseInt(food_quality || rating, 10),
    service: parseInt(service || rating, 10),
    comments: comments || '',
    review_date: new Date(),
    is_anonymous: Boolean(is_anonymous),
    display_on: true
  };

  mockStore.review.unshift(newReview);

  return res.status(201).json({
    success: true,
    data: newReview,
    message: 'Review submitted successfully'
  });
};
