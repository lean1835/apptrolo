import mongoose, { Schema } from 'mongoose';
import { IMeterReading } from '@common/interfaces/meterReading.interface';

const MeterReadingSchema = new Schema<IMeterReading>(
  {
    elec: { type: Number, required: true }, // Số điện
    water: { type: Number, required: true }, // Số nước
    date: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split('T')[0],
    }, // Ngày ghi (YYYY-MM-DD)
    period: { type: String, default: '' }, // Kỳ mà nó chốt (ví dụ "2026-09" hoặc "01/09/2026 - 30/09/2026")
    isMeterReplaced: { type: Boolean, default: false }, // Cờ THAY ĐỒNG HỒ
    oldMeterElecEnd: { type: Number },
    newMeterElecStart: { type: Number },
    oldMeterWaterEnd: { type: Number },
    newMeterWaterStart: { type: Number },
    room: { type: Schema.Types.ObjectId, ref: 'Rooms', required: true },
  },
  {
    timestamps: true,
  }
);

MeterReadingSchema.index({ room: 1 }, { name: 'idx_meterReading_room', background: true });
MeterReadingSchema.index({ room: 1, date: -1 }, { name: 'idx_meterReading_room_date', background: true });

export default mongoose.model<IMeterReading>('MeterReadings', MeterReadingSchema);
