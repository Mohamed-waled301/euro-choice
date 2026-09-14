import { Router } from 'express';
import {
  listCustomFields,
  getCustomFieldById,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  reorderCustomFields,
} from './custom-fields.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

export const customFieldsRouter = Router();

customFieldsRouter.use(authenticate);

customFieldsRouter.get('/', listCustomFields);
customFieldsRouter.get('/:id', getCustomFieldById);
customFieldsRouter.post('/', requirePermission('custom_fields:manage'), createCustomField);
customFieldsRouter.patch('/reorder', requirePermission('custom_fields:manage'), reorderCustomFields);
customFieldsRouter.patch('/:id', requirePermission('custom_fields:manage'), updateCustomField);
customFieldsRouter.delete('/:id', requirePermission('custom_fields:manage'), deleteCustomField);
