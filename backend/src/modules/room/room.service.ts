import RoomModel from './room.model';
import MemberModel from './member.model';
import MeterReadingModel from './meterReading.model';
import BillModel from './bill.model';
import TenantModel from './tenant.model';
import UtilityPriceModel from '../utilityPrice/utilityPrice.model';
import { ActivityService } from '@modules/activity/activity.service';
import { ApiError } from '@common/utils/ApiError';
import { IRoom } from '@common/interfaces/room.interface';
import { IMember } from '@common/interfaces/member.interface';
import { IMeterReading } from '@common/interfaces/meterReading.interface';
import { IBill } from '@common/interfaces/bill.interface';
import mongoose from 'mongoose';
import ActivityModel from '@modules/activity/activity.model';
import { IActivity } from '@common/interfaces/activity.interface';

const activityService = new ActivityService();

export interface IRoomHistoryItem {
  key: string;
  type: 'payment' | 'member' | 'meter' | 'checkout' | 'tenant_new' | 'tenant_old';
  sortTime: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  amount?: number;
}

export class RoomService {
  public async getRoomsByLodge(lodgeId: string): Promise<any[]> {
    const rooms = await RoomModel.find({ lodge: lodgeId })
      .populate({
        path: 'meterReadings',
        options: { sort: { date: -1 }, limit: 6 }
      })
      .populate('tenant')
      .lean();

    return rooms.map(room => {
      const ret = {
        ...room,
        id: room._id.toString(),
      } as any;
      
      if (ret.tenant && typeof ret.tenant === 'object') {
        ret.phone = (ret.tenant as any).phone || '';
        ret.tenantId = (ret.tenant as any)._id;
        ret.tenant = (ret.tenant as any).name || '';
      } else if (ret.tenant) {
        ret.tenantId = ret.tenant;
        ret.tenant = '';
        ret.phone = '';
      } else {
        ret.tenant = '';
        ret.phone = '';
        ret.tenantId = null;
      }
      return ret;
    });
  }

  public async getRoomById(roomId: string): Promise<IRoom> {
    const room = await RoomModel.findById(roomId)
      .populate('members')
      .populate('meterReadings')
      .populate('bills')
      .populate('tenant');
    if (!room) {
      throw new ApiError(404, 'Không tìm thấy phòng trọ');
    }
    return room;
  }

  public async saveRoom(lodgeId: string, payload: any): Promise<IRoom> {
    const isNew = !payload._id && !payload.id;
    
    let room;
    if (isNew) {
      room = new RoomModel({
        name: payload.name,
        price: payload.price,
        status: payload.status,
        descText: payload.descText || '',
        people: payload.people || 0,
        checkin: payload.checkin || '',
        contract: payload.contract || 'monthly',
        contractPrepaid: payload.contractPrepaid || 0,
        ep: payload.ep || 0,
        wp: payload.wp || 0,
        lodge: lodgeId,
        ...(payload.createdAt && { createdAt: new Date(payload.createdAt) }),
      });
      
      if (payload.createdAt) {
        await room.save({ timestamps: { createdAt: false, updatedAt: true } });
      } else {
        await room.save();
      }
      
      await activityService.logActivityByLodge(lodgeId, `Tạo phòng mới: ${room.name}`, 'room');
    } else {
      const roomId = payload._id || payload.id;
      room = await RoomModel.findById(roomId);
      if (!room) {
        throw new ApiError(404, 'Không tìm thấy phòng trọ để cập nhật');
      }

      const oldTenantDoc = await TenantModel.findOne({ room: room._id });
      const oldTenantName = oldTenantDoc ? (oldTenantDoc.name || '').trim() : '';
      const newTenantName = payload.tenant !== undefined ? (payload.tenant || '').trim() : oldTenantName;
      const isCheckout =
        (payload.status === 'empty' || payload.status === 'Empty') &&
        !!oldTenantName &&
        !newTenantName;

      if (isCheckout) {
        await activityService.logActivityByLodge(
          lodgeId,
          `${room.name} · Trả phòng: ${oldTenantName}`,
          'checkout'
        );
      } else if (payload.tenant !== undefined && newTenantName && newTenantName !== oldTenantName) {
        if (oldTenantName) {
          await activityService.logActivityByLodge(
            lodgeId,
            `${room.name} · Khách cũ: ${oldTenantName}`,
            'member'
          );
        }
        await activityService.logActivityByLodge(
          lodgeId,
          `${room.name} · Khách mới: ${newTenantName}`,
          'member'
        );
      }

      // Update fields conditionally if present in payload
      if (payload.name !== undefined) room.name = payload.name;
      if (payload.price !== undefined) room.price = payload.price;
      if (payload.status !== undefined) room.status = payload.status;
      if (payload.descText !== undefined) room.descText = payload.descText;
      if (payload.people !== undefined) room.people = payload.people;
      if (payload.checkin !== undefined) room.checkin = payload.checkin;
      if (payload.contract !== undefined) room.contract = payload.contract;
      if (payload.contractPrepaid !== undefined) room.contractPrepaid = payload.contractPrepaid;
      if (payload.ep !== undefined) room.ep = payload.ep;
      if (payload.wp !== undefined) room.wp = payload.wp;

      await room.save();
    }

    // Synchronize separate Tenants collection conditionally
    if (payload.tenant !== undefined) {
      if (payload.tenant) {
        let tenantObj = await TenantModel.findOne({ room: room._id });
        if (!tenantObj) {
          tenantObj = new TenantModel({ room: room._id });
        }
        tenantObj.name = payload.tenant;
        tenantObj.phone = payload.phone !== undefined ? payload.phone : (tenantObj.phone || '');
        await tenantObj.save();

        room.tenant = tenantObj._id;
        await room.save();
      } else {
        await TenantModel.deleteOne({ room: room._id });
        room.tenant = undefined;
        await room.save();
      }
    }

    return await this.getRoomById(room._id.toString());
  }

  public async deleteRoom(roomId: string): Promise<void> {
    const room = await RoomModel.findById(roomId);
    if (!room) {
      throw new ApiError(404, 'Không tìm thấy phòng trọ');
    }

    const lodgeId = room.lodge.toString();
    const roomName = room.name;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Delete all related records
        await MemberModel.deleteMany({ room: roomId }).session(session);
        await MeterReadingModel.deleteMany({ room: roomId }).session(session);
        await BillModel.deleteMany({ room: roomId }).session(session);
        await TenantModel.deleteMany({ room: roomId }).session(session);
        await RoomModel.findByIdAndDelete(roomId).session(session);
        
        await activityService.logActivityByLodge(lodgeId, `Xóa phòng: ${roomName}`, 'room');
      });
    } finally {
      session.endSession();
    }
  }

  public async addMember(roomId: string, payload: any): Promise<IMember> {
    const room = await RoomModel.findById(roomId);
    if (!room) {
      throw new ApiError(404, 'Không tìm thấy phòng trọ');
    }

    const member = new MemberModel({
      name: payload.name,
      phone: payload.phone || '',
      note: payload.note || '',
      room: roomId,
    });

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await member.save({ session });
        
        // Auto-increment people count
        const currentPeople = room.people || 1;
        room.people = currentPeople + 1;
        await room.save({ session });

        await activityService.logActivityByLodge(
          room.lodge.toString(),
          `${room.name} · Thêm thành viên: ${member.name}`,
          'member'
        );
      });
    } finally {
      session.endSession();
    }

    return member;
  }

  public async removeMember(memberId: string): Promise<void> {
    const member = await MemberModel.findById(memberId);
    if (!member) {
      throw new ApiError(404, 'Không tìm thấy thành viên');
    }

    const room = await RoomModel.findById(member.room);
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await MemberModel.findByIdAndDelete(memberId).session(session);

        if (room) {
          // Auto-decrement people count, minimum is 1 (the tenant)
          const currentPeople = room.people || 1;
          room.people = Math.max(1, currentPeople - 1);
          await room.save({ session });
        }
      });
    } finally {
      session.endSession();
    }
  }

  public async addMeterReading(roomId: string, payload: any): Promise<IMeterReading> {
    const room = await RoomModel.findById(roomId);
    if (!room) {
      throw new ApiError(404, 'Không tìm thấy phòng trọ');
    }

    const [yearStr, monthStr] = payload.date.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const session = await mongoose.startSession();
    let reading: any;
    try {
      await session.withTransaction(async () => {
        // 1. Find existing readings for this room
        const readings = await MeterReadingModel.find({ room: roomId }).session(session);
        const existingReading = readings.find(r => {
          const [y, m] = r.date.split('-');
          return parseInt(y, 10) === year && parseInt(m, 10) === month;
        });

        if (existingReading) {
          existingReading.elec = payload.elec;
          existingReading.water = payload.water;
          existingReading.date = payload.date;
          reading = await existingReading.save({ session });
        } else {
          reading = new MeterReadingModel({
            elec: payload.elec,
            water: payload.water,
            date: payload.date,
            room: roomId,
          });
          await reading.save({ session });
        }

        // 2. Lấy đơn giá điện nước của nhà trọ (Lodge)
        const defaultPrices = {
          elec: 3500.0,
          water: 15000.0,
          wifi: 100000.0,
          garbage: 20000.0,
          waterMode: 'meter',
          waterFixed: 150000.0,
        };
        const prices = (await UtilityPriceModel.findOne({ lodge: room.lodge }).session(session)) || defaultPrices;

        // 3. Tính toán điện nước kỳ trước
        const updatedReadings = await MeterReadingModel.find({ room: roomId }).session(session);
        const priorReadings = updatedReadings
          .filter(r => {
            const [y, m] = r.date.split('-');
            const ry = parseInt(y, 10);
            const rm = parseInt(m, 10);
            return ry < year || (ry === year && rm < month);
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const pElec = priorReadings.length > 0 ? priorReadings[0].elec : (room.ep || 0);
        const pWater = priorReadings.length > 0 ? priorReadings[0].water : (room.wp || 0);

        const eUse = Math.max(0, payload.elec - pElec);
        const wUse = Math.max(0, payload.water - pWater);

        let billingMonths = 1;
        if (room.checkin) {
          const checkinParts = room.checkin.split('-');
          if (checkinParts.length === 3) {
            const checkinYear = parseInt(checkinParts[0], 10);
            const checkinMonth = parseInt(checkinParts[1], 10);
            
            const totalMonths = Math.max(1, (year - checkinYear) * 12 + (month - checkinMonth));
            
            // Find how many bills already exist between checkinMonth and current month (exclusive)
            const existingBills = await BillModel.find({ room: roomId }).session(session);
            const billedMonthsCount = existingBills.filter(b => {
              const bParts = b.date.split('-');
              if (bParts.length !== 3) return false;
              const by = parseInt(bParts[0], 10);
              const bm = parseInt(bParts[1], 10);
              
              // Bill date is after checkin month and before current month
              const isAfterCheckin = by > checkinYear || (by === checkinYear && bm > checkinMonth);
              const isBeforeCurrent = by < year || (by === year && bm < month);
              return isAfterCheckin && isBeforeCurrent;
            }).length;
            
            billingMonths = Math.max(1, totalMonths - billedMonthsCount);
          }
        }

        const eAmt = eUse * (prices.elec || 0);
        const wAmt = prices.waterMode === 'fixed' 
          ? (prices.waterFixed || 0) * billingMonths 
          : (wUse * (prices.water || 0));
        const rent = parseFloat((room.price || 0).toString()) * billingMonths;
        const fees = ((prices.wifi || 0) + (prices.garbage || 0)) * billingMonths;
        const prepaid = room.contractPrepaid > 0 ? rent : 0;
        
        const debtAmt = (room as any).debtAmount || 0;
        const total = rent + eAmt + wAmt + fees - prepaid + debtAmt;

        // 4. Tìm và tự động tạo/cập nhật hóa đơn
        const bills = await BillModel.find({ room: roomId }).session(session);
        const existingBill = bills.find(b => {
          const [y, m] = b.date.split('-');
          return parseInt(y, 10) === year && parseInt(m, 10) === month;
        });

        if (existingBill) {
          existingBill.total = total;
          await existingBill.save({ session });
        } else {
          const newBill = new BillModel({
            total: total,
            sent: false,
            collected: false,
            date: payload.date,
            room: roomId,
          });
          await newBill.save({ session });
        }

        if (debtAmt > 0) {
          (room as any).debtAmount = 0;
          await room.save({ session });
        }

        await activityService.logActivityByLodge(
          room.lodge.toString(),
          `${room.name} · Đã ghi điện nước`,
          'meter'
        );
      });
    } finally {
      session.endSession();
    }

    return reading;
  }

  public async createBill(roomId: string, payload: any): Promise<IBill> {
    const room = await RoomModel.findById(roomId);
    if (!room) {
      throw new ApiError(404, 'Không tìm thấy phòng trọ');
    }

    const bill = new BillModel({
      total: payload.total,
      sent: payload.sent || false,
      collected: payload.collected || false,
      date: payload.date,
      room: roomId,
    });

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await bill.save({ session });

        // Activity logging log text format:
        let actionVerb = 'Gửi hóa đơn ';
        if (bill.collected) {
          actionVerb = 'Đã thu tiền ';
        } else if (!bill.sent) {
          actionVerb = 'Lưu nháp hóa đơn ';
        }

        const totalFormatted = Math.round(bill.total).toLocaleString('vi-VN') + ' đ';
        const act = `${actionVerb}${totalFormatted}`;

        await activityService.logActivityByLodge(
          room.lodge.toString(),
          `${room.name} · ${act}`,
          'bill'
        );
      });
    } finally {
      session.endSession();
    }

    return bill;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private formatHistoryDate(isoOrStr: string): string {
    try {
      const d = new Date(isoOrStr);
      if (isNaN(d.getTime())) return isoOrStr;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      if (isoOrStr.includes('T') && (d.getHours() > 0 || d.getMinutes() > 0)) {
        return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
      }
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return isoOrStr;
    }
  }

  private formatBillPeriod(dateStr: string): string {
    const [y, m] = (dateStr || '').split('-');
    return y && m ? `Tháng ${m}/${y}` : dateStr || '--';
  }

  private activitySortTime(act: IActivity): string {
    return act.time || (act as any).createdAt?.toISOString?.() || new Date().toISOString();
  }

  private parseRoomActivity(act: IActivity, meterMonths: Set<string>): IRoomHistoryItem | null {
    const sep = act.txt.indexOf(' · ');
    const action = sep >= 0 ? act.txt.slice(sep + 3) : act.txt;
    const sortTime = this.activitySortTime(act);
    const dateLabel = this.formatHistoryDate(sortTime);
    const key = `act-${act._id}`;

    if (action.startsWith('Trả phòng')) {
      const name = action.replace(/^Trả phòng:?\s*/, '').trim();
      return {
        key,
        type: 'checkout',
        sortTime,
        title: 'Trả phòng',
        subtitle: name || 'Khách đã rời phòng',
        dateLabel,
      };
    }

    if (action.startsWith('Khách cũ:')) {
      const name = action.slice('Khách cũ:'.length).trim();
      return {
        key,
        type: 'tenant_old',
        sortTime,
        title: 'Khách cũ',
        subtitle: name,
        dateLabel,
      };
    }

    if (action.startsWith('Khách mới:')) {
      const name = action.slice('Khách mới:'.length).trim();
      return {
        key,
        type: 'tenant_new',
        sortTime,
        title: 'Khách mới',
        subtitle: name,
        dateLabel,
      };
    }

    if (action.startsWith('Thêm thành viên:')) {
      const name = action.slice('Thêm thành viên:'.length).trim();
      return {
        key,
        type: 'member',
        sortTime,
        title: 'Thêm người ở cùng',
        subtitle: name,
        dateLabel,
      };
    }

    if (action === 'Đã ghi điện nước') {
      const monthKey = sortTime.slice(0, 7);
      if (meterMonths.has(monthKey)) return null;
      return {
        key,
        type: 'meter',
        sortTime,
        title: 'Ghi điện nước',
        subtitle: 'Đã cập nhật chỉ số',
        dateLabel,
      };
    }

    return null;
  }

  public async getRoomHistory(roomId: string, userId: string): Promise<IRoomHistoryItem[]> {
    const room = await this.getRoomById(roomId);
    const items: IRoomHistoryItem[] = [];
    const seenKeys = new Set<string>();

    const addItem = (item: IRoomHistoryItem) => {
      if (seenKeys.has(item.key)) return;
      seenKeys.add(item.key);
      items.push(item);
    };

    const meterMonths = new Set<string>();
    const readings = (room.meterReadings || []) as IMeterReading[];
    readings.forEach((r) => {
      const monthKey = (r.date || '').slice(0, 7);
      if (monthKey) meterMonths.add(monthKey);
      addItem({
        key: `meter-${r._id}`,
        type: 'meter',
        sortTime: r.date ? `${r.date}T12:00:00` : new Date().toISOString(),
        title: 'Ghi điện nước',
        subtitle: `⚡ ${r.elec} kWh · 💧 ${r.water} m³`,
        dateLabel: this.formatBillPeriod(r.date),
      });
    });

    const bills = (room.bills || []) as IBill[];
    bills
      .filter((b) => b.collected)
      .forEach((b) => {
        addItem({
          key: `paid-${b._id}`,
          type: 'payment',
          sortTime: b.date ? `${b.date}T12:00:00` : new Date().toISOString(),
          title: 'Đã thanh toán',
          subtitle: b.sent ? 'Đã gửi hóa đơn' : this.formatBillPeriod(b.date),
          dateLabel: this.formatBillPeriod(b.date),
          amount: Number(b.total) || 0,
        });
      });

    const members = (room.members || []) as IMember[];
    members.forEach((m) => {
      const sortTime = m.createdAt ? `${m.createdAt}T12:00:00` : new Date().toISOString();
      addItem({
        key: `member-${m._id}`,
        type: 'member',
        sortTime,
        title: 'Thêm người ở cùng',
        subtitle: [m.name, m.phone].filter(Boolean).join(' · '),
        dateLabel: m.createdAt ? this.formatHistoryDate(sortTime) : '--',
      });
    });

    const activities = await ActivityModel.find({
      user: userId,
      txt: { $regex: `^${this.escapeRegex(room.name)} · ` },
    })
      .sort({ time: -1 })
      .limit(200);

    activities.forEach((act) => {
      const parsed = this.parseRoomActivity(act, meterMonths);
      if (parsed) addItem(parsed);
    });

    items.sort((a, b) => new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime());
    return items;
  }
}
