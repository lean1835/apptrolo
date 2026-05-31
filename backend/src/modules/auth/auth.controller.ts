import { Request, Response } from 'express';
import { catchAsync } from '@common/utils/catchAsync';
import { AuthService } from './auth.service';

const authService = new AuthService();

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(200).json({
    success: true,
    message: 'Đăng ký tài khoản thành công',
    data: result,
  });
});

export const authenticate = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.authenticate(req.body);
  res.status(200).json({
    success: true,
    message: 'Đăng nhập thành công',
    data: result,
  });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.getMe(req.users.phone);
  res.status(200).json({
    success: true,
    message: 'Lấy thông tin tài khoản thành công',
    data: result,
  });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.updateProfile(req.users.phone, req.body);
  res.status(200).json({
    success: true,
    message: 'Cập nhật thông tin cá nhân thành công',
    data: result,
  });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  await authService.changePassword(req.users.phone, req.body);
  res.status(200).json({
    success: true,
    message: 'Đổi mật khẩu thành công',
    data: { message: 'Đổi mật khẩu thành công' },
  });
});
