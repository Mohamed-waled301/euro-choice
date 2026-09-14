import { Request, Response, NextFunction } from 'express';
import { RecordModel } from '../../models/Record';
import { Status } from '../../models/Status';
import { ActionHistory } from '../../models/ActionHistory';

export async function getDashboardSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const statuses = await Status.find();
    const statusMap = new Map<string, string>();
    const terminalIds: any[] = [];

    statuses.forEach((s) => {
      statusMap.set(s._id.toString(), s.name);
      if (s.isTerminal) {
        terminalIds.push(s._id);
      }
    });

    const now = new Date();
    const inTwoDays = new Date();
    inTwoDays.setDate(inTwoDays.getDate() + 2);

    const [aggregateResult] = await RecordModel.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          expiringSoon: [
            {
              $match: {
                expiresAt: { $gte: now, $lte: inTwoDays },
                isExpired: false,
                status: { $nin: terminalIds },
              },
            },
            { $count: 'count' },
          ],
          planningTomorrow: [
            {
              $match: {
                status: { $nin: terminalIds },
                isExpired: false,
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const total = aggregateResult?.total?.[0]?.count || 0;
    const expiringSoon = aggregateResult?.expiringSoon?.[0]?.count || 0;
    const planningTomorrowCount = aggregateResult?.planningTomorrow?.[0]?.count || 0;

    const byStatus: Record<string, number> = {
      Open: 0,
      'In Progress': 0,
      Pending: 0,
      Completed: 0,
      Expired: 0,
    };

    if (aggregateResult?.byStatus) {
      for (const item of aggregateResult.byStatus) {
        const name = statusMap.get(item._id?.toString()) || 'Other';
        byStatus[name] = (byStatus[name] || 0) + item.count;
      }
    }

    const recentActivity = await ActionHistory.find()
      .populate('user', 'name email')
      .populate('record', 'uniqueId shortText')
      .populate('client', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      total,
      byStatus,
      expiringSoon,
      planningTomorrowCount,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
}
