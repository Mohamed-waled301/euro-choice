import { Request, Response, NextFunction } from 'express';
import { Client } from '../../models/Client';
import { RecordModel } from '../../models/Record';
import { Status } from '../../models/Status';
import { ActionHistory } from '../../models/ActionHistory';
import { AppError } from '../../middleware/errorHandler';
import { validateCustomFieldValues } from '../../utils/customFieldValidator';
import { logActionHistory } from '../../utils/audit';
import { CreateClientSchema, UpdateClientSchema } from '@eurochoice/shared';

export async function listClients(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const search = req.query.search as string;

    const filter: any = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { company: regex }, { phone: regex }];
    }

    const total = await Client.countDocuments(filter);
    const clients = await Client.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      data: clients,
      total,
      page,
      pageCount: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    next(error);
  }
}

export async function getClientById(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
    return res.status(200).json(client);
  } catch (error) {
    next(error);
  }
}

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateClientSchema.parse(req.body);

    const validatedCustomFields = await validateCustomFieldValues(
      'client',
      data.customFieldValues || []
    );

    const client = await Client.create({
      ...data,
      customFieldValues: validatedCustomFields,
    });

    await logActionHistory({
      clientId: client._id.toString(),
      action: 'created',
      userId: req.user?._id,
      meta: { clientName: client.name },
    });

    return res.status(201).json(client);
  } catch (error) {
    next(error);
  }
}

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateClientSchema.parse(req.body);
    const client = await Client.findById(req.params.id);
    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');

    if (data.customFieldValues !== undefined) {
      data.customFieldValues = await validateCustomFieldValues('client', data.customFieldValues);
    }

    Object.assign(client, data);
    await client.save();

    // If client name changed, update the denormalized clientNameCache on Records
    if (data.name) {
      await RecordModel.updateMany({ client: client._id }, { $set: { clientNameCache: client.name } });
    }

    await logActionHistory({
      clientId: client._id.toString(),
      action: 'updated',
      userId: req.user?._id,
      meta: { updatedFields: Object.keys(data) },
    });

    return res.status(200).json(client);
  } catch (error) {
    next(error);
  }
}

export async function getClientRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.params.id;
    const { status } = req.query;

    const filter: any = { client: clientId };

    if (status === 'active') {
      const terminalStatuses = await Status.find({ isTerminal: true }).select('_id');
      const terminalIds = terminalStatuses.map((s) => s._id);
      filter.status = { $nin: terminalIds };
      filter.isExpired = false;
    } else if (status === 'completed') {
      const completedStatus = await Status.findOne({ name: 'Completed' });
      if (completedStatus) {
        filter.status = completedStatus._id;
      }
    } else if (status === 'expired') {
      filter.isExpired = true;
    }

    const records = await RecordModel.find(filter)
      .populate('status')
      .populate('department')
      .populate('job')
      .populate('area')
      .populate('type')
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: records });
  } catch (error) {
    next(error);
  }
}

export async function getClientActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.params.id;

    // Fetch records of this client
    const clientRecords = await RecordModel.find({ client: clientId }).select('_id');
    const recordIds = clientRecords.map((r) => r._id);

    const activity = await ActionHistory.find({
      $or: [{ client: clientId }, { record: { $in: recordIds } }],
    })
      .populate('user', 'name email')
      .populate('record', 'uniqueId shortText')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ data: activity });
  } catch (error) {
    next(error);
  }
}
