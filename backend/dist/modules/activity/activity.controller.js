"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecent = void 0;
const catchAsync_1 = require("../../common/utils/catchAsync");
const activity_model_1 = __importDefault(require("./activity.model"));
exports.getRecent = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const acts = await activity_model_1.default.find({ user: req.users._id })
        .sort({ time: -1 })
        .limit(10);
    res.status(200).json({
        success: true,
        message: 'Lấy danh sách hoạt động gần đây thành công',
        data: acts,
    });
});
