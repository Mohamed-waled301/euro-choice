import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema);

/**
 * Atomically generates a formatted unique ID: EC-{year}-{seq padded to 6 digits}
 */
export async function generateUniqueRecordId(session?: mongoose.ClientSession): Promise<string> {
  const currentYear = new Date().getFullYear();
  const counterId = `record-${currentYear}`;

  const updated = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );

  const paddedSeq = String(updated.seq).padStart(6, '0');
  return `EC-${currentYear}-${paddedSeq}`;
}
