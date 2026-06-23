"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.billSchema = exports.meterReadingSchema = exports.memberSchema = exports.updateRoomSchema = exports.createRoomSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createRoomSchema = joi_1.default.object({
    name: joi_1.default.string().required().messages({ 'any.required': 'Tên phòng là bắt buộc' }),
    price: joi_1.default.number().required().messages({ 'any.required': 'Giá thuê là bắt buộc' }),
    status: joi_1.default.string().valid('empty', 'occupied', 'debt', 'maintenance').optional(),
    tenant: joi_1.default.string().allow('').optional(),
    phone: joi_1.default.string().allow('').optional(),
    checkin: joi_1.default.string().allow('').optional(),
    people: joi_1.default.number().optional(),
    ep: joi_1.default.number().optional(),
    wp: joi_1.default.number().optional(),
    descText: joi_1.default.string().allow('').optional(),
    contract: joi_1.default.string().valid('monthly', 'quarter', 'halfyear').optional(),
    contractMonths: joi_1.default.number().optional(),
    contractPrepaid: joi_1.default.number().optional(),
});
exports.updateRoomSchema = joi_1.default.object({
    name: joi_1.default.string().required().messages({ 'any.required': 'Tên phòng là bắt buộc' }),
    price: joi_1.default.number().required().messages({ 'any.required': 'Giá thuê là bắt buộc' }),
    status: joi_1.default.string().valid('empty', 'occupied', 'debt', 'maintenance').required(),
    tenant: joi_1.default.string().allow('').optional(),
    phone: joi_1.default.string().allow('').optional(),
    checkin: joi_1.default.string().allow('').optional(),
    people: joi_1.default.number().optional(),
    ep: joi_1.default.number().optional(),
    wp: joi_1.default.number().optional(),
    descText: joi_1.default.string().allow('').optional(),
    contract: joi_1.default.string().valid('monthly', 'quarter', 'halfyear').optional(),
    contractMonths: joi_1.default.number().optional(),
    contractPrepaid: joi_1.default.number().optional(),
    members: joi_1.default.array().optional(),
    meterReadings: joi_1.default.array().optional(),
    bills: joi_1.default.array().optional(),
    id: joi_1.default.any().optional(),
    _id: joi_1.default.any().optional(),
    createdAt: joi_1.default.any().optional(),
    updatedAt: joi_1.default.any().optional(),
    lodge: joi_1.default.any().optional(),
    __v: joi_1.default.any().optional(),
});
exports.memberSchema = joi_1.default.object({
    name: joi_1.default.string().required().messages({ 'any.required': 'Họ tên thành viên là bắt buộc' }),
    phone: joi_1.default.string().allow('').optional(),
    note: joi_1.default.string().allow('').optional(),
});
exports.meterReadingSchema = joi_1.default.object({
    elec: joi_1.default.number().required().messages({ 'any.required': 'Số điện là bắt buộc' }),
    water: joi_1.default.number().required().messages({ 'any.required': 'Số nước là bắt buộc' }),
    date: joi_1.default.string().required().messages({ 'any.required': 'Ngày ghi là bắt buộc' }),
});
exports.billSchema = joi_1.default.object({
    total: joi_1.default.number().required().messages({ 'any.required': 'Tổng tiền là bắt buộc' }),
    sent: joi_1.default.boolean().optional(),
    collected: joi_1.default.boolean().optional(),
    date: joi_1.default.string().required().messages({ 'any.required': 'Ngày xuất hóa đơn là bắt buộc' }),
});
