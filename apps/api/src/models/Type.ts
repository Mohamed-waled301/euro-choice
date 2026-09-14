import mongoose, { Schema, Document } from 'mongoose';

export interface IRecordType extends Document {
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecordTypeSchema = new Schema<IRecordType>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RecordTypeSchema.index({ name: 1 }, { unique: true });

export const RecordType = mongoose.model<IRecordType>('RecordType', RecordTypeSchema);
