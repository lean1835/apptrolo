import { Document, Types } from 'mongoose';

export interface ILodge extends Document {
  _id: Types.ObjectId;
  name: string;
  address?: string;
  phone: string;
  bank?: string; // Tên ngân hàng
  bankAccount?: string; // Số tài khoản ngân hàng (QR)
  bankName?: string; // Tên ngân hàng / Chủ tài khoản
  billingDate: number; // Ngày ghi điện nước D (1 -> 28)
  earlyRecordDays: number; // Số ngày mở cửa sổ sớm (mặc định 3)
  owner: Types.ObjectId; // User ref
  utilityPrice?: Types.ObjectId; // UtilityPrice ref
  createdAt?: Date;
  updatedAt?: Date;
}
