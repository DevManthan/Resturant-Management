import express from 'express';
import {
  getAllOrders,
  getKdsQueue,
  createOrder,
  updateOrderStatus,
  callWaiter,
  getTableCart,
  updateTableCart
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getAllOrders);
router.get('/kds', getKdsQueue);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);
router.post('/call-waiter', callWaiter);
router.get('/cart/:tableId', getTableCart);
router.post('/cart/:tableId', updateTableCart);

export default router;
