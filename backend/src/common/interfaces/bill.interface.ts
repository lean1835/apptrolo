import { Document, Types } from 'mongoose';

export interface IBill extends Document {
  _id: Types.ObjectId;
  total: number;
  sent: boolean;
  collected: boolean;
  date: string; // YYYY-MM-DD
  room: Types.ObjectId;
}
