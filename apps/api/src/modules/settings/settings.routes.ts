import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  triggerExpirationSweep,
} from './settings.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

export const settingsRouter = Router();

settingsRouter.use(authenticate);

settingsRouter.get('/', getSettings);
settingsRouter.patch('/', requirePermission('settings:manage'), updateSettings);
settingsRouter.post('/expiration-sweep', requirePermission('settings:manage'), triggerExpirationSweep);
