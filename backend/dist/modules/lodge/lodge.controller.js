"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLodge = exports.getLodge = void 0;
const catchAsync_1 = require("../../common/utils/catchAsync");
const lodge_service_1 = require("./lodge.service");
const lodgeService = new lodge_service_1.LodgeService();
exports.getLodge = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const lodge = await lodgeService.getLodgeByOwner(req.users._id);
    res.status(200).json({
        success: true,
        message: 'Lấy thông tin nhà trọ thành công',
        data: lodge,
    });
});
exports.updateLodge = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const lodge = await lodgeService.updateLodge(req.users._id, req.body);
    res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin nhà trọ thành công',
        data: lodge,
    });
});
