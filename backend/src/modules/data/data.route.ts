import { Router } from 'express';
import { exportData, importData } from './data.controller';

const router = Router();

router.get('/export', exportData);
router.post('/import', importData);

export default router;
