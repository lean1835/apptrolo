"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUtilityPriceSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.updateUtilityPriceSchema = joi_1.default.object({
    elec: joi_1.default.number().required().messages({ 'any.required': 'Giá điện là bắt buộc' }),
    water: joi_1.default.number().required().messages({ 'any.required': 'Giá nước là bắt buộc' }),
    wifi: joi_1.default.number().required().messages({ 'any.required': 'Giá WiFi là bắt buộc' }),
    garbage: joi_1.default.number().required().messages({ 'any.required': 'Giá rác là bắt buộc' }),
    waterMode: joi_1.default.string().valid('meter', 'fixed').required().messages({
        'any.only': 'Chế độ tính tiền nước phải là meter hoặc fixed',
        'any.required': 'Chế độ tính tiền nước là bắt buộc',
    }),
    waterFixed: joi_1.default.number().required().messages({ 'any.required': 'Giá nước cố định là bắt buộc' }),
});
