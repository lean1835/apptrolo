import mongoose, { Schema } from 'mongoose';
import { IMember } from '@common/interfaces/member.interface';

const MemberSchema = new Schema<IMember>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    note: { type: String, default: '', trim: true },
    createdAt: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    }, // YYYY-MM-DD
    room: { type: Schema.Types.ObjectId, ref: 'Rooms', required: true },
  },
  {
    timestamps: true,
  }
);

MemberSchema.index({ room: 1 }, { name: 'idx_member_room', background: true });

export default mongoose.model<IMember>('Members', MemberSchema);
