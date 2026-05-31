import Joi from 'joi';

export const createRoomSchema = Joi.object({
  name: Joi.string().required().messages({ 'any.required': 'Tên phòng là bắt buộc' }),
  price: Joi.number().required().messages({ 'any.required': 'Giá thuê là bắt buộc' }),
  status: Joi.string().valid('empty', 'occupied', 'debt', 'maintenance').optional(),
  tenant: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  checkin: Joi.string().allow('').optional(),
  people: Joi.number().optional(),
  ep: Joi.number().optional(),
  wp: Joi.number().optional(),
  descText: Joi.string().allow('').optional(),
  contract: Joi.string().valid('monthly', 'quarter', 'halfyear').optional(),
  contractMonths: Joi.number().optional(),
  contractPrepaid: Joi.number().optional(),
});

export const updateRoomSchema = Joi.object({
  name: Joi.string().required().messages({ 'any.required': 'Tên phòng là bắt buộc' }),
  price: Joi.number().required().messages({ 'any.required': 'Giá thuê là bắt buộc' }),
  status: Joi.string().valid('empty', 'occupied', 'debt', 'maintenance').required(),
  tenant: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  checkin: Joi.string().allow('').optional(),
  people: Joi.number().optional(),
  ep: Joi.number().optional(),
  wp: Joi.number().optional(),
  descText: Joi.string().allow('').optional(),
  contract: Joi.string().valid('monthly', 'quarter', 'halfyear').optional(),
  contractMonths: Joi.number().optional(),
  contractPrepaid: Joi.number().optional(),
  members: Joi.array().optional(),
  meterReadings: Joi.array().optional(),
  bills: Joi.array().optional(),
  id: Joi.any().optional(),
  _id: Joi.any().optional(),
  createdAt: Joi.any().optional(),
  updatedAt: Joi.any().optional(),
  lodge: Joi.any().optional(),
  __v: Joi.any().optional(),
});

export const memberSchema = Joi.object({
  name: Joi.string().required().messages({ 'any.required': 'Họ tên thành viên là bắt buộc' }),
  phone: Joi.string().allow('').optional(),
  note: Joi.string().allow('').optional(),
});

export const meterReadingSchema = Joi.object({
  elec: Joi.number().required().messages({ 'any.required': 'Số điện là bắt buộc' }),
  water: Joi.number().required().messages({ 'any.required': 'Số nước là bắt buộc' }),
  date: Joi.string().required().messages({ 'any.required': 'Ngày ghi là bắt buộc' }),
});

export const billSchema = Joi.object({
  total: Joi.number().required().messages({ 'any.required': 'Tổng tiền là bắt buộc' }),
  sent: Joi.boolean().optional(),
  collected: Joi.boolean().optional(),
  date: Joi.string().required().messages({ 'any.required': 'Ngày xuất hóa đơn là bắt buộc' }),
});
