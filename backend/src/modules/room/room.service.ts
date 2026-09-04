import RoomModel from './room.model';
import MemberModel from './member.model';
import MeterReadingModel from './meterReading.model';
import BillModel from './bill.model';
import TenantModel from './tenant.model';
import LodgeModel from '../lodge/lodge.model';
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
import { getMonthLabel, getUnpaidAmount, getPaymentLockState } from '@common/utils/derivedFields';

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
    const rooms = await RoomModel.find({ lodge: lodgeId }).lean();
    if (!rooms || rooms.length === 0) return [];

    const roomIds = rooms.map((r: any) => r._id);
    const tenantIds = rooms.map((r: any) => r.tenant).filter(Boolean);

    // Chạy 2 truy vấn theo lô song song thay vì N+1 queries tuần tự
    const [allReadings, tenants] = await Promise.all([
      MeterReadingModel.find({ room: { $in: roomIds } })
        .sort({ date: -1 })
        .lean(),
      tenantIds.length > 0 ? TenantModel.find({ _id: { $in: tenantIds } }).lean() : Promise.resolve([]),
    ]);

    // Gom tối đa 6 chỉ số gần nhất theo từng phòng
    const readingsByRoom = new Map<string, any[]>();
    for (const reading of allReadings) {
      const rId = reading.room.toString();
      const list = readingsByRoom.get(rId) || [];
      if (list.length < 6) {
        list.push(reading);
        readingsByRoom.set(rId, list);
      }
    }

    const tenantMap = new Map<string, any>();
    for (const t of tenants) {
      tenantMap.set(t._id.toString(), t);
    }

    return rooms.map((room: any) => {
      const rId = room._id.toString();
      const roomReadings = readingsByRoom.get(rId) || [];
      const tenantDoc = room.tenant ? tenantMap.get(room.tenant.toString()) : null;

      const ret = {
        ...room,
        id: rId,
        ep: room.initialElec !== undefined ? room.initialElec : 0,
        wp: room.initialWater !== undefined ? room.initialWater : 0,
        meterReadings: roomReadings,
      } as any;
      
      if (tenantDoc) {
        ret.phone = tenantDoc.phone || '';
        ret.tenantId = tenantDoc._id;
        ret.checkin = tenantDoc.checkin || '';
        ret.contract = tenantDoc.contract || 'monthly';
        ret.contractMonths = tenantDoc.contractMonths || 1;
        ret.contractPrepaid = tenantDoc.prepaidUntil || 0;
        ret.prepaidUntil = tenantDoc.prepaidUntil || 0;
        ret.handoverElec = tenantDoc.handoverElec || 0;
        ret.handoverWater = tenantDoc.handoverWater || 0;
        ret.tenant = tenantDoc.name || '';
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

  public async getRoomById(roomId: string, lodgeId?: string): Promise<IRoom> {
    const room = await RoomModel.findById(roomId)
      .populate('members')
      .populate('meterReadings')
      .populate('bills')
      .populate('tenant');
    if (!room) {
      throw new ApiError(404, 'Không tìm thấy phòng trọ');
    }
    if (lodgeId && room.lodge.toString() !== lodgeId.toString()) {
      throw new ApiError(403, 'Bạn không có quyền truy cập phòng trọ này');
    }
    return room;
  }

  public async saveRoom(lodgeId: string, payload: any): Promise<IRoom> {
    const isNew = !payload._id && !payload.id;
    const initialElec = payload.initialElec !== undefined ? payload.initialElec : (payload.ep || 0);
    const initialWater = payload.initialWater !== undefined ? payload.initialWater : (payload.wp || 0);
    
    let room;
    if (isNew) {
      room = new RoomModel({
        name: payload.name,
        price: payload.price,
        status: payload.status || 'empty',
        descText: payload.descText || '',
        initialElec,
        initialWater,
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
            'tenant_old'
          );
        }
        await activityService.logActivityByLodge(
          lodgeId,
          `${room.name} · Khách mới: ${newTenantName}`,
          'tenant_new'
        );
      }

      // Update fields conditionally if present in payload
      if (payload.name !== undefined) room.name = payload.name;
      if (payload.price !== undefined) room.price = payload.price;
      if (payload.status !== undefined) room.status = payload.status;
      if (payload.descText !== undefined) room.descText = payload.descText;
      if (payload.initialElec !== undefined) room.initialElec = payload.initialElec;
      else if (payload.ep !== undefined) room.initialElec = payload.ep;
      if (payload.initialWater !== undefined) room.initialWater = payload.initialWater;
      else if (payload.wp !== undefined) room.initialWater = payload.wp;

      await room.save();
    }

    // Synchronize separate Tenants collection
    if (payload.tenant !== undefined) {
      if (payload.tenant) {
        let tenantObj = await TenantModel.findOne({ room: room._id });
        if (!tenantObj) {
          tenantObj = new TenantModel({ room: room._id });
        }
        tenantObj.name = payload.tenant;
        if (payload.phone !== undefined) tenantObj.phone = payload.phone;
        if (payload.checkin !== undefined) tenantObj.checkin = payload.checkin;
        if (payload.contract !== undefined) tenantObj.contract = payload.contract;
        if (payload.contractMonths !== undefined) tenantObj.contractMonths = payload.contractMonths;
        if (payload.prepaidUntil !== undefined) tenantObj.prepaidUntil = payload.prepaidUntil;
        else if (payload.contractPrepaid !== undefined) tenantObj.prepaidUntil = payload.contractPrepaid;
        if (payload.handoverElec !== undefined) tenantObj.handoverElec = payload.handoverElec;
        if (payload.handoverWater !== undefined) tenantObj.handoverWater = payload.handoverWater;
        
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

  public async deleteRoom(roomId: string, lodgeId?: string): Promise<void> {
    const room = await RoomModel.findById(roomId);
    if (!room) {
      throw new ApiError(404, 'Không tìm thấy phòng trọ');
    }

    if (lodgeId && room.lodge.toString() !== lodgeId.toString()) {
      throw new ApiError(403, 'Bạn không có quyền thao tác trên phòng trọ này');
    }

    // Business Rule F2.A: Chỉ xóa phòng khi phòng chưa từng có khách / hóa đơn
    const billsCount = await BillModel.countDocuments({ room: roomId });
    const readingsCount = await MeterReadingModel.countDocuments({ room: roomId });
    const tenantsCount = await TenantModel.countDocuments({ room: roomId });

    if (room.status === 'occupied' || billsCount > 0 || readingsCount > 0 || tenantsCount > 0) {
      throw new ApiError(400, 'Không thể xóa phòng đã từng có khách hoặc có lịch sử hóa đơn/điện nước.');
    }

    const lodgeIdStr = room.lodge.toString();
    const roomName = room.name;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await MemberModel.deleteMany({ room: roomId }).session(session);
        await MeterReadingModel.deleteMany({ room: roomId }).session(session);
        await BillModel.deleteMany({ room: roomId }).session(session);
        await TenantModel.deleteMany({ room: roomId }).session(session);
        await RoomModel.findByIdAndDelete(roomId).session(session);
        
        await activityService.logActivityByLodge(lodgeIdStr, `Xóa phòng: ${roomName}`, 'room');
      });
    } finally {
      session.endSession();
    }
  }

  public async addMember(roomId: string, payload: any, lodgeId?: string): Promise<IMember> {
    const room = await RoomModel.findById(roomId);
    if (!room) {
      throw new ApiError(404, 'Không tìm thấy phòng trọ');
    }

    if (lodgeId && room.lodge.toString() !== lodgeId.toString()) {
      throw new ApiError(403, 'Bạn không có quyền thao tác trên phòng trọ này');
    }

    const tenant = await TenantModel.findOne({ room: roomId, status: 'active' });

    const member = new MemberModel({
      name: payload.name,
      phone: payload.phone || '',
      relation: payload.relation || 'Bạn',
      note: payload.note || '',
      room: roomId,
      tenant: tenant ? tenant._id : undefined,
    });

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await member.save({ session });

        await activityService.logActivityByLodge(
          room.lodge.toString(),
          `${room.name} · Thêm thành viên: ${member.name} (${member.relation || 'Người ở cùng'})`,
          'member'
        );
      });
    } finally {
      session.endSession();
    }

    return member;
  }

  public async removeMember(memberId: string, lodgeId?: string): Promise<void> {
    const member = await MemberModel.findById(memberId);
    if (!member) {
      throw new ApiError(404, 'Không tìm thấy thành viên');
    }

    const room = await RoomModel.findById(member.room);
    if (lodgeId && room && room.lodge.toString() !== lodgeId.toString()) {
      throw new ApiError(403, 'Bạn không có quyền thao tác trên thành viên này');
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await MemberModel.findByIdAndDelete(memberId).session(session);

        if (room) {
          await activityService.logActivityByLodge(
            room.lodge.toString(),
            `${room.name} · Xóa thành viên: ${member.name}`,
            'member'
          );
        }
      });
    } finally {
      session.endSession();
    }
  }

  public async addMeterReading(roomId: string, payload: any, lodgeId?: string): Promise<IMeterReading> {
    const room = await RoomModel.findById(roomId);
    if (!room) {
      throw new ApiError(404, 'Không tìm thấy phòng trọ');
    }

    if (lodgeId && room.lodge.toString() !== lodgeId.toString()) {
      throw new ApiError(403, 'Bạn không có quyền thao tác trên phòng trọ này');
    }

    const lodge = await LodgeModel.findById(room.lodge);
    const earlyRecordDays = lodge?.earlyRecordDays !== undefined ? lodge.earlyRecordDays : 3;
    const billingDateNum = lodge?.billingDate || 25;

    const parseDateStr = (dateStr: string): Date => {
      if (!dateStr) return new Date();
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return new Date(y, m, d);
      }
      return new Date(dateStr);
    };

    const tenant = await TenantModel.findOne({ room: roomId, status: 'active' });
    const checkinDateStr = tenant?.checkin || (room as any).checkin || '';
    const roomBills = await BillModel.find({ room: roomId });
    const roomReadings = await MeterReadingModel.find({ room: roomId });

    const filteredBills = roomBills.filter((b: any) => !checkinDateStr || b.date >= checkinDateStr);
    const filteredReadings = roomReadings.filter((r: any) => !checkinDateStr || r.date >= checkinDateStr);

    const hasUnpaidBills = filteredBills.some((b: any) => !b.collected && (b.amountPaid || 0) < b.total);
    const inDebt = room.status?.toLowerCase() === 'debt' || hasUnpaidBills;

    if (!inDebt) {
      const recordDate = payload.date ? parseDateStr(payload.date) : new Date();
      const recordDateOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());

      if (checkinDateStr) {
        const checkinDate = parseDateStr(checkinDateStr);
        if (!isNaN(checkinDate.getTime())) {
          let latestDate = new Date(checkinDate);
          if (filteredReadings && filteredReadings.length > 0) {
            filteredReadings.forEach((r: any) => {
              const d = parseDateStr(r.date);
              if (!isNaN(d.getTime()) && d > latestDate) {
                latestDate = d;
              }
            });
          }

          let expectedDate: Date;
          if (filteredReadings.length === 0) {
            // Hóa đơn đầu tiên: Kỳ chứa checkinDate
            if (checkinDate.getDate() < billingDateNum) {
              expectedDate = new Date(checkinDate.getFullYear(), checkinDate.getMonth(), billingDateNum);
            } else {
              expectedDate = new Date(checkinDate.getFullYear(), checkinDate.getMonth() + 1, billingDateNum);
            }

            // Luật vụn: nếu lúc khách vào, kỳ hiện tại còn <= 3 ngày thì bỏ kỳ vụn, kỳ đầu là kỳ kế tiếp
            const daysRemainingInCycle = Math.round((expectedDate.getTime() - checkinDate.getTime()) / (1000 * 3600 * 24));
            if (daysRemainingInCycle <= 3) {
              expectedDate = new Date(expectedDate.getFullYear(), expectedDate.getMonth() + 1, billingDateNum);
            }
          } else {
            // Các kỳ tiếp theo: 1 tháng sau kỳ liền trước
            expectedDate = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, billingDateNum);
          }

          const allowedStart = new Date(expectedDate);
          allowedStart.setDate(allowedStart.getDate() - earlyRecordDays);

          const allowedStartOnly = new Date(allowedStart.getFullYear(), allowedStart.getMonth(), allowedStart.getDate());

          if (recordDateOnly < allowedStartOnly) {
            const expDateStr = `${expectedDate.getDate().toString().padStart(2, '0')}/${(expectedDate.getMonth() + 1).toString().padStart(2, '0')}/${expectedDate.getFullYear()}`;
            const allowedStartStr = `${allowedStart.getDate().toString().padStart(2, '0')}/${(allowedStart.getMonth() + 1).toString().padStart(2, '0')}/${allowedStart.getFullYear()}`;
            throw new ApiError(400, `Chưa đến hạn ghi điện nước! Phòng này chỉ được ghi từ ngày ${allowedStartStr} (trước ${earlyRecordDays} ngày so với ngày thu dự kiến ${expDateStr}).`);
          }
        }
      }
    }

    const [yearStr, monthStr] = payload.date.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const periodStr = `${yearStr}-${monthStr}`;

    const session = await mongoose.startSession();
    let reading: any;
    try {
      await session.withTransaction(async () => {
        // 1. Tìm hoặc tạo MeterReading
        const readings = await MeterReadingModel.find({ room: roomId }).session(session);
        const existingReading = readings.find(r => {
          const [y, m] = r.date.split('-');
          return parseInt(y, 10) === year && parseInt(m, 10) === month;
        });

        if (existingReading) {
          existingReading.elec = payload.elec;
          existingReading.water = payload.water;
          existingReading.date = payload.date;
          existingReading.period = periodStr;
          existingReading.isMeterReplaced = payload.isMeterReplaced || false;
          reading = await existingReading.save({ session });
        } else {
          reading = new MeterReadingModel({
            elec: payload.elec,
            water: payload.water,
            date: payload.date,
            period: periodStr,
            isMeterReplaced: payload.isMeterReplaced || false,
            room: roomId,
          });
          await reading.save({ session });
        }

        // 2. Lấy đơn giá điện nước
        const defaultPrices = {
          elec: 3500.0,
          water: 15000.0,
          wifi: 100000.0,
          garbage: 20000.0,
          waterMode: 'meter',
          waterFixed: 100000.0,
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

        const baseElec = tenant?.handoverElec || room.initialElec || (room as any).ep || 0;
        const baseWater = tenant?.handoverWater || room.initialWater || (room as any).wp || 0;

        const pElec = priorReadings.length > 0 ? priorReadings[0].elec : baseElec;
        const pWater = priorReadings.length > 0 ? priorReadings[0].water : baseWater;

        // F3.B.6: Nếu có cờ THAY ĐỒNG HỒ, sản lượng = số mới (chạy từ 0)
        const isReplaced = payload.isMeterReplaced === true;
        const eUse = isReplaced ? Math.max(0, payload.elec) : Math.max(0, payload.elec - pElec);
        const wUse = isReplaced ? Math.max(0, payload.water) : Math.max(0, payload.water - pWater);

        // Đếm số người ở để tính nước theo đầu người
        const membersCount = await MemberModel.countDocuments({ room: roomId }).session(session);
        const totalPeople = (tenant ? 1 : 0) + membersCount;

        const isWaterByPerson = prices.waterMode === 'person' || prices.waterMode === 'fixed';
        // F3.B.4: Thu nước theo người mà phòng có 0 người ở -> chặn
        if (isWaterByPerson && totalPeople <= 0) {
          throw new ApiError(400, 'Phòng hiện không có người ở, không thể tính tiền nước theo đầu người.');
        }

        let billingMonths = 1;
        const eAmt = eUse * (prices.elec || 0);
        let wAmt = isWaterByPerson
          ? (prices.waterFixed || 0) * (totalPeople || 1) * billingMonths
          : (wUse * (prices.water || 0));
        
        let rent = parseFloat((room.price || 0).toString()) * billingMonths;
        let wifiAmt = (prices.wifi || 0) * billingMonths;
        let garbageAmt = (prices.garbage || 0) * billingMonths;
        
        // F3.D.1: Hóa đơn đầu = kỳ chứa ngày khách vào; tiền phòng, rác, nước-theo-người cắt theo số ngày ở
        const billsForTenant = await BillModel.find({ room: roomId, tenant: tenant?._id }).session(session);
        const priorBillsForTenant = billsForTenant.filter(b => {
          const [y, m] = b.date.split('-');
          const by = parseInt(y, 10);
          const bm = parseInt(m, 10);
          return by < year || (by === year && bm < month);
        });
        const isFirstBill = priorBillsForTenant.length === 0;

        if (isFirstBill && checkinDateStr) {
          const dCheckin = parseDateStr(checkinDateStr);
          if (!isNaN(dCheckin.getTime())) {
            const billingD = billingDateNum || 25;
            const cycleEnd = new Date(year, month - 1, billingD);
            const cycleStart = new Date(year, month - 2, billingD);
            
            if (dCheckin > cycleStart && dCheckin < cycleEnd) {
              const totalCycleDays = Math.max(1, Math.round((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 3600 * 24)));
              const daysStayed = Math.max(1, Math.round((cycleEnd.getTime() - dCheckin.getTime()) / (1000 * 3600 * 24)));
              
              // Luật vụn: nếu lúc khách vào, kỳ hiện tại còn <= 3 ngày thì không cắt vụn mà chờ kỳ sau
              if (daysStayed > 3) {
                const ratio = Math.min(1, daysStayed / totalCycleDays);
                rent = Math.round(rent * ratio);
                wifiAmt = Math.round(wifiAmt * ratio);
                garbageAmt = Math.round(garbageAmt * ratio);
                if (isWaterByPerson) {
                  wAmt = Math.round(wAmt * ratio);
                }
              }
            }
          }
        }

        const prepaidCount = tenant?.prepaidUntil || (room as any).contractPrepaid || 0;
        const isPrepaid = priorBillsForTenant.length < prepaidCount;
        const prepaidDeduction = isPrepaid ? rent : 0;
        
        // F5.F & TC-F5-04: Nợ không tràn sang hóa đơn mới
        const total = rent + eAmt + wAmt + wifiAmt + garbageAmt - prepaidDeduction;

        // 4. Tính kỳ bắt đầu và kết thúc (periodStart -> periodEnd)
        let periodStart: string;
        if (isFirstBill && checkinDateStr) {
          periodStart = checkinDateStr;
        } else {
          const billingD = billingDateNum || 25;
          const prevMonthDate = new Date(year, month - 2, billingD);
          const pY = prevMonthDate.getFullYear();
          const pM = (prevMonthDate.getMonth() + 1).toString().padStart(2, '0');
          const pD = prevMonthDate.getDate().toString().padStart(2, '0');
          periodStart = `${pY}-${pM}-${pD}`;
        }
        const periodEnd = payload.date;

        // 5. Tìm và tự động tạo/cập nhật hóa đơn bất biến
        const bills = await BillModel.find({ room: roomId }).session(session);
        const existingBill = bills.find(b => {
          const [y, m] = b.date.split('-');
          return parseInt(y, 10) === year && parseInt(m, 10) === month;
        });

        if (existingBill) {
          existingBill.total = total;
          existingBill.rent = rent;
          existingBill.elecOld = pElec;
          existingBill.elecNew = payload.elec;
          existingBill.elecUsage = eUse;
          existingBill.elecPrice = prices.elec || 0;
          existingBill.elecAmount = eAmt;
          existingBill.waterOld = pWater;
          existingBill.waterNew = payload.water;
          existingBill.waterUsage = isWaterByPerson ? (totalPeople || 1) : wUse;
          existingBill.waterPrice = isWaterByPerson ? (prices.waterFixed || 0) : (prices.water || 0);
          existingBill.waterAmount = wAmt;
          existingBill.wifiAmount = wifiAmt;
          existingBill.garbageAmount = garbageAmt;
          existingBill.prepaidDeduction = prepaidDeduction;
          existingBill.periodStart = periodStart;
          existingBill.periodEnd = periodEnd;
          existingBill.tenant = tenant?._id;
          existingBill.tenantName = tenant?.name || '';
          await existingBill.save({ session });
        } else {
          const newBill = new BillModel({
            room: roomId,
            tenant: tenant?._id,
            tenantName: tenant?.name || '',
            periodStart,
            periodEnd,
            date: payload.date,
            rent,
            elecOld: pElec,
            elecNew: payload.elec,
            elecUsage: eUse,
            elecPrice: prices.elec || 0,
            elecAmount: eAmt,
            waterOld: pWater,
            waterNew: payload.water,
            waterUsage: isWaterByPerson ? (totalPeople || 1) : wUse,
            waterPrice: isWaterByPerson ? (prices.waterFixed || 0) : (prices.water || 0),
            waterAmount: wAmt,
            wifiAmount: wifiAmt,
            garbageAmount: garbageAmt,
            prepaidDeduction,
            total,
            amountPaid: 0,
            sent: false,
            collected: false,
            status: 'unpaid',
          });
          await newBill.save({ session });
        }

        await activityService.logActivityByLodge(
          room.lodge.toString(),
          `${room.name} · Đã ghi điện nước: ⚡ ${payload.elec} kWh · 💧 ${payload.water} m³`,
          'meter'
        );
      });
    } finally {
      session.endSession();
    }

    return reading;
  }

  public async createBill(roomId: string, payload: any, lodgeId?: string): Promise<IBill> {
    const room = await RoomModel.findById(roomId);
    if (!room) {
      throw new ApiError(404, 'Không tìm thấy phòng trọ');
    }

    if (lodgeId && room.lodge.toString() !== lodgeId.toString()) {
      throw new ApiError(403, 'Bạn không có quyền thao tác trên phòng trọ này');
    }

    const tenant = await TenantModel.findOne({ room: roomId, status: 'active' });

    const total = payload.total !== undefined ? payload.total : 0;
    const amountPaid = payload.amountPaid !== undefined ? payload.amountPaid : 0;
    const collected = payload.collected !== undefined ? payload.collected : (amountPaid >= total);
    const status = getPaymentLockState(total, amountPaid);

    const bill = new BillModel({
      room: roomId,
      tenant: tenant?._id,
      tenantName: tenant?.name || payload.tenantName || '',
      periodStart: payload.periodStart || '',
      periodEnd: payload.periodEnd || '',
      date: payload.date || new Date().toISOString().split('T')[0],
      rent: payload.rent || 0,
      elecOld: payload.elecOld || 0,
      elecNew: payload.elecNew || 0,
      elecUsage: payload.elecUsage || 0,
      elecPrice: payload.elecPrice || 0,
      elecAmount: payload.elecAmount || 0,
      waterOld: payload.waterOld || 0,
      waterNew: payload.waterNew || 0,
      waterUsage: payload.waterUsage || 0,
      waterPrice: payload.waterPrice || 0,
      waterAmount: payload.waterAmount || 0,
      wifiAmount: payload.wifiAmount || 0,
      garbageAmount: payload.garbageAmount || 0,
      otherFee: payload.otherFee || 0,
      deduction: payload.deduction || 0,
      prepaidDeduction: payload.prepaidDeduction || 0,
      hasOldDebt: payload.hasOldDebt || false,
      oldTenantName: payload.oldTenantName || '',
      oldDebtAmount: payload.oldDebtAmount || 0,
      total,
      amountPaid,
      sent: payload.sent || false,
      collected,
      status,
      note: payload.note || '',
    });

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await bill.save({ session });

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

  public async checkoutPreview(roomId: string, payload: { checkoutDate: string; finalElec: number; finalWater?: number }, lodgeId?: string): Promise<any> {
    const room = await RoomModel.findById(roomId);
    if (!room) throw new ApiError(404, 'Không tìm thấy phòng trọ');

    if (lodgeId && room.lodge.toString() !== lodgeId.toString()) {
      throw new ApiError(403, 'Bạn không có quyền thao tác trên phòng trọ này');
    }

    const tenant = await TenantModel.findOne({ room: roomId, status: 'active' });
    if (!tenant) throw new ApiError(400, 'Phòng này hiện không có khách thuê để trả phòng');

    const lodge = await LodgeModel.findById(room.lodge);
    const billingD = lodge?.billingDate || 25;

    const parseDateStr = (dateStr: string): Date => {
      if (!dateStr) return new Date();
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return new Date(y, m, d);
      }
      return new Date(dateStr);
    };

    const dCheckout = parseDateStr(payload.checkoutDate);
    const year = dCheckout.getFullYear();
    const month = dCheckout.getMonth() + 1;
    const checkoutDay = dCheckout.getDate();

    let cycleStart: Date;
    let cycleEnd: Date;

    if (checkoutDay > billingD) {
      cycleStart = new Date(year, month - 1, billingD);
      cycleEnd = new Date(year, month, billingD);
    } else {
      cycleStart = new Date(year, month - 2, billingD);
      cycleEnd = new Date(year, month - 1, billingD);
    }

    const totalDaysInCycle = Math.max(1, Math.round((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 3600 * 24)));
    const dCheckin = tenant.checkin ? parseDateStr(tenant.checkin) : cycleStart;
    const dEffectiveStart = (!isNaN(dCheckin.getTime()) && dCheckin > cycleStart) ? dCheckin : cycleStart;
    
    const daysStayed = Math.max(1, Math.round((dCheckout.getTime() - dEffectiveStart.getTime()) / (1000 * 3600 * 24)));
    const ratio = Math.min(1, daysStayed / totalDaysInCycle);

    const defaultPrices = {
      elec: 3500.0,
      water: 15000.0,
      wifi: 100000.0,
      garbage: 20000.0,
      waterMode: 'meter',
      waterFixed: 100000.0,
    };
    const prices = (await UtilityPriceModel.findOne({ lodge: room.lodge })) || defaultPrices;

    // Prior readings
    const readings = await MeterReadingModel.find({ room: roomId }).sort({ date: -1 });
    const priorReading = readings.length > 0 ? readings[0] : null;

    const pElec = priorReading ? priorReading.elec : (tenant.handoverElec || room.initialElec || (room as any).ep || 0);
    const pWater = priorReading ? priorReading.water : (tenant.handoverWater || room.initialWater || (room as any).wp || 0);

    const eUse = Math.max(0, payload.finalElec - pElec);
    const wUse = Math.max(0, (payload.finalWater || 0) - pWater);

    const membersCount = await MemberModel.countDocuments({ room: roomId });
    const totalPeople = 1 + membersCount;

    const eAmt = eUse * (prices.elec || 0);
    const isWaterByPerson = prices.waterMode === 'person' || prices.waterMode === 'fixed';
    const wAmt = isWaterByPerson
      ? Math.round((prices.waterFixed || 0) * totalPeople * ratio)
      : (wUse * (prices.water || 0));

    let rent = Math.round(parseFloat((room.price || 0).toString()) * ratio);
    let wifiAmt = Math.round((prices.wifi || 0) * ratio);
    let garbageAmt = Math.round((prices.garbage || 0) * ratio);

    const prepaidUntil = tenant.prepaidUntil || (room as any).contractPrepaid || 0;
    const prepaidDeduction = prepaidUntil > 0 ? rent : 0;
    const unusedPrepaidPeriods = Math.max(0, prepaidUntil - 1);

    const finalBillTotal = rent + eAmt + wAmt + wifiAmt + garbageAmt - prepaidDeduction;

    const existingUnpaidBills = await BillModel.find({
      room: roomId,
      tenant: tenant._id,
      collected: false,
    }).sort({ date: 1 });

    return {
      room: { id: room._id, name: room.name, price: room.price },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        phone: tenant.phone,
        checkin: tenant.checkin,
        prepaidUntil: tenant.prepaidUntil,
      },
      checkoutBill: {
        periodStart: dEffectiveStart.toISOString().split('T')[0],
        periodEnd: payload.checkoutDate,
        date: payload.checkoutDate,
        rent,
        elecOld: pElec,
        elecNew: payload.finalElec,
        elecUsage: eUse,
        elecPrice: prices.elec || 0,
        elecAmount: eAmt,
        waterOld: pWater,
        waterNew: payload.finalWater || 0,
        waterUsage: isWaterByPerson ? totalPeople : wUse,
        waterPrice: isWaterByPerson ? (prices.waterFixed || 0) : (prices.water || 0),
        waterAmount: wAmt,
        wifiAmount: wifiAmt,
        garbageAmount: garbageAmt,
        prepaidDeduction,
        total: finalBillTotal,
        daysStayed,
        totalDaysInCycle,
        ratio,
      },
      unpaidBills: existingUnpaidBills,
      unusedPrepaidPeriods,
    };
  }

  public async checkoutComplete(roomId: string, payload: any, lodgeId?: string): Promise<any> {
    const room = await RoomModel.findById(roomId);
    if (!room) throw new ApiError(404, 'Không tìm thấy phòng trọ');

    if (lodgeId && room.lodge.toString() !== lodgeId.toString()) {
      throw new ApiError(403, 'Bạn không có quyền thao tác trên phòng trọ này');
    }

    const tenant = await TenantModel.findOne({ room: roomId, status: 'active' });
    if (!tenant) throw new ApiError(400, 'Phòng này hiện không có khách thuê');

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // 1. Tạo hóa đơn chia tay cuối cùng
        const cBill = payload.checkoutBill;
        let finalBillDoc: any = null;
        if (cBill) {
          finalBillDoc = new BillModel({
            room: roomId,
            tenant: tenant._id,
            tenantName: tenant.name,
            periodStart: cBill.periodStart,
            periodEnd: cBill.periodEnd,
            date: cBill.date || payload.checkoutDate,
            rent: cBill.rent || 0,
            elecOld: cBill.elecOld || 0,
            elecNew: cBill.elecNew || 0,
            elecUsage: cBill.elecUsage || 0,
            elecPrice: cBill.elecPrice || 0,
            elecAmount: cBill.elecAmount || 0,
            waterOld: cBill.waterOld || 0,
            waterNew: cBill.waterNew || 0,
            waterUsage: cBill.waterUsage || 0,
            waterPrice: cBill.waterPrice || 0,
            waterAmount: cBill.waterAmount || 0,
            wifiAmount: cBill.wifiAmount || 0,
            garbageAmount: cBill.garbageAmount || 0,
            prepaidDeduction: cBill.prepaidDeduction || 0,
            total: cBill.total || 0,
            amountPaid: 0,
            sent: true,
            collected: false,
            status: 'unpaid',
          });
          await finalBillDoc.save({ session });
        }

        // 2. Xử lý các hóa đơn trong Bảng kiểm toán (settledBills)
        const settledBills = payload.settledBills || [];
        for (const item of settledBills) {
          let billId = item.billId;
          if (item.isCheckoutBill && finalBillDoc) {
            billId = finalBillDoc._id;
          }
          if (!billId) continue;

          const b = await BillModel.findById(billId).session(session);
          if (!b) continue;

          if (item.action === 'pay') {
            const addPaid = Number(item.amountPaid) || 0;
            b.amountPaid = (b.amountPaid || 0) + addPaid;
            b.collected = b.amountPaid >= b.total;
            b.status = getPaymentLockState(b.total, b.amountPaid);
            if (b.amountPaid > 0) b.paidAt = payload.checkoutDate;
            await b.save({ session });
          } else if (item.action === 'freeze_debt') {
            b.hasOldDebt = true;
            b.oldTenantName = tenant.name;
            b.oldDebtAmount = Math.max(0, b.total - (b.amountPaid || 0));
            b.status = getPaymentLockState(b.total, b.amountPaid);
            await b.save({ session });
          }
        }

        // 3. Cập nhật khách thuê -> moved_out
        tenant.status = 'moved_out';
        tenant.checkout = payload.checkoutDate;
        await tenant.save({ session });

        // 4. Cập nhật phòng -> empty và reset chỉ số bàn giao
        room.status = 'empty';
        room.initialElec = payload.finalElec !== undefined ? payload.finalElec : room.initialElec;
        if (payload.finalWater !== undefined) {
          room.initialWater = payload.finalWater;
        }
        await room.save({ session });

        // 5. Gỡ bỏ người ở cùng khỏi phòng
        await MemberModel.deleteMany({ room: roomId }).session(session);

        // 6. Ghi nhật ký hoạt động
        await activityService.logActivityByLodge(
          room.lodge.toString(),
          `${room.name} · Trả phòng: ${tenant.name}`,
          'checkout'
        );
      });
    } finally {
      session.endSession();
    }

    return { success: true, message: 'Đã hoàn tất trả phòng thành công' };
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

    if (action.startsWith('Đã ghi điện nước')) {
      const monthKey = sortTime.slice(0, 7);
      if (meterMonths.has(monthKey)) return null;
      return {
        key,
        type: 'meter',
        sortTime,
        title: 'Ghi điện nước',
        subtitle: action,
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
      .filter((b) => b.collected || (b.amountPaid || 0) > 0)
      .forEach((b) => {
        addItem({
          key: `paid-${b._id}`,
          type: 'payment',
          sortTime: b.date ? `${b.date}T12:00:00` : new Date().toISOString(),
          title: b.collected ? 'Đã thanh toán' : 'Thu một phần',
          subtitle: b.sent ? 'Đã gửi hóa đơn' : this.formatBillPeriod(b.date),
          dateLabel: this.formatBillPeriod(b.date),
          amount: Number(b.amountPaid || b.total) || 0,
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
        subtitle: [m.name, m.relation, m.phone].filter(Boolean).join(' · '),
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
