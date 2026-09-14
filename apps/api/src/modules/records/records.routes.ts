import { Router } from 'express';
import {
  listRecords,
  getPlanningTomorrow,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  changeRecordStatus,
  addRecordNote,
  getRecordNotes,
  getRecordHistory,
  addRecordDependency,
  removeRecordDependency,
} from './records.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

export const recordsRouter = Router();

recordsRouter.use(authenticate);

recordsRouter.get('/planning-tomorrow', requirePermission('records:view'), getPlanningTomorrow);
recordsRouter.get('/', requirePermission('records:view'), listRecords);
recordsRouter.post('/', requirePermission('records:create'), createRecord);
recordsRouter.get('/:id', requirePermission('records:view'), getRecordById);
recordsRouter.patch('/:id', requirePermission('records:edit'), updateRecord);
recordsRouter.delete('/:id', requirePermission('records:delete'), deleteRecord);

recordsRouter.patch('/:id/status', requirePermission('records:change_status'), changeRecordStatus);
recordsRouter.post('/:id/notes', requirePermission('records:add_note'), addRecordNote);
recordsRouter.get('/:id/notes', requirePermission('records:view'), getRecordNotes);
recordsRouter.get('/:id/history', requirePermission('records:view_history'), getRecordHistory);

recordsRouter.post('/:id/dependencies', requirePermission('records:manage_dependencies'), addRecordDependency);
recordsRouter.delete(
  '/:id/dependencies/:dependencyId',
  requirePermission('records:manage_dependencies'),
  removeRecordDependency
);
