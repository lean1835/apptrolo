import mongoose, { Schema } from 'mongoose';
import { ITenant } from '@common/interfaces/tenant.interface';

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true }, // Tên khách chính
    phone: { type: String, default: '', trim: true }, // SĐT
    room: { type: Schema.Types.ObjectId, ref: 'Rooms', required: true },
    checkin: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    }, // Ngày vào ở (YYYY-MM-DD)
    contract: {
      type: String,
      enum: ['monthly', 'quarter', 'halfyear', 'yearly'],
      default: 'monthly',
    }, // Hợp đồng Tháng/Quý/6 tháng
    contractMonths: { type: Number, default: 1 },
    prepaidUntil: { type: Number, default: 0 }, // Số kỳ đã trả trước (tăng khi bấm Ghi nhận thu trước)
    handoverElec: { type: Number, default: 0.0 }, // CHỈ SỐ BÀN GIAO điện
    handoverWater: { type: Number, default: 0.0 }, // CHỈ SỐ BÀN GIAO nước
    status: {
      type: String,
      enum: ['active', 'moved_out'],
      default: 'active',
    },
    checkout: { type: String, default: null },
    citizenId: { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
  }
);

TenantSchema.index({ room: 1 }, { name: 'idx_tenant_room', background: true });
TenantSchema.index({ room: 1, status: 1 }, { name: 'idx_tenant_room_status', background: true });

export default mongoose.model<ITenant>('Tenants', TenantSchema);
