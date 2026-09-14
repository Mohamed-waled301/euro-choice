import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { AppError } from '../../middleware/errorHandler';
import { CreateUserSchema, UpdateUserSchema } from '@eurochoice/shared';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await User.find()
      .populate('role')
      .populate('department')
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: users });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.params.id)
      .populate('role')
      .populate('department');

    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateUserSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new AppError(`User with email ${data.email} already exists`, 409, 'DUPLICATE_EMAIL');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.roleId,
      department: data.departmentId || null,
      permissions: data.permissions || [],
      accountStatus: data.accountStatus,
    });

    const populated = await User.findById(user._id).populate('role').populate('department');
    return res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateUserSchema.parse(req.body);
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    if (data.email && data.email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: data.email.toLowerCase() });
      if (existing) throw new AppError(`Email ${data.email} is already in use`, 409, 'DUPLICATE_EMAIL');
      user.email = data.email.toLowerCase();
    }

    if (data.name) user.name = data.name;
    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, 12);
    }
    if (data.roleId) user.role = data.roleId as any;
    if (data.departmentId !== undefined) user.department = data.departmentId as any;
    if (data.permissions !== undefined) user.permissions = data.permissions;
    if (data.accountStatus) user.accountStatus = data.accountStatus;

    await user.save();
    const populated = await User.findById(user._id).populate('role').populate('department');
    return res.status(200).json(populated);
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    if (req.user && req.user._id === req.params.id) {
      throw new AppError('You cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
    }

    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
}
