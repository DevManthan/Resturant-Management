import express from 'express';
import {
  getBookings,
  createBooking,
  updateBookingStatus
} from '../controllers/bookingController.js';

const router = express.Router();

router.get('/', getBookings);
router.post('/', createBooking);
router.patch('/:id/status', updateBookingStatus);

export default router;
