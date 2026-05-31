import { Request, Response } from 'express';
import { catchAsync } from '@common/utils/catchAsync';
import LodgeModel from '@modules/lodge/lodge.model';
import RoomModel from '@modules/room/room.model';
import { ApiError } from '@common/utils/ApiError';

export const exportData = catchAsync(async (req: Request, res: Response) => {
  if (!req.users.lodge) {
    throw new ApiError(400, 'Tài khoản của bạn chưa có thông tin nhà trọ');
  }

  const lodge = await LodgeModel.findById(req.users.lodge._id).populate('utilityPrice');
  if (!lodge) {
    throw new ApiError(404, 'Không tìm thấy thông tin nhà trọ');
  }

  const rooms = await RoomModel.find({ lodge: lodge._id })
    .populate('members')
    .populate('meterReadings')
    .populate('bills');

  res.status(200).json({
    success: true,
    message: 'Xuất dữ liệu thành công',
    data: {
      lodge,
      utilityPrice: lodge.utilityPrice,
      rooms,
    },
  });
});

export const importData = catchAsync(async (req: Request, res: Response) => {
  // Conforming to original controller placeholder
  res.status(200).json({
    success: true,
    message: 'Tính năng nhập dữ liệu đang được hoàn thiện',
    data: {
      message: 'Tính năng nhập dữ liệu đang được hoàn thiện',
    },
  });
});
