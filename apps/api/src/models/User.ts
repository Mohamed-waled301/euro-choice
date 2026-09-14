import mongoose, { Schema, Document, Types } from 'mongoose';

export type AccountStatus = 'active' | 'suspended' | 'invited';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Types.ObjectId;
  department?: Types.ObjectId;
  permissions: string[];
  accountStatus: AccountStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    permissions: [{ type: String }],
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'invited'],
      default: 'active',
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
