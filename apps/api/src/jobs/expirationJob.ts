import cron from 'node-cron';
import { RecordModel } from '../models/Record';
import { Status } from '../models/Status';
import { ActionHistory } from '../models/ActionHistory';
import { config } from '../config/env';
import { logger } from '../config/logger';

export async function runExpirationSweep(): Promise<{ expiredCount: number }> {
  const now = new Date();

  // Find the system 'Expired' status
  let expiredStatus = await Status.findOne({ name: 'Expired' });
  if (!expiredStatus) {
    expiredStatus = await Status.findOne({ isTerminal: true });
  }
  if (!expiredStatus) {
    logger.warn('No Expired or terminal status found for expiration job');
    return { expiredCount: 0 };
  }

  // Find all terminal status IDs (e.g. Completed, Expired)
  const terminalStatuses = await Status.find({ isTerminal: true }).select('_id');
  const terminalIds = terminalStatuses.map((s) => s._id);

  // Find records that are due to expire
  const recordsToExpire = await RecordModel.find({
    expiresAt: { $lte: now },
    status: { $nin: terminalIds },
    isExpired: false,
  }).select('_id uniqueId status');

  if (recordsToExpire.length === 0) {
    return { expiredCount: 0 };
  }

  const recordIds = recordsToExpire.map((r) => r._id);

  // Bulk update records
  await RecordModel.updateMany(
    { _id: { $in: recordIds } },
    {
      $set: {
        isExpired: true,
        status: expiredStatus._id,
      },
    }
  );

  // Write ActionHistory entries
  const historyEntries = recordsToExpire.map((rec) => ({
    record: rec._id,
    action: 'expired',
    user: null, // System automated action
    meta: {
      fromStatus: rec.status,
      toStatus: expiredStatus._id,
      reason: 'Automatic expiration job',
      timestamp: now,
    },
    createdAt: now,
  }));

  await ActionHistory.insertMany(historyEntries);

  logger.info(
    { count: recordsToExpire.length },
    'Expiration sweep completed successfully: records marked expired'
  );

  return { expiredCount: recordsToExpire.length };
}

let cronTask: cron.ScheduledTask | null = null;

export function startExpirationCron(): void {
  if (cronTask) {
    cronTask.stop();
  }

  cronTask = cron.schedule(config.expirationCronSchedule, async () => {
    try {
      await runExpirationSweep();
    } catch (error) {
      logger.error({ error }, 'Error during scheduled expiration sweep');
    }
  });

  logger.info(`Expiration cron job scheduled: ${config.expirationCronSchedule}`);
}

export function stopExpirationCron(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
}
