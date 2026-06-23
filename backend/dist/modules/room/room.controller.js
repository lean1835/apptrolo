"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBill = exports.addMeterReading = exports.removeMember = exports.addMember = exports.deleteRoom = exports.updateRoom = exports.getRoomHistory = exports.getRoom = exports.createRoom = exports.getRooms = void 0;
const catchAsync_1 = require("../../common/utils/catchAsync");
const room_service_1 = require("./room.service");
const ApiError_1 = require("../../common/utils/ApiError");
const roomService = new room_service_1.RoomService();
exports.getRooms = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.users.lodge) {
        throw new ApiError_1.ApiError(400, 'Tài khoản của bạn chưa có thông tin nhà trọ');
    }
    const rooms = await roomService.getRoomsByLodge(req.users.lodge._id);
    res.status(200).json({
        success: true,
        message: 'Lấy danh sách phòng thành công',
        data: rooms,
    });
});
exports.createRoom = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.users.lodge) {
        throw new ApiError_1.ApiError(400, 'Tài khoản của bạn chưa có thông tin nhà trọ');
    }
    const room = await roomService.saveRoom(req.users.lodge._id, req.body);
    res.status(200).json({
        success: true,
        message: 'Tạo phòng thành công',
        data: room,
    });
});
exports.getRoom = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const room = await roomService.getRoomById(req.params.id);
    res.status(200).json({
        success: true,
        message: 'Lấy chi tiết phòng thành công',
        data: room,
    });
});
exports.getRoomHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const items = await roomService.getRoomHistory(req.params.id, req.users._id.toString());
    res.status(200).json({
        success: true,
        message: 'Lấy lịch sử phòng thành công',
        data: items,
    });
});
exports.updateRoom = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.users.lodge) {
        throw new ApiError_1.ApiError(400, 'Tài khoản của bạn chưa có thông tin nhà trọ');
    }
    const room = await roomService.saveRoom(req.users.lodge._id, {
        ...req.body,
        _id: req.params.id,
    });
    res.status(200).json({
        success: true,
        message: 'Cập nhật phòng thành công',
        data: room,
    });
});
exports.deleteRoom = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await roomService.deleteRoom(req.params.id);
    res.status(204).send();
});
exports.addMember = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const member = await roomService.addMember(req.params.id, req.body);
    res.status(200).json({
        success: true,
        message: 'Thêm người ở cùng thành công',
        data: member,
    });
});
exports.removeMember = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await roomService.removeMember(req.params.memberId);
    res.status(204).send();
});
exports.addMeterReading = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const reading = await roomService.addMeterReading(req.params.id, req.body);
    res.status(200).json({
        success: true,
        message: 'Ghi số điện nước thành công',
        data: reading,
    });
});
exports.createBill = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const bill = await roomService.createBill(req.params.id, req.body);
    res.status(200).json({
        success: true,
        message: 'Tạo hóa đơn thành công',
        data: bill,
    });
});
