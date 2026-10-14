import { query, mockStore } from '../config/db.js';
import { broadcastTableUpdate } from '../socket.js';

export const getBookings = async (req, res) => {
  try {
    const { date, status } = req.query;
    let bookings = [...mockStore.booking];

    if (date) {
      bookings = bookings.filter((b) => b.booking_date === date);
    }
    if (status) {
      bookings = bookings.filter((b) => b.status.toLowerCase() === status.toLowerCase());
    }

    return res.json({ success: true, count: bookings.length, data: bookings });
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
    let resolvedCustomerId = customer_id;
    if (!resolvedCustomerId && customer_name) {
      // Create guest customer record if not exists
      resolvedCustomerId = Date.now();
      mockStore.customer.push({
        customer_id: resolvedCustomerId,
        customer_name,
        phone_no: phone_no || '+91 99999 88888',
        email: '',
        loyalty_points: 50
      });
    }

    const bookingId = Date.now();
    const newBooking = {
      booking_id: bookingId,
      customer_id: resolvedCustomerId || 1,
      customer_name: customer_name || 'Guest Party',
      table_id,
      booking_date,
      booking_time,
      guest_count: parseInt(guest_count, 10) || 2,
      special_preferences: special_preferences || '',
      status: 'Confirmed',
      duration: '2 hours',
      created_at: new Date()
    };

    mockStore.booking.unshift(newBooking);

    // Update floorplan table state to Reserved
    broadcastTableUpdate({
      table_id,
      status: 'Reserved',
      party: customer_name || 'Reserved Party',
      time: booking_time
    });

    return res.status(201).json({
      success: true,
      data: newBooking,
      message: `Table ${table_id} reserved successfully for ${newBooking.guest_count} guests`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  const { status } = req.body;

  const booking = mockStore.booking.find((b) => b.booking_id === bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }

  booking.status = status;

  if (status === 'Seated') {
    broadcastTableUpdate({ table_id: booking.table_id, status: 'Occupied', party: booking.customer_name });
  } else if (status === 'Cancelled' || status === 'Completed') {
    broadcastTableUpdate({ table_id: booking.table_id, status: 'Available' });
  }

  return res.json({ success: true, data: booking, message: `Booking status changed to ${status}` });
};
