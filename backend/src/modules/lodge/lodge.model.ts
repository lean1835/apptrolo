import mongoose, { Schema } from 'mongoose';
import { ILodge } from '@common/interfaces/lodge.interface';

const LodgeSchema = new Schema<ILodge>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: '' },
    phone: { type: String, required: true, trim: true },
    bank: { type: String, trim: true, default: '' },
    bankAccount: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    billingDate: { type: Number, default: 25, min: 1, max: 28 }, // Ngày ghi điện nước D (1→28)
    earlyRecordDays: { type: Number, default: 3, min: 0 }, // Số ngày mở cửa sổ sớm (mặc định 3)
    owner: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    utilityPrice: { type: Schema.Types.ObjectId, ref: 'UtilityPrices' },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // Compatibility: ensure bankAccount is set if bank exists or vice versa
        if (!ret.bankAccount && ret.bank) {
          ret.bankAccount = ret.bank;
        }
        return ret;
      },
    },
  }
);

LodgeSchema.index({ owner: 1 }, { name: 'idx_lodge_owner', background: true });

export default mongoose.model<ILodge>('Lodges', LodgeSchema);
