import { ClientSession } from 'mongoose';
import { ActionHistory, IActionHistory } from '../models/ActionHistory';
import { logger } from '../config/logger';

export interface RecordAuditParams {
  recordId?: string;
  clientId?: string;
  action: string;
  userId?: string | null;
  meta?: any;
  session?: ClientSession;
}

export async function logActionHistory({
  recordId,
  clientId,
  action,
  userId,
  meta,
  session,
}: RecordAuditParams): Promise<IActionHistory> {
  try {
    const doc = new ActionHistory({
      record: recordId,
      client: clientId,
      action,
      user: userId || null,
      meta,
    });
    await doc.save({ session });
    return doc;
  } catch (error) {
    logger.error({ error, action, recordId }, 'Failed to write ActionHistory audit entry');
    throw error;
  }
}
