import { Router } from 'express';
import { validate } from '@common/middlewares/validate.middleware';
import { getLodge, updateLodge } from './lodge.controller';
import { updateLodgeSchema } from './lodge.validation';

const router = Router();

router.get('/', getLodge);
router.put('/', validate(updateLodgeSchema), updateLodge);

export default router;
