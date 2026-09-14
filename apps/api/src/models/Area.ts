import mongoose, { Schema, Document } from 'mongoose';

export interface IArea extends Document {
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AreaSchema = new Schema<IArea>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AreaSchema.index({ name: 1 }, { unique: true });

export const Area = mongoose.model<IArea>('Area', AreaSchema);
