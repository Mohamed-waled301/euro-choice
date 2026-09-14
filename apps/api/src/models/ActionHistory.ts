import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActionHistory extends Document {
  record?: Types.ObjectId;
  client?: Types.ObjectId;
  action: string;
  user?: Types.ObjectId | null;
  meta?: any;
  createdAt: Date;
}

const ActionHistorySchema = new Schema<IActionHistory>(
  {
    record: { type: Schema.Types.ObjectId, ref: 'Record', index: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
    action: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActionHistorySchema.index({ record: 1, createdAt: -1 });
ActionHistorySchema.index({ client: 1, createdAt: -1 });

export const ActionHistory = mongoose.model<IActionHistory>('ActionHistory', ActionHistorySchema);
