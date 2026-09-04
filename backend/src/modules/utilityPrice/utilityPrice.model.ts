import mongoose, { Schema } from 'mongoose';
import { IUtilityPrice } from '@common/interfaces/utilityPrice.interface';

const UtilityPriceSchema = new Schema<IUtilityPrice>(
  {
    elec: { type: Number, default: 3500.0 }, // Giá điện / kWh
    water: { type: Number, default: 15000.0 }, // Giá nước theo khối (m³)
    waterMode: {
      type: String,
      enum: ['meter', 'person', 'fixed'],
      default: 'meter',
    }, // Hình thức nước: khối (meter) ↔ người/tháng (person/fixed)
    waterFixed: { type: Number, default: 100000.0 }, // Giá nước theo người/tháng
    wifi: { type: Number, default: 100000.0 }, // Wifi
    garbage: { type: Number, default: 20000.0 }, // Rác
    lodge: { type: Schema.Types.ObjectId, ref: 'Lodges', required: true, unique: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

UtilityPriceSchema.index({ lodge: 1 }, { name: 'idx_utilityPrice_lodge', background: true });

export default mongoose.model<IUtilityPrice>('UtilityPrices', UtilityPriceSchema);
