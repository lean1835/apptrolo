import { Document, Types } from 'mongoose';

export interface IActivity extends Document {
  _id: Types.ObjectId;
  txt: string;
  time: string; // YYYY-MM-DDTHH:mm:ss
  type?: string; // bill, meter, member, room
  user: Types.ObjectId; // User ref
}
