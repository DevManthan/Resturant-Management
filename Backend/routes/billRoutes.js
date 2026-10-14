import express from 'express';
import {
  getBills,
  calculateBill,
  splitBill,
  settleBill
} from '../controllers/billController.js';

const router = express.Router();

router.get('/', getBills);
router.post('/calculate', calculateBill);
router.post('/split', splitBill);
router.post('/settle', settleBill);

export default router;
