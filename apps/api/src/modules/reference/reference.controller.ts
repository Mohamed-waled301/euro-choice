import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import { AppError } from '../../middleware/errorHandler';

export function createReferenceController(model: Model<any>, entityName: string) {
  return {
    async list(req: Request, res: Response, next: NextFunction) {
      try {
        const { includeInactive } = req.query;
        const filter = includeInactive === 'true' ? {} : { isActive: true };
        const items = await model.find(filter).sort({ name: 1 });
        return res.status(200).json({ data: items });
      } catch (error) {
        next(error);
      }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
      try {
        const item = await model.findById(req.params.id);
        if (!item) throw new AppError(`${entityName} not found`, 404, 'NOT_FOUND');
        return res.status(200).json(item);
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction) {
      try {
        const { name, description } = req.body;
        if (!name || !name.trim()) {
          throw new AppError('Name is required', 400);
        }
        const existing = await model.findOne({ name: name.trim() });
        if (existing) {
          throw new AppError(`${entityName} with name "${name}" already exists`, 409, 'DUPLICATE_NAME');
        }
        const created = await model.create({
          name: name.trim(),
          description: description || '',
          isActive: true,
        });
        return res.status(201).json(created);
      } catch (error) {
        next(error);
      }
    },

    async update(req: Request, res: Response, next: NextFunction) {
      try {
        const { name, description, isActive } = req.body;
        const item = await model.findById(req.params.id);
        if (!item) throw new AppError(`${entityName} not found`, 404, 'NOT_FOUND');

        if (name && name.trim() !== item.name) {
          const existing = await model.findOne({ name: name.trim() });
          if (existing) throw new AppError(`${entityName} with name "${name}" already exists`, 409, 'DUPLICATE_NAME');
          item.name = name.trim();
        }
        if (description !== undefined) item.description = description;
        if (isActive !== undefined) item.isActive = isActive;

        await item.save();
        return res.status(200).json(item);
      } catch (error) {
        next(error);
      }
    },

    async remove(req: Request, res: Response, next: NextFunction) {
      try {
        const item = await model.findById(req.params.id);
        if (!item) throw new AppError(`${entityName} not found`, 404, 'NOT_FOUND');

        // Soft delete/deactivate to preserve foreign key references
        item.isActive = false;
        await item.save();
        return res.status(200).json({ message: `${entityName} deactivated successfully` });
      } catch (error) {
        next(error);
      }
    },
  };
}
