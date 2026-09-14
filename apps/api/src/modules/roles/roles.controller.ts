import { Request, Response, NextFunction } from 'express';
import { Role } from '../../models/Role';
import { AppError } from '../../middleware/errorHandler';
import { PermissionKeys, CreateRoleSchema, UpdateRoleSchema } from '@eurochoice/shared';

export async function getPermissions(req: Request, res: Response) {
  return res.status(200).json({ permissions: PermissionKeys });
}

export async function listRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await Role.find().sort({ isSystemRole: -1, name: 1 });
    return res.status(200).json({ data: roles });
  } catch (error) {
    next(error);
  }
}

export async function getRoleById(req: Request, res: Response, next: NextFunction) {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) throw new AppError('Role not found', 404, 'NOT_FOUND');
    return res.status(200).json(role);
  } catch (error) {
    next(error);
  }
}

export async function createRole(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateRoleSchema.parse(req.body);
    const existing = await Role.findOne({ name: data.name });
    if (existing) {
      throw new AppError(`Role "${data.name}" already exists`, 409, 'DUPLICATE_ROLE');
    }
    const role = await Role.create({ ...data, isSystemRole: false });
    return res.status(201).json(role);
  } catch (error) {
    next(error);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateRoleSchema.parse(req.body);
    const role = await Role.findById(req.params.id);
    if (!role) throw new AppError('Role not found', 404, 'NOT_FOUND');

    if (role.isSystemRole && data.name && data.name !== role.name) {
      throw new AppError('System role names cannot be altered', 400, 'SYSTEM_ROLE_PROTECTED');
    }

    Object.assign(role, data);
    await role.save();
    return res.status(200).json(role);
  } catch (error) {
    next(error);
  }
}

export async function deleteRole(req: Request, res: Response, next: NextFunction) {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) throw new AppError('Role not found', 404, 'NOT_FOUND');

    if (role.isSystemRole) {
      throw new AppError('System roles cannot be deleted', 400, 'CANNOT_DELETE_SYSTEM_ROLE');
    }

    await Role.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
}
