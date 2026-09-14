import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  expirationPeriodDays: number;
  companyName: string;
  supportEmail: string;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    expirationPeriodDays: { type: Number, default: 7, min: 1, max: 365 },
    companyName: { type: String, default: 'Euro Choice' },
    supportEmail: { type: String, default: 'support@eurochoice.com' },
  },
  { timestamps: true }
);

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

export async function getSystemSettings(): Promise<ISystemSettings> {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({
      expirationPeriodDays: 7,
      companyName: 'Euro Choice',
      supportEmail: 'support@eurochoice.com',
    });
  }
  return settings;
}
