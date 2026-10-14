import express from 'express';
import {
  getMenuItems,
  addMenuItem,
  toggleStockStatus,
  updateMenuItem,
  deleteMenuItem
} from '../controllers/menuController.js';

const router = express.Router();

router.get('/', getMenuItems);
router.post('/', addMenuItem);
router.put('/:id', updateMenuItem);
router.patch('/:id/stock', toggleStockStatus);
router.delete('/:id', deleteMenuItem);

export default router;
