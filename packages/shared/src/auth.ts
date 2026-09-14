import { z } from 'zod';

export const AccountStatusEnum = z.enum(['active', 'suspended', 'invited']);
export type AccountStatus = z.infer<typeof AccountStatusEnum>;

export const LoginRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthUserSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.object({
    _id: z.string(),
    name: z.string(),
    permissions: z.array(z.string()),
    isSystemRole: z.boolean().optional(),
  }),
  department: z.any().optional(),
  permissions: z.array(z.string()),
  accountStatus: AccountStatusEnum,
  lastLoginAt: z.string().or(z.date()).optional().nullable(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  user: AuthUserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.string().min(1, 'Role is required'),
  departmentId: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional(),
  accountStatus: AccountStatusEnum.default('active'),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  roleId: z.string().optional(),
  departmentId: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional(),
  accountStatus: AccountStatusEnum.optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
