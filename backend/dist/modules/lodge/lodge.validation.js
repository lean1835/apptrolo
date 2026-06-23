"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLodgeSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.updateLodgeSchema = joi_1.default.object({
    name: joi_1.default.string().required().messages({
        'string.empty': 'Tên nhà trọ không được để trống',
        'any.required': 'Tên nhà trọ là bắt buộc',
    }),
    address: joi_1.default.string().allow('').optional(),
    phone: joi_1.default.string().required().messages({
        'string.empty': 'Số điện thoại không được để trống',
        'any.required': 'Số điện thoại là bắt buộc',
    }),
    bank: joi_1.default.string().allow('').optional(),
    bankName: joi_1.default.string().allow('').optional(),
});
