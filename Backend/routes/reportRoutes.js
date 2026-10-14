import express from 'express';
import {
  getDailyReports,
  getExecutiveAnalytics,
  triggerEodPipeline
} from '../controllers/reportController.js';

const router = express.Router();

router.get('/daily', getDailyReports);
router.get('/analytics', getExecutiveAnalytics);
router.post('/eod', triggerEodPipeline);

export default router;
