import { Document, Types } from 'mongoose';

export interface IMember extends Document {
  _id: Types.ObjectId;
  name: string;
  phone?: string;
  note?: string;
  createdAt: string; // YYYY-MM-DD
  room: Types.ObjectId;
}
