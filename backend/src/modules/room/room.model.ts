import mongoose, { Schema } from 'mongoose';
import { IRoom } from '@common/interfaces/room.interface';

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ['empty', 'occupied', 'debt', 'maintenance'],
      default: 'empty',
    },
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenants' },
    checkin: { type: String, default: '' }, // YYYY-MM-DD
    people: { type: Number, default: 0 },
    ep: { type: Number, default: 0.0 },
    wp: { type: Number, default: 0.0 },
    descText: { type: String, default: '', trim: true },
    contract: {
      type: String,
      enum: ['monthly', 'quarter', 'halfyear'],
      default: 'monthly',
    },
    contractMonths: { type: Number, default: 0 },
    contractPrepaid: { type: Number, default: 0 },
    lodge: { type: Schema.Types.ObjectId, ref: 'Lodges', required: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        if (ret.tenant && typeof ret.tenant === 'object') {
          ret.phone = ret.tenant.phone || '';
          ret.tenantId = ret.tenant._id;
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
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        if (ret.tenant && typeof ret.tenant === 'object') {
          ret.phone = ret.tenant.phone || '';
          ret.tenantId = ret.tenant._id;
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
      }
    },
  }
);

// Virtual fields for relations (similar to JPA OneToMany)
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
