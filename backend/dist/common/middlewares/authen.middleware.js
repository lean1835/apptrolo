"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticationMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const ApiError_1 = require("../utils/ApiError");
const catchAsync_1 = require("../utils/catchAsync");
const auth_model_1 = __importDefault(require("../../modules/auth/auth.model"));
exports.authenticationMiddleware = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError_1.ApiError(401, 'Không có quyền truy cập, vui lòng đăng nhập');
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.JWT_SECRET);
        const phone = decoded.sub || decoded.phone;
        if (!phone) {
            throw new ApiError_1.ApiError(401, 'Phiên đăng nhập không hợp lệ');
        }
        const user = await auth_model_1.default.findOne({ phone }).populate({
            path: 'lodge',
            populate: {
                path: 'utilityPrice'
            }
        });
        if (!user) {
            throw new ApiError_1.ApiError(401, 'Tài khoản không tồn tại trong hệ thống');
        }
        // Attach user to request object
        req.users = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new ApiError_1.ApiError(401, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'));
        }
        return next(new ApiError_1.ApiError(401, 'Token xác thực không hợp lệ'));
    }
});
