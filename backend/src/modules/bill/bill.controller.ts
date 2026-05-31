import { Request, Response } from 'express';
import { catchAsync } from '@common/utils/catchAsync';
import RoomModel from '@modules/room/room.model';
import BillModel from '@modules/room/bill.model';
import MeterReadingModel from '@modules/room/meterReading.model';
import { ApiError } from '@common/utils/ApiError';
import { ActivityService } from '@modules/activity/activity.service';
import { logger } from '@common/utils/logger';

const activityService = new ActivityService();

export const getBills = catchAsync(async (req: Request, res: Response) => {
  if (!req.users.lodge) {
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách hóa đơn thành công',
      data: [],
    });
  }

  const rooms = await RoomModel.find({ lodge: req.users.lodge._id });
  const roomIds = rooms.map((r) => r._id);

  const bills = await BillModel.find({ room: { $in: roomIds } });

  // Map to include roomId as in JSON schema expected by mobile app
  const formattedBills = bills.map((b) => {
    const json = b.toJSON();
    return {
      ...json,
      roomId: b.room.toString(), // To match long ID response of roomId from Spring Boot!
    };
  });

  res.status(200).json({
    success: true,
    message: 'Lấy danh sách hóa đơn thành công',
    data: formattedBills,
  });
});

const addOneMonth = (dateStr: string): string => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10); // 1-12
  const day = parseInt(parts[2], 10);
  
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  
  const yStr = year.toString();
  const mStr = month.toString().padStart(2, '0');
  const dStr = day.toString().padStart(2, '0');
  
  return `${yStr}-${mStr}-${dStr}`;
};

const locks = new Map<string, Promise<void>>();

const acquireLock = (roomId: string): Promise<() => void> => {
  const previous = locks.get(roomId) || Promise.resolve();
  let resolveLock: () => void;
  const next = new Promise<void>((resolve) => {
    resolveLock = resolve;
  });
  locks.set(roomId, next);
  
  return previous.then(() => {
    return () => {
      resolveLock();
      if (locks.get(roomId) === next) {
        locks.delete(roomId);
      }
    };
  });
};

export const updateBill = catchAsync(async (req: Request, res: Response) => {
  const bill = await BillModel.findById(req.params.id);
  if (!bill) {
    throw new ApiError(404, 'Không tìm thấy hóa đơn');
  }

  if (req.body.sent !== undefined) {
    bill.sent = req.body.sent;
  }
  
  const wasCollected = bill.collected;
  if (req.body.collected !== undefined) {
    bill.collected = req.body.collected;
  }

  await bill.save();

  // If newly collected, clear room debt status if applicable and log activity
  if (bill.collected && !wasCollected) {
    const release = await acquireLock(bill.room.toString());
    try {
      const room = await RoomModel.findById(bill.room);
      if (room) {
        if (room.status === 'debt' || (room.status as any) === 'Debt') {
          room.status = 'occupied';
        }

        // Automatically transition room to next cycle on payment, regardless of when it is paid
        if (bill.date) {
          if (room.checkin) {
            room.checkin = addOneMonth(room.checkin);
          } else {
            room.checkin = bill.date;
          }

          const readings = await MeterReadingModel.find({ room: room._id }).sort({ date: -1 });
          const latestReading = readings[0];

          if (latestReading) {
            room.ep = latestReading.elec;
            room.wp = latestReading.water;
          }

          await activityService.logActivityByLodge(
            room.lodge.toString(),
            `${room.name} · Bước vào chu kỳ tháng mới, điện nước nối tiếp`,
            'room'
          );
        }

        await room.save();

        const totalFormatted = Math.round(bill.total).toLocaleString('vi-VN') + ' đ';
        await activityService.logActivityByLodge(
          room.lodge.toString(),
          `${room.name} · Đã thu tiền ${totalFormatted}`,
          'bill'
        );
      }
    } catch (err: any) {
      logger.error('❌ Failed to transition room to new cycle on payment:', err);
    } finally {
      release();
    }
  }

  // Format to return roomId as expected by mobile app
  const json = bill.toJSON();
  const formattedBill = {
    ...json,
    roomId: bill.room.toString()
  };

  res.status(200).json({
    success: true,
    message: 'Cập nhật hóa đơn thành công',
    data: formattedBill,
  });
});
