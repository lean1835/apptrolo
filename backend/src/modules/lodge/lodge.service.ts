import LodgeModel from './lodge.model';
import { ILodge } from '@common/interfaces/lodge.interface';
import { ApiError } from '@common/utils/ApiError';
import RoomModel from '@modules/room/room.model';
import BillModel from '@modules/room/bill.model';
import ActivityModel from '@modules/activity/activity.model';

const parseDateHelper = (val: any): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  const str = String(val);
  if (!str.includes('T') && !str.includes('Z') && !str.includes('+')) {
    return new Date(str + 'T00:00:00Z');
  }
  return new Date(str);
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

    // 1. Fetch rooms with only required fields and current month's meter readings
    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const rooms = await RoomModel.find({ lodge: lodgeId })
      .select('status price checkin name ep wp')
      .populate({
        path: 'meterReadings',
        match: { date: { $regex: `^${currentMonthStr}` } },
        select: 'date elec water'
      });

    const roomIds = rooms.map(r => r._id);

    // 2. Fetch relevant bills: uncollected bills or bills from the current month
    const bills = await BillModel.find({
      room: { $in: roomIds },
      $or: [
        { collected: false },
        { date: { $regex: `^${currentMonthStr}` } }
      ]
    });

    // 3. Fetch latest 10 activities
    const activities = await ActivityModel.find({ user: ownerId })
      .sort({ time: -1 })
      .limit(10);

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const occ = rooms.filter(r => r.status.toLowerCase() === 'occupied').length;
    const emp = rooms.filter(r => r.status.toLowerCase() === 'empty').length;

    // Monthly revenue (collected in current month)
    const collectedThisMonth = bills
      .filter(b => {
        if (!b.collected) return false;
        const dateVal = (b as any).updatedAt ? (b as any).updatedAt : b.date;
        const parsed = parseDateHelper(dateVal);
        return parsed.getMonth() === thisMonth && parsed.getFullYear() === thisYear;
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
      const parsed = parseDateHelper(b.date);
      if (parsed.getMonth() === thisMonth && parsed.getFullYear() === thisYear && (!checkinDateStr || b.date >= checkinDateStr)) {
        roomsWithBill.add(b.room.toString());
      }
    });

    const roomsWithReading = new Set<string>();
    rooms.forEach(r => {
      const checkinDateStr = r.checkin || '';
      if (r.meterReadings?.some(m => {
        const parsed = parseDateHelper(m.date);
        return parsed.getMonth() === thisMonth && parsed.getFullYear() === thisYear && (!checkinDateStr || m.date >= checkinDateStr);
      })) {
        roomsWithReading.add(r._id.toString());
      }
    });

    const occRooms = rooms.filter(r => r.status.toLowerCase() === 'occupied');
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
