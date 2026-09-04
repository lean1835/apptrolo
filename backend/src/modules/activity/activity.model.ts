import mongoose, { Schema } from 'mongoose';
import { IActivity } from '@common/interfaces/activity.interface';

const ActivitySchema = new Schema<IActivity>(
  {
    txt: { type: String, required: true, trim: true },
    time: {
      type: String,
      required: true,
      default: () => new Date().toISOString(),
    }, // YYYY-MM-DDTHH:mm:ss
    type: { type: String, trim: true, default: '' }, // bill, meter, member, room, payment, checkout, tenant_new, tenant_old
    amount: { type: Number },
    room: { type: Schema.Types.ObjectId, ref: 'Rooms' },
    roomName: { type: String, default: '', trim: true },
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenants' },
    tenantName: { type: String, default: '', trim: true },
    lodge: { type: Schema.Types.ObjectId, ref: 'Lodges' },
    user: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  },
  {
    timestamps: true,
  }
);

ActivitySchema.index({ user: 1, time: -1 }, { name: 'idx_activity_user_time', background: true });
ActivitySchema.index({ lodge: 1, time: -1 }, { name: 'idx_activity_lodge_time', background: true });

export default mongoose.model<IActivity>('Activities', ActivitySchema);
