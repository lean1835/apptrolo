import Joi from 'joi';

export const updateUtilityPriceSchema = Joi.object({
  elec: Joi.number().required().messages({ 'any.required': 'Giá điện là bắt buộc' }),
  water: Joi.number().required().messages({ 'any.required': 'Giá nước là bắt buộc' }),
  wifi: Joi.number().required().messages({ 'any.required': 'Giá WiFi là bắt buộc' }),
  garbage: Joi.number().required().messages({ 'any.required': 'Giá rác là bắt buộc' }),
  waterMode: Joi.string().valid('meter', 'person', 'fixed').required().messages({
    'any.only': 'Chế độ tính tiền nước phải là khối (meter) hoặc theo người (person/fixed)',
    'any.required': 'Chế độ tính tiền nước là bắt buộc',
  }),
  waterFixed: Joi.number().required().messages({ 'any.required': 'Giá nước theo người/tháng là bắt buộc' }),
});
