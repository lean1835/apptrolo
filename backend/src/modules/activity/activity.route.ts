import { Router } from 'express';
import { getRecent } from './activity.controller';

const router = Router();

router.get('/', getRecent);

export default router;
