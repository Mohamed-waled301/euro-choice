import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../../models/User';
import { IRole } from '../../models/Role';
import { AppError } from '../../middleware/errorHandler';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../../utils/tokens';
import { LoginRequestSchema } from '@eurochoice/shared';

// Simple in-memory rate limiting map for login attempts by IP
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return;
  }
  if (entry.count >= 5) {
    const minutesLeft = Math.ceil((entry.resetAt - now) / 60000);
    throw new AppError(
      `Too many login attempts. Please try again in ${minutesLeft} minute(s).`,
      429,
      'TOO_MANY_REQUESTS'
    );
  }
  entry.count += 1;
}

function clearLoginRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    checkLoginRateLimit(clientIp);

    const { email, password } = LoginRequestSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .populate('role')
      .populate('department');

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.accountStatus !== 'active') {
      throw new AppError('Your account has been suspended or invited. Please contact an administrator.', 403, 'ACCOUNT_INACTIVE');
    }

    clearLoginRateLimit(clientIp);

    user.lastLoginAt = new Date();
    await user.save();

    const payload = { userId: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setRefreshTokenCookie(res, refreshToken);

    const rolePermissions = (user.role as unknown as IRole)?.permissions || [];
    const resolvedPermissions = Array.from(new Set([...rolePermissions, ...(user.permissions || [])]));

    return res.status(200).json({
      accessToken,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: resolvedPermissions,
        accountStatus: user.accountStatus,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new AppError('Refresh token missing', 401, 'REFRESH_TOKEN_MISSING');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      clearRefreshTokenCookie(res);
      throw new AppError('Refresh token expired or invalid', 401, 'REFRESH_TOKEN_INVALID');
    }

    const user = await User.findById(decoded.userId).populate('role').populate('department');
    if (!user || user.accountStatus !== 'active') {
      clearRefreshTokenCookie(res);
      throw new AppError('User not found or inactive', 401, 'USER_NOT_FOUND');
    }

    const payload = { userId: user._id.toString(), email: user.email };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    setRefreshTokenCookie(res, newRefreshToken);

    const rolePermissions = (user.role as unknown as IRole)?.permissions || [];
    const resolvedPermissions = Array.from(new Set([...rolePermissions, ...(user.permissions || [])]));

    return res.status(200).json({
      accessToken: newAccessToken,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: resolvedPermissions,
        accountStatus: user.accountStatus,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    clearRefreshTokenCookie(res);
    return res.status(200).json({ message: 'Successfully logged out' });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    return res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
}
