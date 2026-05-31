import { Request, Response } from 'express';
import { catchAsync } from '@common/utils/catchAsync';
import { RoomService } from './room.service';
import { ApiError } from '@common/utils/ApiError';

const roomService = new RoomService();

export const getRooms = catchAsync(async (req: Request, res: Response) => {
  if (!req.users.lodge) {
    throw new ApiError(400, 'Tài khoản của bạn chưa có thông tin nhà trọ');
  }
  const rooms = await roomService.getRoomsByLodge(req.users.lodge._id);
  res.status(200).json({
    success: true,
    message: 'Lấy danh sách phòng thành công',
    data: rooms,
  });
});

export const createRoom = catchAsync(async (req: Request, res: Response) => {
  if (!req.users.lodge) {
    throw new ApiError(400, 'Tài khoản của bạn chưa có thông tin nhà trọ');
  }
  const room = await roomService.saveRoom(req.users.lodge._id, req.body);
  res.status(200).json({
    success: true,
    message: 'Tạo phòng thành công',
    data: room,
  });
});

export const getRoom = catchAsync(async (req: Request, res: Response) => {
  const room = await roomService.getRoomById(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Lấy chi tiết phòng thành công',
    data: room,
  });
});

export const getRoomHistory = catchAsync(async (req: Request, res: Response) => {
  const items = await roomService.getRoomHistory(req.params.id, req.users._id.toString());
  res.status(200).json({
    success: true,
    message: 'Lấy lịch sử phòng thành công',
    data: items,
  });
});

export const updateRoom = catchAsync(async (req: Request, res: Response) => {
  if (!req.users.lodge) {
    throw new ApiError(400, 'Tài khoản của bạn chưa có thông tin nhà trọ');
  }
  const room = await roomService.saveRoom(req.users.lodge._id, {
    ...req.body,
    _id: req.params.id,
  });
  res.status(200).json({
    success: true,
    message: 'Cập nhật phòng thành công',
    data: room,
  });
});

export const deleteRoom = catchAsync(async (req: Request, res: Response) => {
  await roomService.deleteRoom(req.params.id);
  res.status(204).send();
});

export const addMember = catchAsync(async (req: Request, res: Response) => {
  const member = await roomService.addMember(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Thêm người ở cùng thành công',
    data: member,
  });
});

export const removeMember = catchAsync(async (req: Request, res: Response) => {
  await roomService.removeMember(req.params.memberId);
  res.status(204).send();
});

export const addMeterReading = catchAsync(async (req: Request, res: Response) => {
  const reading = await roomService.addMeterReading(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Ghi số điện nước thành công',
    data: reading,
  });
});

export const createBill = catchAsync(async (req: Request, res: Response) => {
  const bill = await roomService.createBill(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Tạo hóa đơn thành công',
    data: bill,
  });
});
