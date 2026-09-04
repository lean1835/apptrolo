import { Document, Types } from 'mongoose';

export interface IMeterReading extends Document {
  _id: Types.ObjectId;
  elec: number; // Số điện
  water: number; // Số nước
  date: string; // Ngày ghi (YYYY-MM-DD)
  period: string; // Kỳ mà nó chốt (ví dụ "2026-09" hoặc "2026-09-01_2026-09-30")
  isMeterReplaced: boolean; // Cờ THAY ĐỒNG HỒ
  oldMeterElecEnd?: number; // Chỉ số điện chốt của đồng hồ cũ nếu thay
  newMeterElecStart?: number; // Chỉ số điện bắt đầu của đồng hồ mới
  oldMeterWaterEnd?: number; // Chỉ số nước chốt của đồng hồ cũ nếu thay
  newMeterWaterStart?: number; // Chỉ số nước bắt đầu của đồng hồ mới
  room: Types.ObjectId; // Room ref
  createdAt?: Date;
  updatedAt?: Date;
}
