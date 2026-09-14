import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens';
import { User, IUser } from '../models/User';
import { IRole } from '../models/Role';
import { AppError } from './errorHandler';

export interface AuthenticatedUser {
  _id: string;
  name: string;
  email: string;
  role: IRole;
  department?: any;
  permissions: string[];
  accountStatus: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token missing or invalid', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw new AppError('Access token expired or invalid', 401, 'TOKEN_EXPIRED');
    }

    const user = await User.findById(decoded.userId).populate('role').populate('department');
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    if (user.accountStatus !== 'active') {
      throw new AppError('Account is not active', 403, 'ACCOUNT_INACTIVE');
    }

    // Role permissions merged with user custom permissions
    const rolePermissions = (user.role as unknown as IRole)?.permissions || [];
    const resolvedPermissions = Array.from(new Set([...rolePermissions, ...(user.permissions || [])]));

    req.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as unknown as IRole,
      department: user.department,
      permissions: resolvedPermissions,
      accountStatus: user.accountStatus,
    };

    next();
  } catch (error) {
    next(error);
  }
}
