import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  phone: string;
  password?: string;
  name: string;
  email?: string;
  lodge?: Types.ObjectId; // OneToOne relation
  resetPasswordOTP?: string;
  resetPasswordOTPExpires?: Date;
}

export interface IUserPayload {
  phone: string;
  password?: string;
  name: string;
  email?: string;
}
