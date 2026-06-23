"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validate_middleware_1 = require("../../common/middlewares/validate.middleware");
const room_controller_1 = require("./room.controller");
const room_validation_1 = require("./room.validation");
const router = (0, express_1.Router)();
// Room CRUD
router.get('/', room_controller_1.getRooms);
router.post('/', (0, validate_middleware_1.validate)(room_validation_1.createRoomSchema), room_controller_1.createRoom);
router.get('/:id/history', room_controller_1.getRoomHistory);
router.get('/:id', room_controller_1.getRoom);
router.put('/:id', (0, validate_middleware_1.validate)(room_validation_1.updateRoomSchema), room_controller_1.updateRoom);
router.delete('/:id', room_controller_1.deleteRoom);
// Members
router.post('/:id/members', (0, validate_middleware_1.validate)(room_validation_1.memberSchema), room_controller_1.addMember);
router.delete('/members/:memberId', room_controller_1.removeMember);
// Meter Readings
router.post('/:id/meter-readings', (0, validate_middleware_1.validate)(room_validation_1.meterReadingSchema), room_controller_1.addMeterReading);
// Bills
router.post('/:id/bills', (0, validate_middleware_1.validate)(room_validation_1.billSchema), room_controller_1.createBill);
exports.default = router;
