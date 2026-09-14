import { z } from 'zod';

export const NamedEntitySchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().default(''),
  isActive: z.boolean().default(true),
});

export const DepartmentSchema = NamedEntitySchema;
export const JobSchema = NamedEntitySchema;
export const AreaSchema = NamedEntitySchema;
export const RecordTypeSchema = NamedEntitySchema;

export const StatusSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, 'Status name is required').max(50),
  color: z.string().default('#94A3B8'),
  order: z.number().int().default(0),
  isTerminal: z.boolean().default(false),
  isSystemStatus: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type StatusDTO = z.infer<typeof StatusSchema>;

export const CreateStatusSchema = StatusSchema.omit({ _id: true, isSystemStatus: true });
export const UpdateStatusSchema = CreateStatusSchema.partial();

export const SystemSettingsSchema = z.object({
  _id: z.string().optional(),
  expirationPeriodDays: z.number().int().min(1).max(365).default(7),
  companyName: z.string().default('Euro Choice'),
  supportEmail: z.string().email().optional().default('support@eurochoice.com'),
});
export type SystemSettingsDTO = z.infer<typeof SystemSettingsSchema>;
