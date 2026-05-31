import { Router } from 'express';
import { validate } from '@common/middlewares/validate.middleware';
import { getUtilityPrice, updateUtilityPrice } from './utilityPrice.controller';
import { updateUtilityPriceSchema } from './utilityPrice.validation';

const router = Router();

router.get('/', getUtilityPrice);
router.put('/', validate(updateUtilityPriceSchema), updateUtilityPrice);

export default router;
