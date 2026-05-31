import { Router } from 'express';
import { authenticationMiddleware } from '../middlewares/authen.middleware';

import AuthRoute from '@modules/auth/auth.route';
import LodgeRoute from '@modules/lodge/lodge.route';
import UtilityPriceRoute from '@modules/utilityPrice/utilityPrice.route';
import RoomRoute from '@modules/room/room.route';
import BillRoute from '@modules/bill/bill.route';
import ActivityRoute from '@modules/activity/activity.route';
import DataRoute from '@modules/data/data.route';

const router = Router();

// Register routes
router.use('/auth', AuthRoute);
router.use('/lodge', authenticationMiddleware, LodgeRoute);
router.use('/utility-prices', authenticationMiddleware, UtilityPriceRoute);
router.use('/rooms', authenticationMiddleware, RoomRoute);
router.use('/bills', authenticationMiddleware, BillRoute);
router.use('/activities', authenticationMiddleware, ActivityRoute);
router.use('/data', authenticationMiddleware, DataRoute);

export default router;
