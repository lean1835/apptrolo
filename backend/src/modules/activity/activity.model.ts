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
    type: { type: String, trim: true, default: '' }, // bill, meter, member, room
    user: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  },
  {
    timestamps: true,
  }
);

ActivitySchema.index({ user: 1 }, { name: 'idx_activity_user', background: true });

export default mongoose.model<IActivity>('Activities', ActivitySchema);
