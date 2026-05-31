import { Document, Types } from 'mongoose';

export interface ILodge extends Document {
  _id: Types.ObjectId;
  name: string;
  address?: string;
  phone: string;
  bank?: string;
  bankName?: string;
  owner: Types.ObjectId; // User ref
  utilityPrice?: Types.ObjectId; // UtilityPrice ref
}
