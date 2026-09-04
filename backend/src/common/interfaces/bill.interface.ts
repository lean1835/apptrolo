import { Document, Types } from 'mongoose';

export type BillPaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface IBill extends Document {
  _id: Types.ObjectId;
  room: Types.ObjectId; // Room ref
  tenant?: Types.ObjectId; // Tenant ref
  tenantName?: string; // Tên khách tại thời điểm lập hóa đơn
  periodStart: string; // Ngày bắt đầu kỳ (YYYY-MM-DD)
  periodEnd: string; // Ngày kết thúc kỳ (YYYY-MM-DD)
  date: string; // Ngày ghi (YYYY-MM-DD)
  
  // Bảng kê chi tiết bất biến (Breakdown items)
  rent: number; // Tiền phòng
  elecOld: number; // Số điện cũ
  elecNew: number; // Số điện mới
  elecUsage: number; // Tiêu thụ điện (kWh)
  elecPrice: number; // Đơn giá điện
  elecAmount: number; // Tiền điện
  waterOld: number; // Số nước cũ
  waterNew: number; // Số nước mới
  waterUsage: number; // Tiêu thụ nước (khối hoặc người)
  waterPrice: number; // Đơn giá nước
  waterAmount: number; // Tiền nước
  wifiAmount: number; // Tiền Wifi
  garbageAmount: number; // Tiền rác
  otherFee?: number; // Chi phí phát sinh khác
  deduction?: number; // Giảm giá / Khấu trừ
  prepaidDeduction?: number; // Đã khấu trừ trả trước

  // Nợ cũ
  hasOldDebt: boolean; // Cờ nợ cũ
  oldTenantName?: string; // Tên khách cũ
  oldDebtAmount?: number; // Tiền nợ cũ

  // Tổng tiền & Thanh toán
  total: number; // Tổng tiền khóa cứng
  amountPaid: number; // Số tiền thực tế đã thu
  paidAt?: string; // Ngày thu cuối (YYYY-MM-DD hoặc ISO)
  sent: boolean; // Cờ đã gửi
  collected: boolean; // Đã thu đủ (amountPaid >= total)
  status: BillPaymentStatus; // 'unpaid' | 'partial' | 'paid'
  note?: string; // Ghi chú

  // Backward compatibility alias for mobile app
  roomId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
