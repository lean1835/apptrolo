"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_model_1 = __importDefault(require("./auth.model"));
const lodge_model_1 = __importDefault(require("../lodge/lodge.model"));
const utilityPrice_model_1 = __importDefault(require("../utilityPrice/utilityPrice.model"));
const environment_1 = require("../../common/config/environment");
const ApiError_1 = require("../../common/utils/ApiError");
const email_1 = require("../../common/utils/email");
const mongoose_1 = __importDefault(require("mongoose"));
class AuthService {
    async register(payload) {
        const session = await mongoose_1.default.startSession();
        try {
            let result;
            await session.withTransaction(async () => {
                const existingUser = await auth_model_1.default.findOne({ phone: payload.phone }).session(session);
                if (existingUser) {
                    throw new ApiError_1.ApiError(400, 'Số điện thoại này đã được đăng ký');
                }
                const hashedPassword = await bcrypt_1.default.hash(payload.password, 10);
                // 1. Create User
                const user = new auth_model_1.default({
                    name: payload.name,
                    phone: payload.phone,
                    email: payload.email || '',
                    password: hashedPassword,
                });
                await user.save({ session });
                // 2. Create Lodge
                const lodge = new lodge_model_1.default({
                    name: payload.lodgeName,
                    address: payload.lodgeAddress || '',
                    phone: payload.phone,
                    owner: user._id,
                });
                await lodge.save({ session });
                // 3. Create Utility Price
                const utilityPrice = new utilityPrice_model_1.default({
                    elec: 3500.0,
                    water: 15000.0,
                    wifi: 100000.0,
                    garbage: 20000.0,
                    waterMode: 'meter',
                    waterFixed: 150000.0,
                    lodge: lodge._id,
                });
                await utilityPrice.save({ session });
                // Update relationships
                lodge.utilityPrice = utilityPrice._id;
                await lodge.save({ session });
                user.lodge = lodge._id;
                await user.save({ session });
                const jwtToken = jsonwebtoken_1.default.sign({ sub: user.phone }, environment_1.JWT_SECRET, {
                    expiresIn: parseInt(environment_1.JWT_EXPIRATION, 10) || 86400000,
                });
                result = {
                    token: jwtToken,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                };
            });
            return result;
        }
        finally {
            session.endSession();
        }
    }
    async authenticate(payload) {
        const user = await auth_model_1.default.findOne({ phone: payload.phone });
        if (!user) {
            throw new ApiError_1.ApiError(400, 'Số điện thoại hoặc mật khẩu không chính xác');
        }
        const isMatch = await bcrypt_1.default.compare(payload.password, user.password);
        if (!isMatch) {
            throw new ApiError_1.ApiError(400, 'Số điện thoại hoặc mật khẩu không chính xác');
        }
        const jwtToken = jsonwebtoken_1.default.sign({ sub: user.phone }, environment_1.JWT_SECRET, {
            expiresIn: parseInt(environment_1.JWT_EXPIRATION, 10) || 86400000,
        });
        return {
            token: jwtToken,
            name: user.name,
            phone: user.phone,
            email: user.email,
        };
    }
    async getMe(phone) {
        const user = await auth_model_1.default.findOne({ phone }).populate({
            path: 'lodge',
            populate: {
                path: 'utilityPrice',
            },
        });
        if (!user) {
            throw new ApiError_1.ApiError(404, 'Không tìm thấy người dùng');
        }
        return user;
    }
    async updateProfile(phone, payload) {
        const user = await auth_model_1.default.findOne({ phone });
        if (!user) {
            throw new ApiError_1.ApiError(404, 'Không tìm thấy người dùng');
        }
        user.name = payload.name;
        user.email = payload.email || '';
        await user.save();
        return user;
    }
    async changePassword(phone, payload) {
        const user = await auth_model_1.default.findOne({ phone });
        if (!user) {
            throw new ApiError_1.ApiError(404, 'Không tìm thấy người dùng');
        }
        const isMatch = await bcrypt_1.default.compare(payload.oldPassword, user.password);
        if (!isMatch) {
            throw new ApiError_1.ApiError(400, 'Mật khẩu cũ không chính xác');
        }
        user.password = await bcrypt_1.default.hash(payload.newPassword, 10);
        await user.save();
    }
    async forgotPassword(payload) {
        const emailLower = payload.email.trim().toLowerCase();
        const user = await auth_model_1.default.findOne({ email: emailLower });
        if (!user) {
            throw new ApiError_1.ApiError(404, 'Không tìm thấy người dùng với email này');
        }
        // Generate a random 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
        await user.save();
        // Send email to user
        await (0, email_1.sendOTPEmail)(emailLower, otp);
        // Log to console for testing
        console.log(`\n==================================================`);
        console.log(`[RESET PASSWORD] OTP for email ${emailLower} is: ${otp}`);
        console.log(`==================================================\n`);
    }
    async resetPassword(payload) {
        const emailLower = payload.email.trim().toLowerCase();
        const user = await auth_model_1.default.findOne({ email: emailLower });
        if (!user) {
            throw new ApiError_1.ApiError(404, 'Không tìm thấy người dùng');
        }
        if (!user.resetPasswordOTP || user.resetPasswordOTP !== payload.otp) {
            throw new ApiError_1.ApiError(400, 'Mã xác thực OTP không chính xác');
        }
        if (!user.resetPasswordOTPExpires || user.resetPasswordOTPExpires.getTime() < Date.now()) {
            throw new ApiError_1.ApiError(400, 'Mã xác thực OTP đã hết hạn');
        }
        // Update password
        user.password = await bcrypt_1.default.hash(payload.newPassword, 10);
        user.resetPasswordOTP = '';
        user.resetPasswordOTPExpires = null;
        await user.save();
    }
}
exports.AuthService = AuthService;
