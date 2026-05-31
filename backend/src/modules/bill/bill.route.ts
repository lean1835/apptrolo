import { Router } from 'express';
import { getBills, updateBill } from './bill.controller';

const router = Router();

router.get('/', getBills);
router.put('/:id', updateBill);

export default router;
