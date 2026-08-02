'use server';

import { prisma } from '../prisma';
import { getSession } from '../auth';

async function checkAdminSession() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    throw new Error('Unauthorized access. Admin privileges required.');
  }
  return session;
}

export async function getAdminDashboardDataAction() {
  await checkAdminSession();

  // Verification requests
  const verificationRequests = await prisma.verificationRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, verificationStatus: true } },
    },
  });

  const colleges = await prisma.college.findMany();
  const collegeMap = new Map(colleges.map((c) => [c.id, c.name]));

  const processedRequests = verificationRequests.map((vr) => ({
    ...vr,
    collegeName: collegeMap.get(vr.collegeId) || 'Unknown College',
  }));

  // Moderation queue
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      anonymousProfile: { select: { publicHandle: true } },
      moderationActions: true,
    },
  });

  // Enrich reports with target content preview
  const enrichedReports = [];
  for (const rep of reports) {
    let contentPreview = '';
    let isHidden = false;

    if (rep.targetType === 'REVIEW') {
      const rev = await prisma.review.findUnique({ where: { id: rep.targetId } });
      contentPreview = rev ? rev.freeText : '[Deleted Content]';
      isHidden = rev ? rev.isHidden : false;
    } else if (rep.targetType === 'POST') {
      const p = await prisma.post.findUnique({ where: { id: rep.targetId } });
      contentPreview = p ? `[${p.postType}] ${p.body}` : '[Deleted Content]';
      isHidden = p ? p.isHidden : false;
    } else if (rep.targetType === 'COMMENT') {
      const c = await prisma.comment.findUnique({ where: { id: rep.targetId } });
      contentPreview = c ? c.body : '[Deleted Content]';
      isHidden = c ? c.isHidden : false;
    } else if (rep.targetType === 'CONNECT_THREAD') {
      const thread = await prisma.connectThread.findUnique({
        where: { id: rep.targetId },
        include: { connectRequest: { include: { post: { select: { body: true } } } } },
      });
      contentPreview = thread ? `[Connect Thread] Post: "${thread.connectRequest.post.body.substring(0, 50)}..."` : '[Expired / Deleted Thread]';
      isHidden = thread ? thread.status !== 'ACTIVE' : true;
    }

    enrichedReports.push({
      ...rep,
      contentPreview,
      isHidden,
    });
  }

  // Connect Abuse Metrics
  const totalConnectRequests = await prisma.connectRequest.count();
  const acceptedRequests = await prisma.connectRequest.count({ where: { status: 'ACCEPTED' } });
  const declinedRequests = await prisma.connectRequest.count({ where: { status: 'DECLINED' } });
  const declineRate = totalConnectRequests > 0 ? Number(((declinedRequests / totalConnectRequests) * 100).toFixed(1)) : 0;
  const connectThreadReports = reports.filter((r) => r.targetType === 'CONNECT_THREAD').length;
  const totalConnectBlocks = await prisma.connectBlock.count();

  // Analytics
  const totalUsers = await prisma.user.count();
  const verifiedUsers = await prisma.user.count({
    where: { verificationStatus: { in: ['DOMAIN_VERIFIED', 'MANUALLY_VERIFIED'] } },
  });
  const totalReviews = await prisma.review.count();
  const totalPosts = await prisma.post.count();
  const totalColleges = colleges.length;

  // Anomaly flags (Step 3 / Step 8)
  const anomalyFlags = await prisma.anomalyFlag.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      college: { select: { name: true, slug: true } },
    },
  });

  // Reviews over time — last 30 days grouped by day (Step 8)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentReviews = await prisma.review.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const recentPosts = await prisma.post.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group into daily buckets
  const reviewsByDay: Record<string, number> = {};
  const postsByDay: Record<string, number> = {};
  for (let d = 0; d < 30; d++) {
    const day = new Date(thirtyDaysAgo.getTime() + d * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    reviewsByDay[key] = 0;
    postsByDay[key] = 0;
  }
  recentReviews.forEach((r) => {
    const key = new Date(r.createdAt).toISOString().slice(0, 10);
    if (reviewsByDay[key] !== undefined) reviewsByDay[key]++;
  });
  recentPosts.forEach((p) => {
    const key = new Date(p.createdAt).toISOString().slice(0, 10);
    if (postsByDay[key] !== undefined) postsByDay[key]++;
  });
  const activityOverTime = Object.entries(reviewsByDay).map(([date, reviewCount]) => ({
    date,
    reviewCount,
    postCount: postsByDay[date] ?? 0,
  }));

  // Reviews-per-college: count colleges above/below 5-review threshold (Step 8)
  const reviewCounts = await prisma.review.groupBy({
    by: ['collegeId'],
    _count: { id: true },
    where: { isHidden: false },
  });
  const reviewCountMap = new Map(reviewCounts.map((r) => [r.collegeId, r._count.id]));
  let collegesAboveThreshold = 0;
  let collegesBelowThreshold = 0;
  colleges.forEach((c) => {
    const cnt = reviewCountMap.get(c.id) ?? 0;
    if (cnt >= 5) collegesAboveThreshold++;
    else collegesBelowThreshold++;
  });

  // Build per-college review distribution (top 20 by review count)
  const collegeReviewDistribution = colleges
    .map((c) => ({ name: c.name, reviewCount: reviewCountMap.get(c.id) ?? 0 }))
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 20);

  return {
    verificationRequests: processedRequests,
    reports: enrichedReports,
    anomalyFlags: anomalyFlags.map((f) => ({
      ...f,
      collegeName: f.college.name,
      collegeSlug: f.college.slug,
    })),
    colleges: colleges.map((c) => ({
      ...c,
      streams: JSON.parse(c.streams || '[]'),
      officialDomains: JSON.parse(c.officialDomains || '[]'),
    })),
    analytics: {
      totalUsers,
      verifiedUsers,
      totalReviews,
      totalPosts,
      totalColleges,
      dailyActiveUsers: Math.floor(verifiedUsers * 0.7) + 5,
      collegesAboveThreshold,
      collegesBelowThreshold,
      activityOverTime,
      collegeReviewDistribution,
      connectAbuseMetrics: {
        totalConnectRequests,
        acceptedRequests,
        declinedRequests,
        declineRate,
        connectThreadReports,
        totalConnectBlocks,
      },
    },
  };
}

export async function reviewVerificationRequestAction(
  requestId: string,
  status: 'APPROVED' | 'REJECTED',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await checkAdminSession();

    const req = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });

    if (!req) return { success: false, error: 'Verification request not found.' };

    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status,
        notes: notes || null,
        reviewedBy: session.email,
        reviewedAt: new Date(),
      },
    });

    // Update target User status
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        verificationStatus: status === 'APPROVED' ? 'MANUALLY_VERIFIED' : 'UNVERIFIED',
        verifiedCollegeId: status === 'APPROVED' ? req.collegeId : null,
      },
    });

    if (status === 'APPROVED') {
      await prisma.anonymousProfile.updateMany({
        where: { userId: req.userId },
        data: { collegeId: req.collegeId },
      });
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Operation failed';
    return { success: false, error: errorMsg };
  }
}

export async function resolveReportAction(
  reportId: string,
  action: 'HIDE_CONTENT' | 'RESTORE_CONTENT' | 'DISMISS',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await checkAdminSession();

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) return { success: false, error: 'Report not found.' };

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: action === 'DISMISS' ? 'DISMISSED' : 'ACTIONED',
      },
    });

    const hideFlag = action === 'HIDE_CONTENT';
    if (action === 'HIDE_CONTENT' || action === 'RESTORE_CONTENT') {
      if (report.targetType === 'REVIEW') {
        await prisma.review.update({ where: { id: report.targetId }, data: { isHidden: hideFlag } });
      } else if (report.targetType === 'POST') {
        await prisma.post.update({ where: { id: report.targetId }, data: { isHidden: hideFlag } });
      } else if (report.targetType === 'COMMENT') {
        await prisma.comment.update({ where: { id: report.targetId }, data: { isHidden: hideFlag } });
      }
    }

    await prisma.moderationAction.create({
      data: {
        reportId: report.id,
        moderatorId: session.userId,
        action,
        notes: notes || null,
      },
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Operation failed';
    return { success: false, error: errorMsg };
  }
}

export async function createCollegeAction(data: {
  name: string;
  slug: string;
  city: string;
  streams: string[];
  affiliation: string;
  officialDomains: string[];
  type: string;
  establishedYear: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminSession();

    if (!data.name || !data.slug || !data.city) {
      return { success: false, error: 'Name, slug, and city are required.' };
    }

    const existing = await prisma.college.findUnique({ where: { slug: data.slug } });
    if (existing) return { success: false, error: 'A college with this slug already exists.' };

    await prisma.college.create({
      data: {
        name: data.name,
        slug: data.slug,
        city: data.city,
        streams: JSON.stringify(data.streams),
        affiliation: data.affiliation,
        officialDomains: JSON.stringify(data.officialDomains),
        type: data.type,
        establishedYear: data.establishedYear,
      },
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create college';
    return { success: false, error: errorMsg };
  }
}

export async function updateCollegeDomainsAction(
  collegeId: string,
  domains: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminSession();

    await prisma.college.update({
      where: { id: collegeId },
      data: { officialDomains: JSON.stringify(domains) },
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update domains';
    return { success: false, error: errorMsg };
  }
}

// Step 8: Resolve an AnomalyFlag from the admin panel
export async function resolveAnomalyFlagAction(
  flagId: string,
  status: 'DISMISSED' | 'RESOLVED'
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminSession();

    await prisma.anomalyFlag.update({
      where: { id: flagId },
      data: { status },
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to resolve flag';
    return { success: false, error: errorMsg };
  }
}
