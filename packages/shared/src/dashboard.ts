import { z } from 'zod';

export const ActionHistorySchema = z.object({
  _id: z.string().optional(),
  record: z.any().optional().nullable(),
  client: z.any().optional().nullable(),
  action: z.string(),
  user: z.any().optional().nullable(),
  meta: z.any().optional(),
  createdAt: z.string().or(z.date()).optional(),
});
export type ActionHistoryDTO = z.infer<typeof ActionHistorySchema>;

export const DashboardSummarySchema = z.object({
  total: z.number(),
  byStatus: z.record(z.string(), z.number()),
  expiringSoon: z.number(),
  planningTomorrowCount: z.number(),
  recentActivity: z.array(ActionHistorySchema),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
