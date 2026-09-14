import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { rolesRouter } from './modules/roles/roles.routes';
import { recordsRouter } from './modules/records/records.routes';
import { clientsRouter } from './modules/clients/clients.routes';
import { customFieldsRouter } from './modules/custom-fields/custom-fields.routes';
import { referenceRouter } from './modules/reference/reference.routes';
import { statusesRouter } from './modules/statuses/statuses.routes';
import { settingsRouter } from './modules/settings/settings.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS locked to frontend origin with credentials
  app.use(
    cors({
      origin: [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'euro-choice-api', timestamp: new Date() });
  });

  // Feature routers
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/roles', rolesRouter);
  app.use('/api/records', recordsRouter);
  app.use('/api/clients', clientsRouter);
  app.use('/api/custom-fields', customFieldsRouter);
  app.use('/api/reference', referenceRouter);
  app.use('/api/statuses', statusesRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/dashboard', dashboardRouter);

  // Centralized error handling
  app.use(errorHandler);

  return app;
}
