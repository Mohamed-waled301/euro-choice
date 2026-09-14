import { Request, Response, NextFunction } from 'express';
import { RecordModel } from '../../models/Record';
import { Client } from '../../models/Client';
import { Status } from '../../models/Status';
import { Note } from '../../models/Note';
import { ActionHistory } from '../../models/ActionHistory';
import { generateUniqueRecordId } from '../../models/Counter';
import { getSystemSettings } from '../../models/SystemSettings';
import { AppError } from '../../middleware/errorHandler';
import { validateCustomFieldValues } from '../../utils/customFieldValidator';
import { detectCircularDependency } from '../../utils/cycleDetection';
import { logActionHistory } from '../../utils/audit';
import {
  CreateRecordSchema,
  UpdateRecordSchema,
  ChangeRecordStatusSchema,
  CreateNoteSchema,
  AddDependencySchema,
} from '@eurochoice/shared';

export async function listRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const {
      search,
      status,
      department,
      client,
      type,
      area,
      job,
      dateFrom,
      dateTo,
      sort,
    } = req.query as Record<string, string>;

    const filter: any = {};

    // Search partial match on uniqueId or clientNameCache or shortText
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { uniqueId: regex },
        { clientNameCache: regex },
        { shortText: regex },
      ];
    }

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (client) filter.client = client;
    if (type) filter.type = type;
    if (area) filter.area = area;
    if (job) filter.job = job;

    if (dateFrom || dateTo) {
      filter.submissionDate = {};
      if (dateFrom) filter.submissionDate.$gte = new Date(dateFrom);
      if (dateTo) filter.submissionDate.$lte = new Date(dateTo);
    }

    let sortOption: any = { endDate: 1 };
    switch (sort) {
      case 'nameAsc':
        sortOption = { clientNameCache: 1 };
        break;
      case 'nameDesc':
        sortOption = { clientNameCache: -1 };
        break;
      case 'submissionDateAsc':
        sortOption = { submissionDate: 1 };
        break;
      case 'submissionDateDesc':
        sortOption = { submissionDate: -1 };
        break;
      case 'endDateAsc':
        sortOption = { endDate: 1 };
        break;
      case 'endDateDesc':
        sortOption = { endDate: -1 };
        break;
      case 'statusOrder':
        // status populated sorting
        sortOption = { status: 1 };
        break;
    }

    const total = await RecordModel.countDocuments(filter);
    const records = await RecordModel.find(filter)
      .populate('client', 'name email company')
      .populate('department', 'name')
      .populate('type', 'name')
      .populate('area', 'name')
      .populate('job', 'name')
      .populate('status')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      data: records,
      total,
      page,
      pageCount: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPlanningTomorrow(req: Request, res: Response, next: NextFunction) {
  try {
    const { department, area, job } = req.query as Record<string, string>;

    const terminalStatuses = await Status.find({ isTerminal: true }).select('_id');
    const terminalIds = terminalStatuses.map((s) => s._id);

    const filter: any = {
      status: { $nin: terminalIds },
      isExpired: false,
    };

    if (department) filter.department = department;
    if (area) filter.area = area;
    if (job) filter.job = job;

    const records = await RecordModel.find(filter)
      .populate('client', 'name email company')
      .populate('department', 'name')
      .populate('type', 'name')
      .populate('area', 'name')
      .populate('job', 'name')
      .populate('status')
      .sort({ endDate: 1 });

    const now = new Date();
    const withOverdue = records.map((doc) => {
      const obj = doc.toObject();
      return {
        ...obj,
        isOverdue: new Date(doc.endDate).getTime() < now.getTime(),
      };
    });

    return res.status(200).json({ data: withOverdue });
  } catch (error) {
    next(error);
  }
}

export async function getRecordById(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await RecordModel.findById(req.params.id)
      .populate('client')
      .populate('department')
      .populate('type')
      .populate('area')
      .populate('job')
      .populate('status')
      .populate('createdBy', 'name email')
      .populate({
        path: 'dependencies',
        populate: [{ path: 'status' }, { path: 'client', select: 'name' }],
      });

    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');
    return res.status(200).json(record);
  } catch (error) {
    next(error);
  }
}

export async function createRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateRecordSchema.parse(req.body);

    const clientDoc = await Client.findById(data.client);
    if (!clientDoc) throw new AppError('Selected client not found', 400, 'INVALID_CLIENT');

    let statusId = data.status;
    if (!statusId) {
      const defaultStatus = await Status.findOne({ name: 'Open' });
      statusId = defaultStatus?._id.toString();
    }

    const settings = await getSystemSettings();
    const submissionDate = new Date(data.submissionDate);
    const expiresAt = new Date(submissionDate);
    expiresAt.setDate(expiresAt.getDate() + settings.expirationPeriodDays);

    // Validate custom fields
    const validatedCustomFields = await validateCustomFieldValues(
      'record',
      data.customFieldValues || []
    );

    // Atomic Unique ID generation
    const uniqueId = await generateUniqueRecordId();

    const record = await RecordModel.create({
      uniqueId,
      client: data.client,
      clientNameCache: clientDoc.name,
      department: data.department,
      type: data.type,
      area: data.area,
      job: data.job,
      status: statusId,
      submissionDate,
      endDate: new Date(data.endDate),
      shortText: data.shortText,
      longText: data.longText || '',
      customFieldValues: validatedCustomFields,
      dependencies: data.dependencies || [],
      createdBy: req.user?._id,
      expiresAt,
      isExpired: false,
    });

    await logActionHistory({
      recordId: record._id.toString(),
      clientId: clientDoc._id.toString(),
      action: 'created',
      userId: req.user?._id,
      meta: { uniqueId, shortText: record.shortText },
    });

    const populated = await RecordModel.findById(record._id)
      .populate('client')
      .populate('department')
      .populate('type')
      .populate('area')
      .populate('job')
      .populate('status');

    return res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

export async function updateRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateRecordSchema.parse(req.body);
    const record = await RecordModel.findById(req.params.id);
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');

    if (data.client && data.client !== record.client.toString()) {
      const clientDoc = await Client.findById(data.client);
      if (!clientDoc) throw new AppError('Selected client not found', 400);
      record.client = data.client as any;
      record.clientNameCache = clientDoc.name;
    }

    if (data.customFieldValues !== undefined) {
      record.customFieldValues = (await validateCustomFieldValues('record', data.customFieldValues)) as any;
    }

    if (data.department) record.department = data.department as any;
    if (data.type) record.type = data.type as any;
    if (data.area) record.area = data.area as any;
    if (data.job) record.job = data.job as any;
    if (data.shortText) record.shortText = data.shortText;
    if (data.longText !== undefined) record.longText = data.longText;
    if (data.endDate) record.endDate = new Date(data.endDate);

    await record.save();

    await logActionHistory({
      recordId: record._id.toString(),
      clientId: record.client.toString(),
      action: 'updated',
      userId: req.user?._id,
      meta: { updatedFields: Object.keys(data) },
    });

    const populated = await RecordModel.findById(record._id)
      .populate('client')
      .populate('department')
      .populate('type')
      .populate('area')
      .populate('job')
      .populate('status');

    return res.status(200).json(populated);
  } catch (error) {
    next(error);
  }
}

export async function deleteRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await RecordModel.findById(req.params.id);
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');

    const clientId = record.client.toString();
    const uniqueId = record.uniqueId;

    await RecordModel.findByIdAndDelete(req.params.id);

    await logActionHistory({
      clientId,
      action: 'deleted',
      userId: req.user?._id,
      meta: { uniqueId, recordId: req.params.id },
    });

    return res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function changeRecordStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { statusId, note } = ChangeRecordStatusSchema.parse(req.body);

    const record = await RecordModel.findById(req.params.id).populate('status');
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');

    const newStatus = await Status.findById(statusId);
    if (!newStatus) throw new AppError('Target status does not exist', 400, 'INVALID_STATUS');

    const oldStatusObj = record.status as any;
    const oldStatusName = oldStatusObj ? oldStatusObj.name : 'Unknown';

    record.status = newStatus._id;
    if (newStatus.name === 'Expired') {
      record.isExpired = true;
    } else if (!newStatus.isTerminal) {
      record.isExpired = false;
    }
    await record.save();

    // Log atomic audit history
    await logActionHistory({
      recordId: record._id.toString(),
      clientId: record.client.toString(),
      action: 'status_changed',
      userId: req.user?._id,
      meta: {
        from: oldStatusName,
        to: newStatus.name,
        fromId: oldStatusObj?._id,
        toId: newStatus._id,
        note: note || '',
      },
    });

    if (note && note.trim()) {
      await Note.create({
        record: record._id,
        content: `Status changed from "${oldStatusName}" to "${newStatus.name}": ${note.trim()}`,
        user: req.user?._id,
      });
    }

    const populated = await RecordModel.findById(record._id).populate('status');
    return res.status(200).json(populated);
  } catch (error) {
    next(error);
  }
}

export async function addRecordNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { content } = CreateNoteSchema.parse(req.body);
    const record = await RecordModel.findById(req.params.id);
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');

    const note = await Note.create({
      record: record._id,
      content: content.trim(),
      user: req.user?._id,
    });

    await logActionHistory({
      recordId: record._id.toString(),
      clientId: record.client.toString(),
      action: 'note_added',
      userId: req.user?._id,
      meta: { noteId: note._id },
    });

    const populated = await Note.findById(note._id).populate('user', 'name email');
    return res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

export async function getRecordNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const notes = await Note.find({ record: req.params.id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: notes });
  } catch (error) {
    next(error);
  }
}

export async function getRecordHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const history = await ActionHistory.find({ record: req.params.id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: history });
  } catch (error) {
    next(error);
  }
}

export async function addRecordDependency(req: Request, res: Response, next: NextFunction) {
  try {
    const { dependsOnId } = AddDependencySchema.parse(req.body);
    const record = await RecordModel.findById(req.params.id);
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');

    const targetRecord = await RecordModel.findById(dependsOnId);
    if (!targetRecord) throw new AppError('Target dependency record not found', 404, 'NOT_FOUND');

    // Cycle check
    await detectCircularDependency(req.params.id, dependsOnId);

    const depIdStr = targetRecord._id.toString();
    const alreadyDepends = record.dependencies.some((d) => d.toString() === depIdStr);
    if (alreadyDepends) {
      throw new AppError('This dependency has already been added', 400, 'DUPLICATE_DEPENDENCY');
    }

    record.dependencies.push(targetRecord._id);
    await record.save();

    await logActionHistory({
      recordId: record._id.toString(),
      action: 'dependency_added',
      userId: req.user?._id,
      meta: {
        dependsOnId: targetRecord._id,
        dependsOnUniqueId: targetRecord.uniqueId,
      },
    });

    return res.status(200).json({
      message: 'Dependency added successfully',
      dependencies: record.dependencies,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeRecordDependency(req: Request, res: Response, next: NextFunction) {
  try {
    const { dependencyId } = req.params;
    const record = await RecordModel.findById(req.params.id);
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');

    record.dependencies = record.dependencies.filter(
      (d) => d.toString() !== dependencyId
    );
    await record.save();

    await logActionHistory({
      recordId: record._id.toString(),
      action: 'dependency_removed',
      userId: req.user?._id,
      meta: { dependencyId },
    });

    return res.status(200).json({
      message: 'Dependency removed successfully',
      dependencies: record.dependencies,
    });
  } catch (error) {
    next(error);
  }
}
