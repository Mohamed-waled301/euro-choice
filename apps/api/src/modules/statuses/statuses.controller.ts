import { Request, Response, NextFunction } from 'express';
import { Status } from '../../models/Status';
import { AppError } from '../../middleware/errorHandler';
import { CreateStatusSchema, UpdateStatusSchema } from '@eurochoice/shared';

export async function listStatuses(req: Request, res: Response, next: NextFunction) {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const statuses = await Status.find(filter).sort({ order: 1, createdAt: 1 });
    return res.status(200).json({ data: statuses });
  } catch (error) {
    next(error);
  }
}

export async function getStatusById(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) throw new AppError('Status not found', 404, 'NOT_FOUND');
    return res.status(200).json(status);
  } catch (error) {
    next(error);
  }
}

export async function createStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateStatusSchema.parse(req.body);
    const existing = await Status.findOne({ name: data.name });
    if (existing) {
      throw new AppError(`Status "${data.name}" already exists`, 409, 'DUPLICATE_STATUS');
    }

    const highest = await Status.findOne().sort({ order: -1 }).select('order');
    const order = data.order !== undefined ? data.order : (highest ? highest.order + 1 : 1);

    const created = await Status.create({
      ...data,
      order,
      isSystemStatus: false,
      isActive: true,
    });
    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateStatusSchema.parse(req.body);
    const status = await Status.findById(req.params.id);
    if (!status) throw new AppError('Status not found', 404, 'NOT_FOUND');

    if (data.name && data.name !== status.name) {
      const existing = await Status.findOne({ name: data.name });
      if (existing) throw new AppError(`Status "${data.name}" already exists`, 409, 'DUPLICATE_STATUS');
    }

    // Renaming is allowed, but system status terminal flag should remain protected
    if (status.isSystemStatus && data.isTerminal !== undefined && data.isTerminal !== status.isTerminal) {
      throw new AppError('Cannot modify terminal status for system statuses', 400, 'PROTECTED_SYSTEM_STATUS');
    }

    Object.assign(status, data);
    await status.save();
    return res.status(200).json(status);
  } catch (error) {
    next(error);
  }
}

export async function deleteStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) throw new AppError('Status not found', 404, 'NOT_FOUND');

    if (status.isSystemStatus) {
      throw new AppError('System statuses are protected and cannot be deleted', 400, 'PROTECTED_SYSTEM_STATUS');
    }

    status.isActive = false;
    await status.save();
    return res.status(200).json({ message: 'Status deactivated successfully' });
  } catch (error) {
    next(error);
  }
}
