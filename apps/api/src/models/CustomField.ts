import mongoose, { Schema, Document } from 'mongoose';

export type CustomFieldType =
  | 'short_text'
  | 'long_text'
  | 'dropdown'
  | 'selector'
  | 'date'
  | 'area'
  | 'number'
  | 'boolean';

export type CustomFieldAppliesTo = 'record' | 'client';

export interface ICustomField extends Document {
  key: string;
  label: string;
  type: CustomFieldType;
  options: string[];
  appliesTo: CustomFieldAppliesTo;
  required: boolean;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomFieldSchema = new Schema<ICustomField>(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['short_text', 'long_text', 'dropdown', 'selector', 'date', 'area', 'number', 'boolean'],
    },
    options: [{ type: String }],
    appliesTo: {
      type: String,
      required: true,
      enum: ['record', 'client'],
      default: 'record',
    },
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CustomFieldSchema.index({ key: 1 }, { unique: true });
CustomFieldSchema.index({ appliesTo: 1, order: 1 });

export const CustomField = mongoose.model<ICustomField>('CustomField', CustomFieldSchema);
