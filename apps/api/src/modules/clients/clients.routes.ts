import { Router } from 'express';
import {
  listClients,
  getClientById,
  createClient,
  updateClient,
  getClientRecords,
  getClientActivity,
} from './clients.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';

export const clientsRouter = Router();

clientsRouter.use(authenticate);

clientsRouter.get('/', listClients);
clientsRouter.get('/:id', getClientById);
clientsRouter.post('/', requirePermission('clients:manage'), createClient);
clientsRouter.patch('/:id', requirePermission('clients:manage'), updateClient);
clientsRouter.get('/:id/records', getClientRecords);
clientsRouter.get('/:id/activity', getClientActivity);
