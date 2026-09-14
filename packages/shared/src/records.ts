import { z } from 'zod';
import { CustomFieldValueSchema } from './custom-fields';

export const RecordSortOptions = [
  'nameAsc',
  'nameDesc',
  'submissionDateAsc',
  'submissionDateDesc',
  'endDateAsc',
  'endDateDesc',
  'statusOrder',
] as const;
export type RecordSortOption = (typeof RecordSortOptions)[number];

export const CreateRecordSchema = z.object({
  client: z.string().min(1, 'Client is required'),
  department: z.string().min(1, 'Department is required'),
  type: z.string().min(1, 'Type is required'),
  area: z.string().min(1, 'Area is required'),
  job: z.string().min(1, 'Job is required'),
  status: z.string().optional(),
  submissionDate: z.string().or(z.date()).default(() => new Date().toISOString()),
  endDate: z.string().or(z.date()),
  shortText: z.string().min(1, 'Short summary is required').max(200),
  longText: z.string().default(''),
  customFieldValues: z.array(CustomFieldValueSchema).default([]),
  dependencies: z.array(z.string()).default([]),
});
export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;

export const UpdateRecordSchema = CreateRecordSchema.partial();
export type UpdateRecordInput = z.infer<typeof UpdateRecordSchema>;

export const ChangeRecordStatusSchema = z.object({
  statusId: z.string().min(1, 'Status ID is required'),
  note: z.string().optional(),
});
export type ChangeRecordStatusInput = z.infer<typeof ChangeRecordStatusSchema>;

export const CreateNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').max(2000),
});
export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;

export const AddDependencySchema = z.object({
  dependsOnId: z.string().min(1, 'Dependency Record ID is required'),
});
export type AddDependencyInput = z.infer<typeof AddDependencySchema>;

export const RecordQueryParamsSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  department: z.string().optional(),
  client: z.string().optional(),
  type: z.string().optional(),
  area: z.string().optional(),
  job: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(RecordSortOptions).optional().default('endDateAsc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type RecordQueryParams = z.infer<typeof RecordQueryParamsSchema>;

export const PlanningTomorrowQueryParamsSchema = z.object({
  department: z.string().optional(),
  area: z.string().optional(),
  job: z.string().optional(),
  sort: z.string().optional(),
});
export type PlanningTomorrowQueryParams = z.infer<typeof PlanningTomorrowQueryParamsSchema>;
