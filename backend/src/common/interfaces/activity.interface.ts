import { Document, Types } from 'mongoose';

export interface IActivity extends Document {
  _id: Types.ObjectId;
  time: string; // YYYY-MM-DDTHH:mm:ss hoặc ISO
  lodge?: Types.ObjectId; // Lodge ref
  user: Types.ObjectId; // User ref
  room?: Types.ObjectId; // Room ref
  roomName?: string; // Tên phòng snapshot
  tenant?: Types.ObjectId; // Tenant ref
  tenantName?: string; // Tên khách snapshot
  type: string; // bill, meter, member, room, payment, checkout, tenant_new, tenant_old
  txt: string; // Mô tả sự kiện
  amount?: number; // Số tiền giao dịch (nếu có)
  createdAt?: Date;
  updatedAt?: Date;
}
