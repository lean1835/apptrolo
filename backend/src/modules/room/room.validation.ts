import Joi from 'joi';

export const createRoomSchema = Joi.object({
  name: Joi.string().required().messages({ 'any.required': 'Tên phòng là bắt buộc' }),
  price: Joi.number().required().messages({ 'any.required': 'Giá thuê là bắt buộc' }),
  status: Joi.string().valid('empty', 'occupied', 'debt', 'maintenance').optional(),
  initialElec: Joi.number().optional(),
  initialWater: Joi.number().optional(),
  ep: Joi.number().optional(),
  wp: Joi.number().optional(),
  descText: Joi.string().allow('').optional(),
  
  // Thông tin khách thuê ban đầu nếu có
  tenant: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  checkin: Joi.string().allow('').optional(),
  contract: Joi.string().valid('monthly', 'quarter', 'halfyear', 'yearly').optional(),
  contractMonths: Joi.number().optional(),
  contractPrepaid: Joi.number().optional(),
  prepaidUntil: Joi.number().optional(),
  handoverElec: Joi.number().optional(),
  handoverWater: Joi.number().optional(),
  people: Joi.number().optional(),
  createdAt: Joi.any().optional(),
});

export const updateRoomSchema = Joi.object({
  name: Joi.string().optional(),
  price: Joi.number().optional(),
  status: Joi.string().valid('empty', 'occupied', 'debt', 'maintenance').optional(),
  initialElec: Joi.number().optional(),
  initialWater: Joi.number().optional(),
  ep: Joi.number().optional(),
  wp: Joi.number().optional(),
  descText: Joi.string().allow('').optional(),
  
  // Thông tin khách thuê
  tenant: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  checkin: Joi.string().allow('').optional(),
  contract: Joi.string().valid('monthly', 'quarter', 'halfyear', 'yearly').optional(),
  contractMonths: Joi.number().optional(),
  contractPrepaid: Joi.number().optional(),
  prepaidUntil: Joi.number().optional(),
  handoverElec: Joi.number().optional(),
  handoverWater: Joi.number().optional(),
  people: Joi.number().optional(),
  
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
  relation: Joi.string().allow('').optional(),
  note: Joi.string().allow('').optional(),
});

export const meterReadingSchema = Joi.object({
  elec: Joi.number().required().messages({ 'any.required': 'Số điện là bắt buộc' }),
  water: Joi.number().required().messages({ 'any.required': 'Số nước là bắt buộc' }),
  date: Joi.string().required().messages({ 'any.required': 'Ngày ghi là bắt buộc' }),
  period: Joi.string().allow('').optional(),
  isMeterReplaced: Joi.boolean().optional(),
  oldMeterElecEnd: Joi.number().optional(),
  newMeterElecStart: Joi.number().optional(),
  oldMeterWaterEnd: Joi.number().optional(),
  newMeterWaterStart: Joi.number().optional(),
});

export const billSchema = Joi.object({
  total: Joi.number().required().messages({ 'any.required': 'Tổng tiền là bắt buộc' }),
  amountPaid: Joi.number().optional(),
  sent: Joi.boolean().optional(),
  collected: Joi.boolean().optional(),
  date: Joi.string().required().messages({ 'any.required': 'Ngày xuất hóa đơn là bắt buộc' }),
  periodStart: Joi.string().allow('').optional(),
  periodEnd: Joi.string().allow('').optional(),
  rent: Joi.number().optional(),
  elecOld: Joi.number().optional(),
  elecNew: Joi.number().optional(),
  elecUsage: Joi.number().optional(),
  elecPrice: Joi.number().optional(),
  elecAmount: Joi.number().optional(),
  waterOld: Joi.number().optional(),
  waterNew: Joi.number().optional(),
  waterUsage: Joi.number().optional(),
  waterPrice: Joi.number().optional(),
  waterAmount: Joi.number().optional(),
  wifiAmount: Joi.number().optional(),
  garbageAmount: Joi.number().optional(),
  otherFee: Joi.number().optional(),
  deduction: Joi.number().optional(),
  prepaidDeduction: Joi.number().optional(),
  hasOldDebt: Joi.boolean().optional(),
  oldTenantName: Joi.string().allow('').optional(),
  oldDebtAmount: Joi.number().optional(),
  note: Joi.string().allow('').optional(),
});
