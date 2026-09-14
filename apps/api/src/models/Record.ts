import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRecordCustomFieldValue {
  fieldId: Types.ObjectId;
  value: any;
}

export interface IRecord extends Document {
  uniqueId: string;
  client: Types.ObjectId;
  clientNameCache: string;
  department: Types.ObjectId;
  type: Types.ObjectId;
  area: Types.ObjectId;
  job: Types.ObjectId;
  status: Types.ObjectId;
  submissionDate: Date;
  endDate: Date;
  shortText: string;
  longText: string;
  customFieldValues: IRecordCustomFieldValue[];
  dependencies: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  expiresAt: Date;
  isExpired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecordCustomFieldValueSchema = new Schema(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: 'CustomField', required: true },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const RecordSchema = new Schema<IRecord>(
  {
    uniqueId: { type: String, required: true, unique: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    clientNameCache: { type: String, default: '', index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    type: { type: Schema.Types.ObjectId, ref: 'RecordType', required: true, index: true },
    area: { type: Schema.Types.ObjectId, ref: 'Area', required: true, index: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    status: { type: Schema.Types.ObjectId, ref: 'Status', required: true, index: true },
    submissionDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    shortText: { type: String, required: true, trim: true },
    longText: { type: String, default: '' },
    customFieldValues: [RecordCustomFieldValueSchema],
    dependencies: [{ type: Schema.Types.ObjectId, ref: 'Record' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date, required: true, index: true },
    isExpired: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

RecordSchema.index({ uniqueId: 'text', shortText: 'text', clientNameCache: 'text' });

export const RecordModel = mongoose.model<IRecord>('Record', RecordSchema);
