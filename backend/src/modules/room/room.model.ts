import mongoose, { Schema } from 'mongoose';
import { IRoom } from '@common/interfaces/room.interface';

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true, trim: true }, // Tên phòng P1...P10
    price: { type: Number, required: true }, // Giá thuê
    status: {
      type: String,
      enum: ['empty', 'occupied', 'maintenance', 'debt'],
      default: 'empty',
    }, // Trạng thái chọn tay: Trống / Có khách / Bảo trì
    descText: { type: String, default: '', trim: true }, // Mô tả
    initialElec: { type: Number, default: 0.0 }, // CHỈ SỐ GỐC điện
    initialWater: { type: Number, default: 0.0 }, // CHỈ SỐ GỐC nước
    lodge: { type: Schema.Types.ObjectId, ref: 'Lodges', required: true },
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenants' },
    debtAmount: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // Compatibility with mobile client expecting ep/wp
        ret.ep = ret.initialElec !== undefined ? ret.initialElec : 0;
        ret.wp = ret.initialWater !== undefined ? ret.initialWater : 0;

        if (ret.tenant && typeof ret.tenant === 'object') {
          ret.phone = ret.tenant.phone || '';
          ret.tenantId = ret.tenant._id;
          ret.checkin = ret.tenant.checkin || '';
          ret.contract = ret.tenant.contract || 'monthly';
          ret.contractMonths = ret.tenant.contractMonths || 1;
          ret.contractPrepaid = ret.tenant.prepaidUntil || 0;
          ret.prepaidUntil = ret.tenant.prepaidUntil || 0;
          ret.tenant = ret.tenant.name || '';
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
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.ep = ret.initialElec !== undefined ? ret.initialElec : 0;
        ret.wp = ret.initialWater !== undefined ? ret.initialWater : 0;

        if (ret.tenant && typeof ret.tenant === 'object') {
          ret.phone = ret.tenant.phone || '';
          ret.tenantId = ret.tenant._id;
          ret.checkin = ret.tenant.checkin || '';
          ret.contract = ret.tenant.contract || 'monthly';
          ret.contractMonths = ret.tenant.contractMonths || 1;
          ret.contractPrepaid = ret.tenant.prepaidUntil || 0;
          ret.prepaidUntil = ret.tenant.prepaidUntil || 0;
          ret.tenant = ret.tenant.name || '';
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
      },
    },
  }
);

// Virtual relations
RoomSchema.virtual('tenantDoc', {
  ref: 'Tenants',
  localField: '_id',
  foreignField: 'room',
  justOne: true,
  match: { status: 'active' },
});

RoomSchema.virtual('members', {
  ref: 'Members',
  localField: '_id',
  foreignField: 'room',
});

RoomSchema.virtual('meterReadings', {
  ref: 'MeterReadings',
  localField: '_id',
  foreignField: 'room',
});

RoomSchema.virtual('bills', {
  ref: 'Bills',
  localField: '_id',
  foreignField: 'room',
});

RoomSchema.index({ lodge: 1 }, { name: 'idx_room_lodge', background: true });

export default mongoose.model<IRoom>('Rooms', RoomSchema);
