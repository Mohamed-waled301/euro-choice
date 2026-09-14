import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INote extends Document {
  record: Types.ObjectId;
  content: string;
  user: Types.ObjectId;
  createdAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    record: { type: Schema.Types.ObjectId, ref: 'Record', required: true, index: true },
    content: { type: String, required: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NoteSchema.index({ record: 1, createdAt: -1 });

export const Note = mongoose.model<INote>('Note', NoteSchema);
