import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITenant extends Document {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  room: Types.ObjectId;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    room: { type: Schema.Types.ObjectId, ref: 'Rooms', required: true },
  },
  {
    timestamps: true,
  }
);

TenantSchema.index({ room: 1 }, { name: 'idx_tenant_room', background: true });

export default mongoose.model<ITenant>('Tenants', TenantSchema);
