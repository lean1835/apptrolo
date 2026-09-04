import { Document, Types } from 'mongoose';

export interface IMember extends Document {
  _id: Types.ObjectId;
  name: string; // Tên người ở cùng
  phone?: string; // Số điện thoại
  relation?: string; // Quan hệ với khách chính
  note?: string; // Ghi chú
  room: Types.ObjectId; // Room ref
  tenant?: Types.ObjectId; // Tenant ref
  createdAt: string; // YYYY-MM-DD
  updatedAt?: Date;
}
