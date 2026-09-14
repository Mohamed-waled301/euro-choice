import { Router } from 'express';
import { login, refresh, logout, getMe } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { LoginRequestSchema } from '@eurochoice/shared';

export const authRouter = Router();

authRouter.post('/login', validateBody(LoginRequestSchema), login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, getMe);
