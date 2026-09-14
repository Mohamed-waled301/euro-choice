import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    permissions: [{ type: String }],
    isSystemRole: { type: Boolean, default: false },
  },
  { timestamps: true }
);

RoleSchema.index({ name: 1 }, { unique: true });

export const Role = mongoose.model<IRole>('Role', RoleSchema);
