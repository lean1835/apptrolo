import { Document, Types } from 'mongoose';

export type WaterBillingMode = 'meter' | 'person' | 'fixed';

export interface IUtilityPrice extends Document {
  _id: Types.ObjectId;
  elec: number; // Đơn giá điện / kWh
  water: number; // Đơn giá nước / m3
  waterMode: WaterBillingMode; // Hình thức nước: khối (meter) ↔ người/tháng (person/fixed)
  waterFixed: number; // Đơn giá nước theo người/tháng
  wifi: number; // Phí wifi / phòng
  garbage: number; // Phí rác / phòng
  lodge: Types.ObjectId; // Lodge ref
  createdAt?: Date;
  updatedAt?: Date;
}
