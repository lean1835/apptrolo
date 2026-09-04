import Joi from 'joi';

export const updateLodgeSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Tên nhà trọ không được để trống',
    'any.required': 'Tên nhà trọ là bắt buộc',
  }),
  address: Joi.string().allow('').optional(),
  phone: Joi.string().required().messages({
    'string.empty': 'Số điện thoại không được để trống',
    'any.required': 'Số điện thoại là bắt buộc',
  }),
  bank: Joi.string().allow('').optional(),
  bankAccount: Joi.string().allow('').optional(),
  bankName: Joi.string().allow('').optional(),
  billingDate: Joi.number().min(1).max(28).optional().messages({
    'number.min': 'Ngày chốt điện nước từ ngày 1 đến ngày 28',
    'number.max': 'Ngày chốt điện nước từ ngày 1 đến ngày 28',
  }),
  earlyRecordDays: Joi.number().min(0).optional(),
});
