import mongoose, { Schema } from 'mongoose';
import { IBill } from '@common/interfaces/bill.interface';

const BillSchema = new Schema<IBill>(
  {
    total: { type: Number, required: true },
    sent: { type: Boolean, default: false },
    collected: { type: Boolean, default: false },
    date: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split('T')[0],
    }, // YYYY-MM-DD
    room: { type: Schema.Types.ObjectId, ref: 'Rooms', required: true },
  },
  {
    timestamps: true,
  }
);

BillSchema.index({ room: 1 }, { name: 'idx_bill_room', background: true });

export default mongoose.model<IBill>('Bills', BillSchema);
