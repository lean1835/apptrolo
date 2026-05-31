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
  bankName: Joi.string().allow('').optional(),
});
