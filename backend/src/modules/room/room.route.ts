import { Router } from 'express';
import { validate } from '@common/middlewares/validate.middleware';
import {
  getRooms,
  createRoom,
  getRoom,
  getRoomHistory,
  updateRoom,
  deleteRoom,
  addMember,
  removeMember,
  addMeterReading,
  createBill,
  checkoutPreview,
  checkoutComplete,
} from './room.controller';
import {
  createRoomSchema,
  updateRoomSchema,
  memberSchema,
  meterReadingSchema,
  billSchema,
} from './room.validation';

const router = Router();

// Room CRUD
router.get('/', getRooms);
router.post('/', validate(createRoomSchema), createRoom);
router.get('/:id/history', getRoomHistory);
router.get('/:id', getRoom);
router.put('/:id', validate(updateRoomSchema), updateRoom);
router.delete('/:id', deleteRoom);

// Checkout (Trả phòng)
router.post('/:id/checkout-preview', checkoutPreview);
router.post('/:id/checkout-complete', checkoutComplete);

// Members
router.post('/:id/members', validate(memberSchema), addMember);
router.delete('/members/:memberId', removeMember);

// Meter Readings
router.post('/:id/meter-readings', validate(meterReadingSchema), addMeterReading);

// Bills
router.post('/:id/bills', validate(billSchema), createBill);

export default router;
