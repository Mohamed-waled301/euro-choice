import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const hasPermission = req.user.permissions.includes(permission);
    if (!hasPermission) {
      return next(
        new AppError(
          `Permission denied. Required permission: ${permission}`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
