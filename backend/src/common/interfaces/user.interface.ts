import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  phone: string;
  password?: string;
  name: string;
  email?: string;
  lodge?: Types.ObjectId; // OneToOne relation
}

export interface IUserPayload {
  phone: string;
  password?: string;
  name: string;
  email?: string;
}
