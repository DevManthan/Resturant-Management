import express from 'express';
import { getOwnerProfile, updateOwnerProfile } from '../controllers/ownerController.js';

const router = express.Router();

router.get('/', getOwnerProfile);
router.put('/', updateOwnerProfile);

export default router;
