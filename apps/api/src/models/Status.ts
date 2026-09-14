import mongoose, { Schema, Document } from 'mongoose';

export interface IStatus extends Document {
  name: string;
  color: string;
  order: number;
  isTerminal: boolean;
  isSystemStatus: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StatusSchema = new Schema<IStatus>(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#94A3B8' },
    order: { type: Number, default: 0 },
    isTerminal: { type: Boolean, default: false },
    isSystemStatus: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StatusSchema.index({ name: 1 }, { unique: true });
StatusSchema.index({ order: 1 });

export const Status = mongoose.model<IStatus>('Status', StatusSchema);
