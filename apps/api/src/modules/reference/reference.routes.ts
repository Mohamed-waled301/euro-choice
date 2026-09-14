import { Router } from 'express';
import { createReferenceController } from './reference.controller';
import { Department } from '../../models/Department';
import { Job } from '../../models/Job';
import { Area } from '../../models/Area';
import { RecordType } from '../../models/Type';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

export const referenceRouter = Router();
referenceRouter.use(authenticate);

function setupRoutes(model: any, name: string) {
  const router = Router();
  const ctrl = createReferenceController(model, name);

  router.get('/', ctrl.list);
  router.get('/:id', ctrl.getById);
  router.post('/', requirePermission('settings:manage'), ctrl.create);
  router.patch('/:id', requirePermission('settings:manage'), ctrl.update);
  router.delete('/:id', requirePermission('settings:manage'), ctrl.remove);

  return router;
}

referenceRouter.use('/departments', setupRoutes(Department, 'Department'));
referenceRouter.use('/jobs', setupRoutes(Job, 'Job'));
referenceRouter.use('/areas', setupRoutes(Area, 'Area'));
referenceRouter.use('/types', setupRoutes(RecordType, 'RecordType'));
