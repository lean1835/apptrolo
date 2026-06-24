"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.updateProfile = exports.getMe = exports.authenticate = exports.register = void 0;
const catchAsync_1 = require("../../common/utils/catchAsync");
const auth_service_1 = require("./auth.service");
const authService = new auth_service_1.AuthService();
exports.register = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(200).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: result,
    });
});
exports.authenticate = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await authService.authenticate(req.body);
    res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result,
    });
});
exports.getMe = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await authService.getMe(req.users.phone);
    res.status(200).json({
        success: true,
        message: 'Lấy thông tin tài khoản thành công',
        data: result,
    });
});
exports.updateProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await authService.updateProfile(req.users.phone, req.body);
    res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin cá nhân thành công',
        data: result,
    });
});
exports.changePassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await authService.changePassword(req.users.phone, req.body);
    res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công',
        data: { message: 'Đổi mật khẩu thành công' },
    });
});
exports.forgotPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await authService.forgotPassword(req.body);
    res.status(200).json({
        success: true,
        message: 'Mã xác thực OTP đã được gửi về email của bạn',
    });
});
exports.resetPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await authService.resetPassword(req.body);
    res.status(200).json({
        success: true,
        message: 'Đặt lại mật khẩu thành công',
    });
});
