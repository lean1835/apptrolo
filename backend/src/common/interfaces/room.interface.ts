import { Document, Types } from 'mongoose';
import { ITenant } from './tenant.interface';
import { IMember } from './member.interface';
import { IMeterReading } from './meterReading.interface';
import { IBill } from './bill.interface';

export type RoomStatus = 'empty' | 'occupied' | 'maintenance' | 'debt';

export interface IRoom extends Document {
  _id: Types.ObjectId;
  name: string; // Tên phòng P1...P10
  price: number; // Giá thuê phòng
  status: RoomStatus; // Trạng thái chọn tay: Trống / Có khách / Bảo trì
  descText?: string; // Mô tả phòng
  initialElec: number; // CHỈ SỐ GỐC điện
  initialWater: number; // CHỈ SỐ GỐC nước
  ep?: number; // Alias chỉ số gốc điện
  wp?: number; // Alias chỉ số gốc nước
  lodge: Types.ObjectId; // Lodge ref
  
  // Relations / Virtual fields / JSON aliases
  tenant?: any;
  tenantId?: any;
  phone?: string;
  checkin?: string;
  contract?: string;
  contractMonths?: number;
  contractPrepaid?: number;
  prepaidUntil?: number;
  people?: number;
  debtAmount?: number;
  members?: IMember[];
  meterReadings?: IMeterReading[];
  bills?: IBill[];
  createdAt?: Date;
  updatedAt?: Date;
}
