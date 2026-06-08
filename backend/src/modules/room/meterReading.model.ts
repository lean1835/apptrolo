import mongoose, { Schema } from 'mongoose';
import { IMeterReading } from '@common/interfaces/meterReading.interface';

const MeterReadingSchema = new Schema<IMeterReading>(
  {
    elec: { type: Number, required: true },
    water: { type: Number, required: true },
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

MeterReadingSchema.index({ room: 1, date: -1 }, { name: 'idx_meterReading_room_date', background: true });

export default mongoose.model<IMeterReading>('MeterReadings', MeterReadingSchema);
