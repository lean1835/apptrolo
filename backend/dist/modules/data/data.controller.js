"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importData = exports.exportData = void 0;
const catchAsync_1 = require("../../common/utils/catchAsync");
const lodge_model_1 = __importDefault(require("../lodge/lodge.model"));
const room_model_1 = __importDefault(require("../room/room.model"));
const ApiError_1 = require("../../common/utils/ApiError");
exports.exportData = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.users.lodge) {
        throw new ApiError_1.ApiError(400, 'Tài khoản của bạn chưa có thông tin nhà trọ');
    }
    const lodge = await lodge_model_1.default.findById(req.users.lodge._id).populate('utilityPrice');
    if (!lodge) {
        throw new ApiError_1.ApiError(404, 'Không tìm thấy thông tin nhà trọ');
    }
    const rooms = await room_model_1.default.find({ lodge: lodge._id })
        .populate('members')
        .populate('meterReadings')
        .populate('bills');
    res.status(200).json({
        success: true,
        message: 'Xuất dữ liệu thành công',
        data: {
            lodge,
            utilityPrice: lodge.utilityPrice,
            rooms,
        },
    });
});
exports.importData = (0, catchAsync_1.catchAsync)(async (req, res) => {
    // Conforming to original controller placeholder
    res.status(200).json({
        success: true,
        message: 'Tính năng nhập dữ liệu đang được hoàn thiện',
        data: {
            message: 'Tính năng nhập dữ liệu đang được hoàn thiện',
        },
    });
});
