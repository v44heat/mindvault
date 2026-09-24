import { asyncHandler } from "@utils/asyncHandler";
import { AuthenticatedRequest } from "@middleware/auth.middleware";
import {
  getDashboardOverview,
  getMoodAndContentAnalytics,
  getActivityAnalytics,
  AnalyticsRange,
} from "@services/analytics.service";

const VALID_RANGES: AnalyticsRange[] = ["7d", "30d", "3m", "6m", "1y", "all"];

function parseRange(value: unknown): AnalyticsRange {
  return VALID_RANGES.includes(value as AnalyticsRange) ? (value as AnalyticsRange) : "30d";
}

export const overview = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const data = await getDashboardOverview(req.userId!);
  res.status(200).json({ success: true, data });
});

export const mood = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const range = parseRange(req.query.range);
  const data = await getMoodAndContentAnalytics(req.userId!, range);
  res.status(200).json({ success: true, data: { ...data, range } });
});

export const activity = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const range = parseRange(req.query.range);
  const data = await getActivityAnalytics(req.userId!, range);
  res.status(200).json({ success: true, data: { ...data, range } });
});
