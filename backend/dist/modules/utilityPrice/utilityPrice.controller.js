"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUtilityPrice = exports.getUtilityPrice = void 0;
const catchAsync_1 = require("../../common/utils/catchAsync");
const utilityPrice_service_1 = require("./utilityPrice.service");
const ApiError_1 = require("../../common/utils/ApiError");
const utilityPriceService = new utilityPrice_service_1.UtilityPriceService();
exports.getUtilityPrice = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.users.lodge) {
        throw new ApiError_1.ApiError(400, 'Tài khoản của bạn chưa có thông tin nhà trọ');
    }
    const result = await utilityPriceService.getUtilityPriceByLodge(req.users.lodge._id);
    res.status(200).json({
        success: true,
        message: 'Lấy cấu hình bảng giá thành công',
        data: result,
    });
});
exports.updateUtilityPrice = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.users.lodge) {
        throw new ApiError_1.ApiError(400, 'Tài khoản của bạn chưa có thông tin nhà trọ');
    }
    const result = await utilityPriceService.updateUtilityPrice(req.users.lodge._id, req.body);
    res.status(200).json({
        success: true,
        message: 'Cập nhật bảng giá thành công',
        data: result,
    });
});
