import mongoose, { Schema } from 'mongoose';
import { IMember } from '@common/interfaces/member.interface';

const MemberSchema = new Schema<IMember>(
  {
    name: { type: String, required: true, trim: true }, // Tên người ở cùng
    phone: { type: String, default: '', trim: true }, // SĐT
    relation: { type: String, default: '', trim: true }, // Quan hệ với khách chính
    note: { type: String, default: '', trim: true },
    room: { type: Schema.Types.ObjectId, ref: 'Rooms', required: true },
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenants' },
    createdAt: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    }, // YYYY-MM-DD
  },
  {
    timestamps: true,
  }
);

MemberSchema.index({ room: 1 }, { name: 'idx_member_room', background: true });
MemberSchema.index({ tenant: 1 }, { name: 'idx_member_tenant', background: true });

export default mongoose.model<IMember>('Members', MemberSchema);
