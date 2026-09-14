import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClientCustomFieldValue {
  fieldId: Types.ObjectId;
  value: any;
}

export interface IClient extends Document {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  customFieldValues: IClientCustomFieldValue[];
  createdAt: Date;
  updatedAt: Date;
}

const ClientCustomFieldValueSchema = new Schema(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: 'CustomField', required: true },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const ClientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    notes: { type: String, default: '' },
    customFieldValues: [ClientCustomFieldValueSchema],
  },
  { timestamps: true }
);

ClientSchema.index({ name: 1 });
ClientSchema.index({ name: 'text', email: 'text', company: 'text' });

export const Client = mongoose.model<IClient>('Client', ClientSchema);
