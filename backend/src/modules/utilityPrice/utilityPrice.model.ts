import mongoose, { Schema } from 'mongoose';
import { IUtilityPrice } from '@common/interfaces/utilityPrice.interface';

const UtilityPriceSchema = new Schema<IUtilityPrice>(
  {
    elec: { type: Number, default: 3500.0 },
    water: { type: Number, default: 15000.0 },
    wifi: { type: Number, default: 100000.0 },
    garbage: { type: Number, default: 20000.0 },
    waterMode: { type: String, enum: ['meter', 'fixed'], default: 'meter' },
    waterFixed: { type: Number, default: 150000.0 },
    lodge: { type: Schema.Types.ObjectId, ref: 'Lodges', required: true, unique: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

UtilityPriceSchema.index({ lodge: 1 }, { name: 'idx_utilityPrice_lodge', background: true });

export default mongoose.model<IUtilityPrice>('UtilityPrices', UtilityPriceSchema);
