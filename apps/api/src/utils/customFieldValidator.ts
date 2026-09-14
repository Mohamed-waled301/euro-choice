import { CustomField, ICustomField } from '../models/CustomField';
import { AppError } from '../middleware/errorHandler';

export interface RawFieldValue {
  fieldId: string;
  value?: any;
}

export async function validateCustomFieldValues(
  appliesTo: 'record' | 'client',
  values: RawFieldValue[] = []
): Promise<RawFieldValue[]> {
  const activeFields = await CustomField.find({ appliesTo, isActive: true });
  const fieldMap = new Map<string, ICustomField>();
  activeFields.forEach((f) => fieldMap.set(f._id.toString(), f));

  const validated: RawFieldValue[] = [];
  const providedFieldIds = new Set<string>();

  for (const item of values) {
    if (!item.fieldId) continue;
    const fieldIdStr = item.fieldId.toString();
    const fieldDef = fieldMap.get(fieldIdStr);

    if (!fieldDef) {
      // If field was deleted or does not exist for this entity type, skip or preserve if inert
      continue;
    }

    providedFieldIds.add(fieldIdStr);
    const val = item.value;

    if (fieldDef.required && (val === undefined || val === null || val === '')) {
      throw new AppError(`Custom field "${fieldDef.label}" is required`, 400, 'VALIDATION_ERROR', {
        [`customFields.${fieldDef.key}`]: `Field "${fieldDef.label}" is required`,
      });
    }

    if (val !== undefined && val !== null && val !== '') {
      switch (fieldDef.type) {
        case 'short_text':
        case 'long_text':
        case 'area':
          if (typeof val !== 'string') {
            throw new AppError(`Field "${fieldDef.label}" must be text`, 400);
          }
          break;
        case 'number':
          if (typeof val !== 'number' && isNaN(Number(val))) {
            throw new AppError(`Field "${fieldDef.label}" must be a valid number`, 400);
          }
          break;
        case 'boolean':
          if (typeof val !== 'boolean') {
            throw new AppError(`Field "${fieldDef.label}" must be true or false`, 400);
          }
          break;
        case 'date':
          if (isNaN(new Date(val).getTime())) {
            throw new AppError(`Field "${fieldDef.label}" must be a valid date`, 400);
          }
          break;
        case 'dropdown':
          if (fieldDef.options && fieldDef.options.length > 0 && !fieldDef.options.includes(val)) {
            throw new AppError(
              `Field "${fieldDef.label}" value "${val}" must be one of: ${fieldDef.options.join(', ')}`,
              400
            );
          }
          break;
        case 'selector':
          if (Array.isArray(val)) {
            for (const item of val) {
              if (fieldDef.options && fieldDef.options.length > 0 && !fieldDef.options.includes(item)) {
                throw new AppError(
                  `Field "${fieldDef.label}" option "${item}" is not in allowed options`,
                  400
                );
              }
            }
          }
          break;
      }
    }

    validated.push({ fieldId: fieldIdStr, value: val });
  }

  // Check any active required fields that weren't provided
  for (const field of activeFields) {
    if (field.required && !providedFieldIds.has(field._id.toString())) {
      throw new AppError(`Custom field "${field.label}" is required`, 400, 'VALIDATION_ERROR', {
        [`customFields.${field.key}`]: `Field "${field.label}" is required`,
      });
    }
  }

  return validated;
}
