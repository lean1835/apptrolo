"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBill = exports.getBills = void 0;
const catchAsync_1 = require("../../common/utils/catchAsync");
const room_model_1 = __importDefault(require("../room/room.model"));
const bill_model_1 = __importDefault(require("../room/bill.model"));
const meterReading_model_1 = __importDefault(require("../room/meterReading.model"));
const ApiError_1 = require("../../common/utils/ApiError");
const activity_service_1 = require("../activity/activity.service");
const logger_1 = require("../../common/utils/logger");
const activityService = new activity_service_1.ActivityService();
exports.getBills = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.users.lodge) {
        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách hóa đơn thành công',
            data: [],
        });
    }
    const rooms = await room_model_1.default.find({ lodge: req.users.lodge._id });
    const roomIds = rooms.map((r) => r._id);
    const bills = await bill_model_1.default.find({ room: { $in: roomIds } });
    // Map to include roomId as in JSON schema expected by mobile app
    const formattedBills = bills.map((b) => {
        const json = b.toJSON();
        return {
            ...json,
            roomId: b.room.toString(), // To match long ID response of roomId from Spring Boot!
        };
    });
    res.status(200).json({
        success: true,
        message: 'Lấy danh sách hóa đơn thành công',
        data: formattedBills,
    });
});
const addOneMonth = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3)
        return dateStr;
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10); // 1-12
    const day = parseInt(parts[2], 10);
    month += 1;
    if (month > 12) {
        month = 1;
        year += 1;
    }
    const yStr = year.toString();
    const mStr = month.toString().padStart(2, '0');
    const dStr = day.toString().padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
};
const locks = new Map();
const acquireLock = (roomId) => {
    const previous = locks.get(roomId) || Promise.resolve();
    let resolveLock;
    const next = new Promise((resolve) => {
        resolveLock = resolve;
    });
    locks.set(roomId, next);
    return previous.then(() => {
        return () => {
            resolveLock();
            if (locks.get(roomId) === next) {
                locks.delete(roomId);
            }
        };
    });
};
exports.updateBill = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const bill = await bill_model_1.default.findById(req.params.id);
    if (!bill) {
        throw new ApiError_1.ApiError(404, 'Không tìm thấy hóa đơn');
    }
    if (req.body.sent !== undefined) {
        bill.sent = req.body.sent;
    }
    const wasCollected = bill.collected;
    if (req.body.collected !== undefined) {
        bill.collected = req.body.collected;
    }
    let partialUnpaidDiff = 0;
    if (req.body.collected && req.body.amountPaid !== undefined) {
        const amountPaid = parseFloat(req.body.amountPaid);
        if (!isNaN(amountPaid) && amountPaid < bill.total) {
            partialUnpaidDiff = bill.total - amountPaid;
            bill.total = amountPaid;
        }
    }
    await bill.save();
    // If newly collected, clear room debt status if applicable and log activity
    if (bill.collected && !wasCollected) {
        const release = await acquireLock(bill.room.toString());
        try {
            const room = await room_model_1.default.findById(bill.room);
            if (room) {
                if (partialUnpaidDiff > 0) {
                    room.status = 'debt';
                    room.debtAmount = (room.debtAmount || 0) + partialUnpaidDiff;
                }
                else {
                    if (room.status === 'debt' || room.status === 'Debt') {
                        room.status = 'occupied';
                    }
                }
                // Automatically transition room to next cycle on payment, regardless of when it is paid
                if (bill.date) {
                    if (room.checkin) {
                        room.checkin = addOneMonth(room.checkin);
                    }
                    else {
                        room.checkin = bill.date;
                    }
                    const readings = await meterReading_model_1.default.find({ room: room._id }).sort({ date: -1 });
                    const latestReading = readings[0];
                    if (latestReading) {
                        room.ep = latestReading.elec;
                        room.wp = latestReading.water;
                    }
                    await activityService.logActivityByLodge(room.lodge.toString(), `${room.name} · Bước vào chu kỳ tháng mới, điện nước nối tiếp`, 'room');
                }
                await room.save();
                const totalFormatted = Math.round(bill.total).toLocaleString('vi-VN') + ' đ';
                let logMsg = `${room.name} · Đã thu tiền ${totalFormatted}`;
                if (partialUnpaidDiff > 0) {
                    const diffFormatted = Math.round(partialUnpaidDiff).toLocaleString('vi-VN') + ' đ';
                    logMsg += ` (Khách đóng thiếu nợ ${diffFormatted})`;
                }
                await activityService.logActivityByLodge(room.lodge.toString(), logMsg, 'bill');
            }
        }
        catch (err) {
            logger_1.logger.error('❌ Failed to transition room to new cycle on payment:', err);
        }
        finally {
            release();
        }
    }
    // Format to return roomId as expected by mobile app
    const json = bill.toJSON();
    const formattedBill = {
        ...json,
        roomId: bill.room.toString()
    };
    res.status(200).json({
        success: true,
        message: 'Cập nhật hóa đơn thành công',
        data: formattedBill,
    });
});
