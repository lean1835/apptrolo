import { Document, Types } from 'mongoose';

export interface IUtilityPrice extends Document {
  _id: Types.ObjectId;
  elec: number;
  water: number;
  wifi: number;
  garbage: number;
  waterMode: 'meter' | 'fixed';
  waterFixed: number;
  lodge: Types.ObjectId; // Lodge ref
}
