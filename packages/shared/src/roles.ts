import { z } from 'zod';

export const PermissionKeys = [
  'records:view',
  'records:create',
  'records:edit',
  'records:delete',
  'records:change_status',
  'records:add_note',
  'records:view_history',
  'records:manage_dependencies',
  'clients:manage',
  'users:manage',
  'settings:manage',
  'custom_fields:manage',
] as const;

export type PermissionKey = (typeof PermissionKeys)[number];

export const RoleSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, 'Role name is required').max(50),
  description: z.string().default(''),
  permissions: z.array(z.string()),
  isSystemRole: z.boolean().default(false),
});

export type RoleDTO = z.infer<typeof RoleSchema>;

export const CreateRoleSchema = RoleSchema.omit({ _id: true, isSystemRole: true });
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;

export const UpdateRoleSchema = CreateRoleSchema.partial();
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
