import mongoose, { Schema } from 'mongoose';
import { IUser } from '@common/interfaces/user.interface';

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, unique: true, required: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    lodge: { type: Schema.Types.ObjectId, ref: 'Lodges' },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// Indexes
UserSchema.index({ phone: 1 }, { name: 'idx_user_phone', background: true });

export default mongoose.model<IUser>('Users', UserSchema);
