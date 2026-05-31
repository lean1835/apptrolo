import { Document, Types } from 'mongoose';

export interface IRoom extends Document {
  _id: Types.ObjectId;
  name: string;
  price: number;
  status: 'empty' | 'occupied' | 'debt' | 'maintenance';
  tenant?: any;
  phone?: string;
  checkin?: string; // YYYY-MM-DD
  people: number;
  ep: number;
  wp: number;
  descText?: string;
  contract: 'monthly' | 'quarter' | 'halfyear';
  contractMonths: number;
  contractPrepaid: number;
  lodge: Types.ObjectId;
  tenantId?: any;
  bills?: any[];
  meterReadings?: any[];
  members?: any[];
}
