import { Request, Response } from 'express';
import { catchAsync } from '@common/utils/catchAsync';
import { UtilityPriceService } from './utilityPrice.service';
import { ApiError } from '@common/utils/ApiError';

const utilityPriceService = new UtilityPriceService();

export const getUtilityPrice = catchAsync(async (req: Request, res: Response) => {
  if (!req.users.lodge) {
    throw new ApiError(400, 'Tài khoản của bạn chưa có thông tin nhà trọ');
  }
  const result = await utilityPriceService.getUtilityPriceByLodge(req.users.lodge._id);
  res.status(200).json({
    success: true,
    message: 'Lấy cấu hình bảng giá thành công',
    data: result,
  });
});

export const updateUtilityPrice = catchAsync(async (req: Request, res: Response) => {
  if (!req.users.lodge) {
    throw new ApiError(400, 'Tài khoản của bạn chưa có thông tin nhà trọ');
  }
  const result = await utilityPriceService.updateUtilityPrice(req.users.lodge._id, req.body);
  res.status(200).json({
    success: true,
    message: 'Cập nhật bảng giá thành công',
    data: result,
  });
});
