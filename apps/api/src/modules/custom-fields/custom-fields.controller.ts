import { Request, Response, NextFunction } from 'express';
import { CustomField } from '../../models/CustomField';
import { AppError } from '../../middleware/errorHandler';
import { CreateCustomFieldSchema, UpdateCustomFieldSchema } from '@eurochoice/shared';

export async function listCustomFields(req: Request, res: Response, next: NextFunction) {
  try {
    const { appliesTo, includeInactive } = req.query;
    const filter: any = {};

    if (appliesTo) {
      filter.appliesTo = appliesTo;
    }
    if (includeInactive !== 'true') {
      filter.isActive = true;
    }

    const fields = await CustomField.find(filter).sort({ order: 1, createdAt: 1 });
    return res.status(200).json({ data: fields });
  } catch (error) {
    next(error);
  }
}

export async function getCustomFieldById(req: Request, res: Response, next: NextFunction) {
  try {
    const field = await CustomField.findById(req.params.id);
    if (!field) throw new AppError('Custom field not found', 404, 'NOT_FOUND');
    return res.status(200).json(field);
  } catch (error) {
    next(error);
  }
}

export async function createCustomField(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateCustomFieldSchema.parse(req.body);
    const existing = await CustomField.findOne({ key: data.key });
    if (existing) {
      throw new AppError(`Field key "${data.key}" already exists`, 409, 'DUPLICATE_KEY');
    }

    const highestOrder = await CustomField.findOne({ appliesTo: data.appliesTo })
      .sort({ order: -1 })
      .select('order');
    const order = data.order !== undefined ? data.order : (highestOrder ? highestOrder.order + 1 : 0);

    const field = await CustomField.create({ ...data, order });
    return res.status(201).json(field);
  } catch (error) {
    next(error);
  }
}

export async function updateCustomField(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateCustomFieldSchema.parse(req.body);
    const field = await CustomField.findById(req.params.id);
    if (!field) throw new AppError('Custom field not found', 404, 'NOT_FOUND');

    if (data.key && data.key !== field.key) {
      const existing = await CustomField.findOne({ key: data.key });
      if (existing) throw new AppError(`Field key "${data.key}" already exists`, 409, 'DUPLICATE_KEY');
    }

    Object.assign(field, data);
    await field.save();
    return res.status(200).json(field);
  } catch (error) {
    next(error);
  }
}

export async function deleteCustomField(req: Request, res: Response, next: NextFunction) {
  try {
    const field = await CustomField.findById(req.params.id);
    if (!field) throw new AppError('Custom field not found', 404, 'NOT_FOUND');

    // Soft-deactivate to prevent breaking historical records
    field.isActive = false;
    await field.save();

    return res.status(200).json({ message: 'Custom field deactivated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function reorderCustomFields(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      throw new AppError('orderedIds must be an array of IDs', 400);
    }

    const operations = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    if (operations.length > 0) {
      await CustomField.bulkWrite(operations);
    }

    return res.status(200).json({ message: 'Fields reordered successfully' });
  } catch (error) {
    next(error);
  }
}
