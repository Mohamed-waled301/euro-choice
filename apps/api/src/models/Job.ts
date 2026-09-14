import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

JobSchema.index({ name: 1 }, { unique: true });

export const Job = mongoose.model<IJob>('Job', JobSchema);
