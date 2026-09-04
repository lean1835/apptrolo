import { Request, Response } from 'express';
import { catchAsync } from '@common/utils/catchAsync';
import RoomModel from '@modules/room/room.model';
import BillModel from '@modules/room/bill.model';
import TenantModel from '@modules/room/tenant.model';
import MeterReadingModel from '@modules/room/meterReading.model';
import { ApiError } from '@common/utils/ApiError';
import { ActivityService } from '@modules/activity/activity.service';
import { logger } from '@common/utils/logger';
import { getPaymentLockState, getUnpaidAmount } from '@common/utils/derivedFields';

const activityService = new ActivityService();

export const getBills = catchAsync(async (req: Request, res: Response) => {
  if (!req.users.lodge) {
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách hóa đơn thành công',
      data: [],
    });
  }

  const rooms = await RoomModel.find({ lodge: req.users.lodge._id }).select('_id').lean();
  const roomIds = rooms.map((r: any) => r._id);

  const bills = await BillModel.find({ room: { $in: roomIds } }).sort({ date: -1 }).lean();

  // Map to include roomId and derived fields
  const formattedBills = bills.map((b: any) => {
    const remaining = getUnpaidAmount(b.total, b.amountPaid);
    const lockState = getPaymentLockState(b.total, b.amountPaid);
    return {
      ...b,
      id: b._id.toString(),
      roomId: b.room ? b.room.toString() : '',
      remainingAmount: remaining,
      lockState,
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

  // Resource Guard: Đảm bảo hóa đơn thuộc sở hữu của nhà trọ đang đăng nhập
  const room = await RoomModel.findById(bill.room);
  if (!room || (req.users?.lodge && room.lodge.toString() !== req.users.lodge._id.toString())) {
    throw new ApiError(403, 'Bạn không có quyền thao tác trên hóa đơn này');
  }

  if (req.body.sent !== undefined) {
    bill.sent = req.body.sent;
  }

  // F4.09: Sửa bill thu một phần (tổng mới không được nhỏ hơn số đã thu)
  if (req.body.total !== undefined) {
    const newTotal = Number(req.body.total);
    if ((bill.amountPaid || 0) > 0 && newTotal < (bill.amountPaid || 0)) {
      throw new ApiError(400, 'Tổng tiền không được nhỏ hơn số tiền đã thu.');
    }
    bill.total = newTotal;
  }

  const wasCollected = bill.collected;
  const prevAmountPaid = bill.amountPaid || 0;

  // F4.05: Chặn thu vượt quá số tiền của hóa đơn
  if (req.body.amountPaid !== undefined) {
    const incomingPaid = Number(req.body.amountPaid);
    if (incomingPaid > bill.total) {
      throw new ApiError(400, 'Số tiền thu vượt quá số còn thiếu.');
    }
    bill.amountPaid = incomingPaid;
  } else if (req.body.collected === true) {
    bill.amountPaid = bill.total;
  }

  bill.collected = (bill.amountPaid || 0) >= bill.total;
  bill.status = getPaymentLockState(bill.total, bill.amountPaid);

  if (bill.amountPaid > 0) {
    bill.paidAt = new Date().toISOString().split('T')[0];
  }

  let partialUnpaidDiff = Math.max(0, bill.total - (bill.amountPaid || 0));

  await bill.save();

  // Nếu thu tiền một phần (thu thiếu), cập nhật trạng thái phòng sang 'debt'
  if (!bill.collected && (bill.amountPaid || 0) > 0) {
    await RoomModel.findByIdAndUpdate(bill.room, { status: 'debt' });
  }

  // If newly collected / paid
  if (bill.collected && !wasCollected) {
    const release = await acquireLock(bill.room.toString());
    try {
      const room = await RoomModel.findById(bill.room);
      if (room) {
        if (partialUnpaidDiff > 0) {
          room.status = 'debt';
          (room as any).debtAmount = ((room as any).debtAmount || 0) + partialUnpaidDiff;
        } else {
          if (room.status === 'debt' || (room.status as any) === 'Debt') {
            room.status = 'occupied';
          }
        }

        const tenant = await TenantModel.findOne({ room: room._id, status: 'active' });
        if (tenant && bill.date) {
          if (tenant.checkin) {
            tenant.checkin = addOneMonth(tenant.checkin);
          } else {
            tenant.checkin = bill.date;
          }
          await tenant.save();
        }

        const readings = await MeterReadingModel.find({ room: room._id }).sort({ date: -1 });
        const latestReading = readings[0];

        if (latestReading) {
          room.initialElec = latestReading.elec;
          room.initialWater = latestReading.water;
        }

        await activityService.logActivityByLodge(
          room.lodge.toString(),
          `${room.name} · Bước vào chu kỳ tháng mới, điện nước nối tiếp`,
          'room'
        );

        await room.save();

        const totalFormatted = Math.round(bill.total).toLocaleString('vi-VN') + ' đ';
        let logMsg = `${room.name} · Đã thu tiền ${totalFormatted}`;
        if (partialUnpaidDiff > 0) {
          const diffFormatted = Math.round(partialUnpaidDiff).toLocaleString('vi-VN') + ' đ';
          logMsg += ` (Khách đóng thiếu nợ ${diffFormatted})`;
        }
        await activityService.logActivityByLodge(
          room.lodge.toString(),
          logMsg,
          'bill'
        );
      }
    } catch (err: any) {
      logger.error('❌ Failed to transition room to new cycle on payment:', err);
    } finally {
      release();
    }
  }

  const json = bill.toJSON();
  const formattedBill = {
    ...json,
    roomId: bill.room.toString(),
    remainingAmount: getUnpaidAmount(bill.total, bill.amountPaid),
    lockState: getPaymentLockState(bill.total, bill.amountPaid),
  };

  res.status(200).json({
    success: true,
    message: 'Cập nhật hóa đơn thành công',
    data: formattedBill,
  });
});

export const deleteBill = catchAsync(async (req: Request, res: Response) => {
  const bill = await BillModel.findById(req.params.id);
  if (!bill) {
    throw new ApiError(404, 'Không tìm thấy hóa đơn');
  }

  // Resource Guard: Đảm bảo hóa đơn thuộc sở hữu của nhà trọ đang đăng nhập
  const room = await RoomModel.findById(bill.room);
  if (!room || (req.users?.lodge && room.lodge.toString() !== req.users.lodge._id.toString())) {
    throw new ApiError(403, 'Bạn không có quyền thao tác trên hóa đơn này');
  }

  // F3.F: Chỉ cho phép xóa khi chưa thu tiền (amountPaid === 0)
  if ((bill.amountPaid || 0) > 0) {
    throw new ApiError(400, 'Không thể xóa hóa đơn đã thu hoặc thu một phần.');
  }

  const [bYearStr, bMonthStr] = (bill.date || '').split('-');
  const bYear = parseInt(bYearStr, 10);
  const bMonth = parseInt(bMonthStr, 10);

  const session = await BillModel.startSession();
  try {
    await session.withTransaction(async () => {
      // 1. Xóa bản ghi chỉ số điện nước của kỳ đó nếu có
      if (bYear && bMonth) {
        const readings = await MeterReadingModel.find({ room: bill.room }).session(session);
        const matchReading = readings.find(r => {
          const [ry, rm] = r.date.split('-');
          return parseInt(ry, 10) === bYear && parseInt(rm, 10) === bMonth;
        });
        if (matchReading) {
          await MeterReadingModel.findByIdAndDelete(matchReading._id).session(session);
        }
      }

      // 2. Xóa hóa đơn
      await BillModel.findByIdAndDelete(bill._id).session(session);

      // 3. Log nhật ký hoạt động
      if (room) {
        await activityService.logActivityByLodge(
          room.lodge.toString(),
          `${room.name} · Đã hủy hóa đơn tháng ${bMonth}/${bYear}, phòng trở về Chưa chốt`,
          'bill'
        );
      }
    });
  } finally {
    session.endSession();
  }

  res.status(200).json({
    success: true,
    message: 'Đã xóa hóa đơn và chỉ số điện nước kỳ tương ứng',
  });
});
