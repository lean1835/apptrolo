import { Router } from 'express';
import { getBills, updateBill, deleteBill } from './bill.controller';

const router = Router();

router.get('/', getBills);
router.put('/:id', updateBill);
router.delete('/:id', deleteBill);

export default router;
