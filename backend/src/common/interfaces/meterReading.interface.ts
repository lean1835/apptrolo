import { Document, Types } from 'mongoose';

export interface IMeterReading extends Document {
  _id: Types.ObjectId;
  elec: number;
  water: number;
  date: string; // YYYY-MM-DD
  room: Types.ObjectId;
}
