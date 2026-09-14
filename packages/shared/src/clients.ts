import { z } from 'zod';
import { CustomFieldValueSchema } from './custom-fields';

export const ClientSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, 'Client name is required').max(150),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(50).optional().default(''),
  company: z.string().max(150).optional().default(''),
  notes: z.string().default(''),
  customFieldValues: z.array(CustomFieldValueSchema).default([]),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type ClientDTO = z.infer<typeof ClientSchema>;

export const CreateClientSchema = ClientSchema.omit({ _id: true, createdAt: true, updatedAt: true });
export type CreateClientInput = z.infer<typeof CreateClientSchema>;

export const UpdateClientSchema = CreateClientSchema.partial();
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

export const ClientQueryParamsSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.enum(['nameAsc', 'nameDesc', 'createdAtAsc', 'createdAtDesc']).optional().default('createdAtDesc'),
});
export type ClientQueryParams = z.infer<typeof ClientQueryParamsSchema>;
