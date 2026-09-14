import { Router } from 'express';
import {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
} from './roles.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

export const rolesRouter = Router();

rolesRouter.use(authenticate);

rolesRouter.get('/permissions', getPermissions);
rolesRouter.get('/', listRoles);
rolesRouter.get('/:id', getRoleById);
rolesRouter.post('/', requirePermission('settings:manage'), createRole);
rolesRouter.patch('/:id', requirePermission('settings:manage'), updateRole);
rolesRouter.delete('/:id', requirePermission('settings:manage'), deleteRole);
