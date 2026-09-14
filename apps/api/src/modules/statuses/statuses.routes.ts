import { Router } from 'express';
import {
  listStatuses,
  getStatusById,
  createStatus,
  updateStatus,
  deleteStatus,
} from './statuses.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

export const statusesRouter = Router();

statusesRouter.use(authenticate);

statusesRouter.get('/', listStatuses);
statusesRouter.get('/:id', getStatusById);
statusesRouter.post('/', requirePermission('settings:manage'), createStatus);
statusesRouter.patch('/:id', requirePermission('settings:manage'), updateStatus);
statusesRouter.delete('/:id', requirePermission('settings:manage'), deleteStatus);
