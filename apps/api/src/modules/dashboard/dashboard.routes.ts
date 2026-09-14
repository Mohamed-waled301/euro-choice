import { Router } from 'express';
import { getDashboardSummary } from './dashboard.controller';
import { authenticate } from '../../middleware/auth';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get('/summary', getDashboardSummary);
