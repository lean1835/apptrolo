"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.changePasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.registerSchema = joi_1.default.object({
    name: joi_1.default.string().required().messages({
        'string.empty': 'Họ tên không được để trống',
        'any.required': 'Họ tên là bắt buộc',
    }),
    phone: joi_1.default.string().required().messages({
        'string.empty': 'Số điện thoại không được để trống',
        'any.required': 'Số điện thoại là bắt buộc',
    }),
    password: joi_1.default.string().min(6).required().messages({
        'string.empty': 'Mật khẩu không được để trống',
        'string.min': 'Mật khẩu phải dài ít nhất 6 ký tự',
        'any.required': 'Mật khẩu là bắt buộc',
    }),
    email: joi_1.default.string().email().allow('').optional().messages({
        'string.email': 'Email không đúng định dạng',
    }),
    lodgeName: joi_1.default.string().required().messages({
        'string.empty': 'Tên nhà trọ không được để trống',
        'any.required': 'Tên nhà trọ là bắt buộc',
    }),
    lodgeAddress: joi_1.default.string().allow('').optional(),
});
exports.loginSchema = joi_1.default.object({
    phone: joi_1.default.string().required().messages({
        'string.empty': 'Số điện thoại không được để trống',
        'any.required': 'Số điện thoại là bắt buộc',
    }),
    password: joi_1.default.string().required().messages({
        'string.empty': 'Mật khẩu không được để trống',
        'any.required': 'Mật khẩu là bắt buộc',
    }),
});
exports.updateProfileSchema = joi_1.default.object({
    name: joi_1.default.string().required().messages({
        'string.empty': 'Tên không được để trống',
        'any.required': 'Tên là bắt buộc',
    }),
    email: joi_1.default.string().email().allow('').optional().messages({
        'string.email': 'Email không đúng định dạng',
    }),
});
exports.changePasswordSchema = joi_1.default.object({
    oldPassword: joi_1.default.string().required().messages({
        'string.empty': 'Mật khẩu cũ không được để trống',
        'any.required': 'Mật khẩu cũ là bắt buộc',
    }),
    newPassword: joi_1.default.string().min(6).required().messages({
        'string.empty': 'Mật khẩu mới không được để trống',
        'string.min': 'Mật khẩu mới phải dài ít nhất 6 ký tự',
        'any.required': 'Mật khẩu mới là bắt buộc',
    }),
});
exports.forgotPasswordSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.empty': 'Email không được để trống',
        'string.email': 'Email không đúng định dạng',
        'any.required': 'Email là bắt buộc',
    }),
});
exports.resetPasswordSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.empty': 'Email không được để trống',
        'string.email': 'Email không đúng định dạng',
        'any.required': 'Email là bắt buộc',
    }),
    otp: joi_1.default.string().length(6).required().messages({
        'string.empty': 'Mã OTP không được để trống',
        'string.length': 'Mã OTP phải có đúng 6 ký tự',
        'any.required': 'Mã OTP là bắt buộc',
    }),
    newPassword: joi_1.default.string().min(6).required().messages({
        'string.empty': 'Mật khẩu mới không được để trống',
        'string.min': 'Mật khẩu mới phải dài ít nhất 6 ký tự',
        'any.required': 'Mật khẩu mới là bắt buộc',
    }),
});
