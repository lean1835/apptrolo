import { Request, Response } from 'express';
import { catchAsync } from '@common/utils/catchAsync';
import ActivityModel from './activity.model';

export const getRecent = catchAsync(async (req: Request, res: Response) => {
  const acts = await ActivityModel.find({ user: req.users._id })
    .sort({ time: -1 })
    .limit(10)
    .lean();

  res.status(200).json({
    success: true,
    message: 'Lấy danh sách hoạt động gần đây thành công',
    data: acts,
  });
});
