import express from 'express';
import {
  getAllOrders,
  getKdsQueue,
  createOrder,
  updateOrderStatus
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getAllOrders);
router.get('/kds', getKdsQueue);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;
