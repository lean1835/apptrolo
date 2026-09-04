import mongoose, { Schema } from 'mongoose';
import { IBill } from '@common/interfaces/bill.interface';

const BillSchema = new Schema<IBill>(
  {
    room: { type: Schema.Types.ObjectId, ref: 'Rooms', required: true },
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenants' },
    tenantName: { type: String, default: '', trim: true },
    periodStart: { type: String, default: '' }, // YYYY-MM-DD
    periodEnd: { type: String, default: '' }, // YYYY-MM-DD
    date: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split('T')[0],
    }, // YYYY-MM-DD

    // Bảng kê chi tiết bất biến
    rent: { type: Number, default: 0 }, // Tiền phòng
    elecOld: { type: Number, default: 0 }, // Số điện cũ
    elecNew: { type: Number, default: 0 }, // Số điện mới
    elecUsage: { type: Number, default: 0 }, // kWh tiêu thụ
    elecPrice: { type: Number, default: 0 }, // Đơn giá điện
    elecAmount: { type: Number, default: 0 }, // Tiền điện
    waterOld: { type: Number, default: 0 }, // Số nước cũ
    waterNew: { type: Number, default: 0 }, // Số nước mới
    waterUsage: { type: Number, default: 0 }, // Khối / Người nước
    waterPrice: { type: Number, default: 0 }, // Đơn giá nước
    waterAmount: { type: Number, default: 0 }, // Tiền nước
    wifiAmount: { type: Number, default: 0 }, // Phí wifi
    garbageAmount: { type: Number, default: 0 }, // Phí rác
    otherFee: { type: Number, default: 0 }, // Phí phát sinh
    deduction: { type: Number, default: 0 }, // Khấu trừ / Giảm trừ
    prepaidDeduction: { type: Number, default: 0 }, // Khấu trừ trả trước

    // Cờ nợ cũ
    hasOldDebt: { type: Boolean, default: false }, // Cờ nợ cũ
    oldTenantName: { type: String, default: '', trim: true }, // Tên khách cũ
    oldDebtAmount: { type: Number, default: 0 }, // Số tiền nợ cũ

    // Tổng tiền & Thanh toán
    total: { type: Number, required: true }, // Total khóa cứng
    amountPaid: { type: Number, default: 0 }, // Số tiền thực tế đã thu
    paidAt: { type: String, default: '' }, // Ngày thu cuối
    sent: { type: Boolean, default: false }, // Cờ đã gửi
    collected: { type: Boolean, default: false }, // Đã thu đủ (amountPaid >= total)
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    note: { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.roomId = ret.room ? ret.room.toString() : '';
        return ret;
      },
    },
  }
);

BillSchema.index({ room: 1 }, { name: 'idx_bill_room', background: true });
BillSchema.index({ room: 1, date: -1 }, { name: 'idx_bill_room_date', background: true });

export default mongoose.model<IBill>('Bills', BillSchema);
