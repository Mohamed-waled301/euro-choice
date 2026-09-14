import { z } from 'zod';

export const CustomFieldTypeEnum = z.enum([
  'short_text',
  'long_text',
  'dropdown',
  'selector',
  'date',
  'area',
  'number',
  'boolean',
]);
export type CustomFieldType = z.infer<typeof CustomFieldTypeEnum>;

export const CustomFieldAppliesToEnum = z.enum(['record', 'client']);
export type CustomFieldAppliesTo = z.infer<typeof CustomFieldAppliesToEnum>;

export const CustomFieldSchema = z.object({
  _id: z.string().optional(),
  key: z
    .string()
    .min(1, 'Key is required')
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Key must be lowercase letters, numbers, and underscores only'),
  label: z.string().min(1, 'Label is required').max(100),
  type: CustomFieldTypeEnum,
  options: z.array(z.string()).default([]),
  appliesTo: CustomFieldAppliesToEnum,
  required: z.boolean().default(false),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type CustomFieldDTO = z.infer<typeof CustomFieldSchema>;

export const CreateCustomFieldSchema = CustomFieldSchema.omit({ _id: true });
export type CreateCustomFieldInput = z.infer<typeof CreateCustomFieldSchema>;

export const UpdateCustomFieldSchema = CreateCustomFieldSchema.partial();
export type UpdateCustomFieldInput = z.infer<typeof UpdateCustomFieldSchema>;

export const CustomFieldValueSchema = z.object({
  fieldId: z.string(),
  value: z.any(),
});
export type CustomFieldValue = z.infer<typeof CustomFieldValueSchema>;
