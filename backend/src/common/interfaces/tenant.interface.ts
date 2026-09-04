import { Document, Types } from 'mongoose';

export type ContractType = 'monthly' | 'quarter' | 'halfyear' | 'yearly';
export type TenantStatus = 'active' | 'moved_out';

export interface ITenant extends Document {
  _id: Types.ObjectId;
  name: string; // Tên khách chính
  phone: string; // Số điện thoại
  checkin: string; // Ngày vào ở (YYYY-MM-DD)
  contract: ContractType; // Hợp đồng Tháng/Quý/6 tháng
  contractMonths: number; // Số tháng của hợp đồng
  prepaidUntil: number; // Số kỳ đã trả trước (tăng khi bấm Ghi nhận thu trước)
  handoverElec: number; // CHỈ SỐ BÀN GIAO điện
  handoverWater: number; // CHỈ SỐ BÀN GIAO nước
  status: TenantStatus; // Trạng thái ở: active / moved_out
  checkout?: string; // Ngày trả phòng (YYYY-MM-DD)
  room: Types.ObjectId; // Room ref
  citizenId?: string; // Số CCCD
  createdAt?: Date;
  updatedAt?: Date;
}
