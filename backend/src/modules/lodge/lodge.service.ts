import LodgeModel from './lodge.model';
import { ILodge } from '@common/interfaces/lodge.interface';
import { ApiError } from '@common/utils/ApiError';
import RoomModel from '@modules/room/room.model';
import BillModel from '@modules/room/bill.model';
import ActivityModel from '@modules/activity/activity.model';

const getVietnamDateInfo = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
  return { year, month: month - 1 };
};

const getVietnamMonthYear = (dateInput: any): { year: number, month: number } => {
  if (dateInput instanceof Date) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit'
    });
    const parts = formatter.formatToParts(dateInput);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
    return { year, month: month - 1 };
  }
  
  const str = String(dateInput);
  if (str.includes('T') || str.includes('Z')) {
    return getVietnamMonthYear(new Date(str));
  }
  
  const parts = str.split('-');
  if (parts.length >= 2) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    return { year, month: month - 1 };
  }
  
  return getVietnamMonthYear(new Date(str));
};

export class LodgeService {
  public async getLodgeByOwner(ownerId: string): Promise<ILodge> {
    const lodge = await LodgeModel.findOne({ owner: ownerId }).populate('utilityPrice');
    if (!lodge) {
      throw new ApiError(404, 'Không tìm thấy nhà trọ của bạn');
    }
    return lodge;
  }

  public async updateLodge(ownerId: string, payload: any): Promise<ILodge> {
    const lodge = await LodgeModel.findOne({ owner: ownerId });
    if (!lodge) {
      throw new ApiError(404, 'Không tìm thấy nhà trọ để cập nhật');
    }

    lodge.name = payload.name;
    lodge.address = payload.address || '';
    lodge.phone = payload.phone;
    lodge.bank = payload.bank || '';
    lodge.bankName = payload.bankName || '';

    await lodge.save();
    return lodge;
  }

  public async getDashboard(ownerId: string): Promise<any> {
    const lodge = await LodgeModel.findOne({ owner: ownerId }).populate('utilityPrice');
    if (!lodge) {
      return {
        lodge: { name: 'Nhà trọ' },
        stats: { occ: 0, unc: 0, emp: 0 },
        revenue: 0,
        pendingBills: 0,
        roomsNeedMeter: 0,
        roomsNeedBill: 0,
        activities: []
      };
    }
    const lodgeId = lodge._id;

    const { year: thisYear, month: thisMonth } = getVietnamDateInfo();
    const currentMonthStr = `${thisYear}-${String(thisMonth + 1).padStart(2, '0')}`;

    // 1. Fetch rooms with only required fields and current month's meter readings
    const rooms = await RoomModel.find({ lodge: lodgeId })
      .select('status price checkin name ep wp')
      .populate({
        path: 'meterReadings',
        match: { date: { $regex: `^${currentMonthStr}` } },
        select: 'date elec water'
      });

    const roomIds = rooms.map(r => r._id);

    // Calculate dates matching the start and end of this month in Vietnam timezone shifted to UTC
    const startOfMonth = new Date(Date.UTC(thisYear, thisMonth, 1, 0, 0, 0, 0));
    startOfMonth.setHours(startOfMonth.getHours() - 7);

    const endOfMonth = new Date(Date.UTC(thisYear, thisMonth + 1, 0, 23, 59, 59, 999));
    endOfMonth.setHours(endOfMonth.getHours() - 7);

    // 2. Fetch relevant bills: uncollected bills, current month bills, or bills paid in current month
    const bills = await BillModel.find({
      room: { $in: roomIds },
      $or: [
        { collected: false },
        { date: { $regex: `^${currentMonthStr}` } },
        { updatedAt: { $gte: startOfMonth, $lte: endOfMonth } }
      ]
    });

    // 3. Fetch latest 10 activities
    const activities = await ActivityModel.find({ user: ownerId })
      .sort({ time: -1 })
      .limit(10);

    const occ = rooms.filter(r => ['occupied', 'debt'].includes((r.status || '').toLowerCase())).length;
    const emp = rooms.filter(r => (r.status || '').toLowerCase() === 'empty').length;

    // Monthly revenue (collected in current month)
    const collectedThisMonth = bills
      .filter(b => {
        if (!b.collected) return false;
        const dateVal = (b as any).updatedAt ? (b as any).updatedAt : b.date;
        const { year, month } = getVietnamMonthYear(dateVal);
        return month === thisMonth && year === thisYear;
      })
      .reduce((sum, b) => sum + (Number(b.total) || 0), 0);

    // Unpaid bills count (pending) for occupied/debt rooms
    const pendingBillsCount = bills.filter(b => {
      if (b.collected) return false;
      const r = rooms.find(room => room._id.toString() === b.room.toString());
      if (!r) return false;
      const isOcc = r.status.toLowerCase() === 'occupied' || r.status.toLowerCase() === 'debt';
      if (!isOcc) return false;
      const checkinDateStr = r.checkin || '';
      return !checkinDateStr || b.date >= checkinDateStr;
    }).length;

    // Debt rooms count
    const debt = rooms.filter(r => {
      const checkinDateStr = r.checkin || '';
      const roomBills = bills.filter(b => b.room.toString() === r._id.toString() && (!checkinDateStr || b.date >= checkinDateStr));
      const unpaidCount = roomBills.filter(b => !b.collected).length;
      return unpaidCount > 0 || r.status.toLowerCase() === 'debt';
    }).length;

    const roomsWithBill = new Set<string>();
    bills.forEach(b => {
      const r = rooms.find(room => room._id.toString() === b.room.toString());
      const checkinDateStr = r?.checkin || '';
      const { year, month } = getVietnamMonthYear(b.date);
      if (month === thisMonth && year === thisYear && (!checkinDateStr || b.date >= checkinDateStr)) {
        roomsWithBill.add(b.room.toString());
      }
    });

    const roomsWithReading = new Set<string>();
    rooms.forEach(r => {
      const checkinDateStr = r.checkin || '';
      if (r.meterReadings?.some(m => {
        const { year, month } = getVietnamMonthYear(m.date);
        return month === thisMonth && year === thisYear && (!checkinDateStr || m.date >= checkinDateStr);
      })) {
        roomsWithReading.add(r._id.toString());
      }
    });

    const occRooms = rooms.filter(r => ['occupied', 'debt'].includes((r.status || '').toLowerCase()));
    const roomsNeedMeter = occRooms.filter(r => !roomsWithReading.has(r._id.toString())).length;
    const roomsNeedBill = occRooms.filter(r => roomsWithReading.has(r._id.toString()) && !roomsWithBill.has(r._id.toString())).length;

    return {
      lodge,
      stats: { occ, unc: debt, emp },
      revenue: collectedThisMonth,
      pendingBills: pendingBillsCount,
      roomsNeedMeter,
      roomsNeedBill,
      activities
    };
  }
}
