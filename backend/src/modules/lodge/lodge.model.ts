import mongoose, { Schema } from 'mongoose';
import { ILodge } from '@common/interfaces/lodge.interface';

const LodgeSchema = new Schema<ILodge>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: '' },
    phone: { type: String, required: true, trim: true },
    bank: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    utilityPrice: { type: Schema.Types.ObjectId, ref: 'UtilityPrices' },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

LodgeSchema.index({ owner: 1 }, { name: 'idx_lodge_owner', background: true });

export default mongoose.model<ILodge>('Lodges', LodgeSchema);
