import { Request, Response } from 'express';
import { catchAsync } from '@common/utils/catchAsync';
import { LodgeService } from './lodge.service';

const lodgeService = new LodgeService();

export const getLodge = catchAsync(async (req: Request, res: Response) => {
  const lodge = await lodgeService.getLodgeByOwner(req.users._id);
  res.status(200).json({
    success: true,
    message: 'Lấy thông tin nhà trọ thành công',
    data: lodge,
  });
});

export const updateLodge = catchAsync(async (req: Request, res: Response) => {
  const lodge = await lodgeService.updateLodge(req.users._id, req.body);
  res.status(200).json({
    success: true,
    message: 'Cập nhật thông tin nhà trọ thành công',
    data: lodge,
  });
});
