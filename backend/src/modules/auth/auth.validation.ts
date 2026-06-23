import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Họ tên không được để trống',
    'any.required': 'Họ tên là bắt buộc',
  }),
  phone: Joi.string().required().messages({
    'string.empty': 'Số điện thoại không được để trống',
    'any.required': 'Số điện thoại là bắt buộc',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Mật khẩu không được để trống',
    'string.min': 'Mật khẩu phải dài ít nhất 6 ký tự',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
  email: Joi.string().email().allow('').optional().messages({
    'string.email': 'Email không đúng định dạng',
  }),
  lodgeName: Joi.string().required().messages({
    'string.empty': 'Tên nhà trọ không được để trống',
    'any.required': 'Tên nhà trọ là bắt buộc',
  }),
  lodgeAddress: Joi.string().allow('').optional(),
});

export const loginSchema = Joi.object({
  phone: Joi.string().required().messages({
    'string.empty': 'Số điện thoại không được để trống',
    'any.required': 'Số điện thoại là bắt buộc',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Mật khẩu không được để trống',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Tên không được để trống',
    'any.required': 'Tên là bắt buộc',
  }),
  email: Joi.string().email().allow('').optional().messages({
    'string.email': 'Email không đúng định dạng',
  }),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'Mật khẩu cũ không được để trống',
    'any.required': 'Mật khẩu cũ là bắt buộc',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.empty': 'Mật khẩu mới không được để trống',
    'string.min': 'Mật khẩu mới phải dài ít nhất 6 ký tự',
    'any.required': 'Mật khẩu mới là bắt buộc',
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email không được để trống',
    'string.email': 'Email không đúng định dạng',
    'any.required': 'Email là bắt buộc',
  }),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email không được để trống',
    'string.email': 'Email không đúng định dạng',
    'any.required': 'Email là bắt buộc',
  }),
  otp: Joi.string().length(6).required().messages({
    'string.empty': 'Mã OTP không được để trống',
    'string.length': 'Mã OTP phải có đúng 6 ký tự',
    'any.required': 'Mã OTP là bắt buộc',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.empty': 'Mật khẩu mới không được để trống',
    'string.min': 'Mật khẩu mới phải dài ít nhất 6 ký tự',
    'any.required': 'Mật khẩu mới là bắt buộc',
  }),
});
