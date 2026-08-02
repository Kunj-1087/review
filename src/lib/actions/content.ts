'use server';

import { prisma } from '../prisma';
import { getSession } from '../auth';
import { sendNotification } from './notification';
import { CATEGORY_WEIGHTS, PostWithRelations } from '../types';
import { checkReviewQuality } from '../quality-flags';
import { shouldRegenerateSummary, generateCollegeSummary } from '../summary';

export async function getCollegeStats(collegeId: string) {
  const reviews = await prisma.review.findMany({
    where: { collegeId, isHidden: false },
  });

  const reviewCount = reviews.length;
  if (reviewCount < 5) {
    return {
      reviewCount,
      hasEnoughReviews: false,
      overallRating: null,
      categoryAverages: null,
    };
  }

  const categoryTotals = {
    academics: 0,
    placements: 0,
    infrastructure: 0,
    hostel: 0,
    feesValue: 0,
    facultySupport: 0,
    campusLife: 0,
    safety: 0,
  };

  reviews.forEach((r) => {
    categoryTotals.academics += r.academics;
    categoryTotals.placements += r.placements;
    categoryTotals.infrastructure += r.infrastructure;
    categoryTotals.hostel += r.hostel;
    categoryTotals.feesValue += r.feesValue;
    categoryTotals.facultySupport += r.facultySupport;
    categoryTotals.campusLife += r.campusLife;
    categoryTotals.safety += r.safety;
  });

  const categoryAverages = {
    academics: Number((categoryTotals.academics / reviewCount).toFixed(1)),
    placements: Number((categoryTotals.placements / reviewCount).toFixed(1)),
    infrastructure: Number((categoryTotals.infrastructure / reviewCount).toFixed(1)),
    hostel: Number((categoryTotals.hostel / reviewCount).toFixed(1)),
    feesValue: Number((categoryTotals.feesValue / reviewCount).toFixed(1)),
    facultySupport: Number((categoryTotals.facultySupport / reviewCount).toFixed(1)),
    campusLife: Number((categoryTotals.campusLife / reviewCount).toFixed(1)),
    safety: Number((categoryTotals.safety / reviewCount).toFixed(1)),
  };

  const weightedOverallSum =
    categoryAverages.academics * CATEGORY_WEIGHTS.academics +
    categoryAverages.placements * CATEGORY_WEIGHTS.placements +
    categoryAverages.infrastructure * CATEGORY_WEIGHTS.infrastructure +
    categoryAverages.facultySupport * CATEGORY_WEIGHTS.facultySupport +
    categoryAverages.feesValue * CATEGORY_WEIGHTS.feesValue +
    categoryAverages.hostel * CATEGORY_WEIGHTS.hostel +
    categoryAverages.campusLife * CATEGORY_WEIGHTS.campusLife +
    categoryAverages.safety * CATEGORY_WEIGHTS.safety;

  const overallRating = Number(weightedOverallSum.toFixed(1));

  return {
    reviewCount,
    hasEnoughReviews: true,
    overallRating,
    categoryAverages,
  };
}

// Advanced Search & Filter Action
export async function getCollegesAction({
  search,
  city,
  stream,
  ratingRange,
  type,
  sortBy = 'name',
}: {
  search?: string;
  city?: string;
  stream?: string;
  ratingRange?: string;
  type?: string;
  sortBy?: 'name' | 'rating' | 'reviews' | 'recent';
} = {}) {
  const colleges = await prisma.college.findMany({
    orderBy: { name: 'asc' },
  });

  const results = [];
  for (const c of colleges) {
    let streams: string[] = [];
    let officialDomains: string[] = [];
    try {
      streams = JSON.parse(c.streams);
      officialDomains = JSON.parse(c.officialDomains);
    } catch {
      streams = [];
      officialDomains = [];
    }

    // Fuzzy search matching name & city
    if (search) {
      const q = search.toLowerCase().trim();
      const matchName = c.name.toLowerCase().includes(q);
      const matchCity = c.city.toLowerCase().includes(q);
      const matchSlug = c.slug.toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchSlug) continue;
    }

    // Filters
    if (city && city !== 'ALL' && c.city.toLowerCase() !== city.toLowerCase()) continue;
    if (type && type !== 'ALL' && c.type.toUpperCase() !== type.toUpperCase()) continue;
    if (stream && stream !== 'ALL' && !streams.some(s => s.toLowerCase().includes(stream.toLowerCase()))) continue;

    const stats = await getCollegeStats(c.id);

    // Rating Range Filter
    if (ratingRange && ratingRange !== 'ALL') {
      if (ratingRange === 'UNLOCKED' && !stats.hasEnoughReviews) continue;
      if (ratingRange === '4_PLUS') {
        if (!stats.hasEnoughReviews || !stats.overallRating || stats.overallRating < 4.0) continue;
      }
      if (ratingRange === '3_PLUS') {
        if (!stats.hasEnoughReviews || !stats.overallRating || stats.overallRating < 3.0) continue;
      }
    }

    results.push({
      ...c,
      streams,
      officialDomains,
      stats,
    });
  }

  // Sort Options
  if (sortBy === 'rating') {
    results.sort((a, b) => (b.stats.overallRating || 0) - (a.stats.overallRating || 0));
  } else if (sortBy === 'reviews') {
    results.sort((a, b) => b.stats.reviewCount - a.stats.reviewCount);
  } else if (sortBy === 'recent') {
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return results;
}

export async function getCollegeBySlugAction(slug: string) {
  const college = await prisma.college.findUnique({
    where: { slug },
  });

  if (!college) return null;

  let streams: string[] = [];
  let officialDomains: string[] = [];
  try {
    streams = JSON.parse(college.streams);
    officialDomains = JSON.parse(college.officialDomains);
  } catch {
    streams = [];
    officialDomains = [];
  }

  const stats = await getCollegeStats(college.id);

  // Fetch reviews ordered by helpfulCount desc by default
  const reviews = await prisma.review.findMany({
    where: { collegeId: college.id, isHidden: false },
    orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
    include: {
      anonymousProfile: {
        select: {
          id: true,
          publicHandle: true,
          batchYear: true,
        },
      },
      helpfulVotes: {
        select: { anonymousProfileId: true },
      },
    },
  });

  // Fetch public posts
  const rawPosts = await prisma.post.findMany({
    where: { collegeId: college.id, isHidden: false },
    orderBy: { createdAt: 'desc' },
    include: {
      anonymousProfile: {
        select: {
          id: true,
          publicHandle: true,
          batchYear: true,
        },
      },
      images: true,
    },
  });

  const posts = rawPosts.map((p) => {
    let rolesNeededParsed: string[] = [];
    let skillsNeededParsed: string[] = [];
    try {
      if (p.rolesNeeded) rolesNeededParsed = JSON.parse(p.rolesNeeded);
    } catch {}
    try {
      if (p.skillsNeeded) skillsNeededParsed = JSON.parse(p.skillsNeeded);
    } catch {}

    return {
      ...p,
      rolesNeededParsed,
      skillsNeededParsed,
    };
  });

  const votes = await prisma.vote.findMany({
    where: { targetType: { in: ['REVIEW', 'POST'] } },
  });

  const comments = await prisma.comment.findMany({
    where: { isHidden: false },
    orderBy: { createdAt: 'asc' },
    include: {
      anonymousProfile: { select: { publicHandle: true } },
    },
  });

  // FEATURE 3: Fetch persisted review summary (if generated at a threshold milestone)
  const rawSummary = await prisma.collegeSummary.findUnique({
    where: { collegeId: college.id },
  });
  const collegeSummary = rawSummary
    ? {
        pros: JSON.parse(rawSummary.pros) as string[],
        cons: JSON.parse(rawSummary.cons) as string[],
        generatedAt: rawSummary.generatedAt,
        atReviewCount: rawSummary.atReviewCount,
      }
    : null;

  return {
    ...college,
    streams,
    officialDomains,
    stats,
    reviews,
    posts: posts as unknown as PostWithRelations[],
    votes,
    comments,
    collegeSummary,
  };
}

// Fetch Colleges by IDs for Comparison Tool
export async function getCollegesByIdsAction(ids: string[]) {
  if (!ids || ids.length === 0) return [];

  const colleges = await prisma.college.findMany({
    where: { id: { in: ids } },
  });

  const results = [];
  for (const c of colleges) {
    let streams: string[] = [];
    let officialDomains: string[] = [];
    try {
      streams = JSON.parse(c.streams);
      officialDomains = JSON.parse(c.officialDomains);
    } catch {
      streams = [];
      officialDomains = [];
    }

    const stats = await getCollegeStats(c.id);

    results.push({
      ...c,
      streams,
      officialDomains,
      stats,
    });
  }

  return results;
}

// STEP 1 & STEP 3: Review Submission Action with Verification Check, Cooldown & Anomaly Detection
export async function submitReviewAction(
  collegeId: string,
  scores: {
    academics: number;
    placements: number;
    infrastructure: number;
    hostel: number;
    feesValue: number;
    facultySupport: number;
    campusLife: number;
    safety: number;
  },
  freeText: string
) {
  const session = await getSession();
  if (!session) return { success: false, error: 'You must be logged in to submit a review.' };

  // Verification Status Check
  if (session.verificationStatus !== 'DOMAIN_VERIFIED' && session.verificationStatus !== 'MANUALLY_VERIFIED') {
    return {
      success: false,
      error: 'Only verified students can submit reviews. Please verify your student identity first.',
    };
  }

  // College-Specific Verification Check
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { verifiedCollegeId: true },
  });

  if (user?.verifiedCollegeId && user.verifiedCollegeId !== collegeId) {
    const targetCollege = await prisma.college.findUnique({ where: { id: collegeId }, select: { name: true } });
    return {
      success: false,
      error: `Your account is verified for a different institution. You can only rate your own verified college (${targetCollege?.name || 'this college'}).`,
    };
  }

  // Free-Text Character Minimum Check
  if (!freeText || freeText.trim().length < 50) {
    return {
      success: false,
      error: 'Your review must be at least 50 characters long to provide meaningful, constructive feedback.',
    };
  }

  // Rate Limiting Cooldown Check (2 minutes)
  const profile = await prisma.anonymousProfile.findUnique({
    where: { id: session.anonymousProfileId },
    select: { lastSubmissionAt: true },
  });

  if (profile?.lastSubmissionAt) {
    const elapsedMs = Date.now() - new Date(profile.lastSubmissionAt).getTime();
    if (elapsedMs < 120 * 1000) { // 2 minutes
      const remainingSec = Math.ceil((120 * 1000 - elapsedMs) / 1000);
      return {
        success: false,
        error: `Submission cooldown active. Please wait ${remainingSec} seconds before submitting another review or post.`,
      };
    }
  }

  // Record review count prior to submission for threshold unlock trigger
  const reviewsBefore = await prisma.review.count({ where: { collegeId, isHidden: false } });

  // Upsert review (enforcing 1 review per anonymousProfileId & collegeId at database level)
  const review = await prisma.review.upsert({
    where: {
      anonymousProfileId_collegeId: {
        anonymousProfileId: session.anonymousProfileId,
        collegeId,
      },
    },
    update: {
      academics: scores.academics,
      placements: scores.placements,
      infrastructure: scores.infrastructure,
      hostel: scores.hostel,
      feesValue: scores.feesValue,
      facultySupport: scores.facultySupport,
      campusLife: scores.campusLife,
      safety: scores.safety,
      freeText: freeText.trim(),
      editedAt: new Date(),
    },
    create: {
      anonymousProfileId: session.anonymousProfileId,
      collegeId,
      academics: scores.academics,
      placements: scores.placements,
      infrastructure: scores.infrastructure,
      hostel: scores.hostel,
      feesValue: scores.feesValue,
      facultySupport: scores.facultySupport,
      campusLife: scores.campusLife,
      safety: scores.safety,
      freeText: freeText.trim(),
    },
  });

  // Update rate limiting submission timestamp
  await prisma.anonymousProfile.update({
    where: { id: session.anonymousProfileId },
    data: { lastSubmissionAt: new Date() },
  });

  // FEATURE 2: AI-Assisted Review Quality Flagging
  // Run post-submission quality checks. We do this AFTER the upsert so the
  // review is always persisted (no silent drops). Flagged reviews appear in
  // the human moderation queue via a Report record.
  try {
    const qualityResult = await checkReviewQuality(
      freeText.trim(),
      collegeId,
      session.anonymousProfileId // passed as excludeProfileId — NOT userId
    );
    if (qualityResult.isDuplicate || qualityResult.isGeneric) {
      await prisma.report.create({
        data: {
          anonymousProfileId: session.anonymousProfileId,
          targetType: 'REVIEW',
          targetId: review.id,
          reason: `AUTO_QUALITY_FLAG: ${qualityResult.flagReason}`,
          status: 'PENDING',
        },
      });
    }
  } catch (err) {
    // Non-fatal: quality check failure must not block review submission
    console.error('[Quality Flag] Check failed (non-fatal):', err);
  }

  // STEP 3: Anomaly Burst Detection
  // Detect if this college received >=3 reviews in the last 1 hour from accounts created in the last 24 hours
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentReviewsForCollege = await prisma.review.findMany({
    where: {
      collegeId,
      createdAt: { gte: oneHourAgo },
    },
    include: {
      anonymousProfile: { select: { createdAt: true } },
    },
  });

  const burstCountFromNewProfiles = recentReviewsForCollege.filter(
    (r) => new Date(r.anonymousProfile.createdAt) >= twentyFourHoursAgo
  ).length;

  if (burstCountFromNewProfiles >= 3) {
    const existingFlag = await prisma.anomalyFlag.findFirst({
      where: { collegeId, status: 'PENDING' },
    });
    if (!existingFlag) {
      await prisma.anomalyFlag.create({
        data: {
          collegeId,
          reason: `Unusual burst: ${burstCountFromNewProfiles} reviews submitted within 1 hour from accounts created in the last 24h.`,
          status: 'PENDING',
        },
      });
    }
  }

  // STEP 7: Threshold Unlock Notification Trigger
  const reviewsAfter = await prisma.review.count({ where: { collegeId, isHidden: false } });
  if (reviewsBefore < 5 && reviewsAfter >= 5) {
    const targetCollege = await prisma.college.findUnique({ where: { id: collegeId }, select: { name: true, slug: true } });
    const allReviewers = await prisma.review.findMany({
      where: { collegeId, isHidden: false },
      select: { anonymousProfileId: true },
    });

    for (const r of allReviewers) {
      await sendNotification({
        anonymousProfileId: r.anonymousProfileId,
        type: 'THRESHOLD_UNLOCKED',
        title: 'Scorecard Unlocked! 🎉',
        message: `The 5-review threshold for ${targetCollege?.name || 'your college'} has been reached! Public scorecard ratings are now live.`,
        linkUrl: `/colleges/${targetCollege?.slug}`,
      });
    }
  }

  // FEATURE 3: Auto-Generated Review Summary — threshold-gated regeneration
  // Only regenerates when the visible count crosses 10/25/50/100 milestones.
  // Non-fatal: summary failure must never block review submission.
  try {
    if (shouldRegenerateSummary(reviewsBefore, reviewsAfter)) {
      await generateCollegeSummary(collegeId);
    }
  } catch (err) {
    console.error('[Summary] Generation failed (non-fatal):', err);
  }

  return { success: true, reviewId: review.id };
}

// STEP 3: Toggle Review Helpful Mark
export async function toggleReviewHelpfulAction(reviewId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Authentication required' };

  const existing = await prisma.reviewHelpful.findUnique({
    where: {
      anonymousProfileId_reviewId: {
        anonymousProfileId: session.anonymousProfileId,
        reviewId,
      },
    },
  });

  if (existing) {
    // Remove helpful vote
    await prisma.reviewHelpful.delete({ where: { id: existing.id } });
    await prisma.review.update({
      where: { id: reviewId },
      data: { helpfulCount: { decrement: 1 } },
    });
  } else {
    // Add helpful vote
    await prisma.reviewHelpful.create({
      data: {
        anonymousProfileId: session.anonymousProfileId,
        reviewId,
      },
    });
    await prisma.review.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
    });
  }

  return { success: true };
}

export async function createPostAction({
  collegeId,
  body,
  imageUrl,
  imageUrls = [],
  postType = 'GENERAL',
  eventType,
  eventDate,
  visibilityScope = 'OPEN_GUJARAT',
  externalLink,
  teamSizeNeeded,
  rolesNeeded = [],
  skillsNeeded = [],
}: {
  collegeId: string;
  body: string;
  imageUrl?: string;
  imageUrls?: string[];
  postType?: 'GENERAL' | 'EVENT' | 'TEAM_REQUEST';
  eventType?: string;
  eventDate?: string | null;
  visibilityScope?: 'COLLEGE_ONLY' | 'OPEN_GUJARAT';
  externalLink?: string | null;
  teamSizeNeeded?: number | null;
  rolesNeeded?: string[];
  skillsNeeded?: string[];
}) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Authentication required' };

  if (!body || !body.trim()) {
    return { success: false, error: 'Post content cannot be empty.' };
  }

  // Step 2 Validation: Enforce required fields for structured posts
  if (postType === 'TEAM_REQUEST' && (!rolesNeeded || rolesNeeded.filter(r => r.trim()).length === 0)) {
    return { success: false, error: 'Team Request posts must specify at least one role needed.' };
  }

  if ((postType === 'EVENT' || postType === 'TEAM_REQUEST') && !eventType) {
    return { success: false, error: 'Event Type is required for Event and Team Request posts.' };
  }

  // Rate Limiting Cooldown Check (2 minutes)
  const profile = await prisma.anonymousProfile.findUnique({
    where: { id: session.anonymousProfileId },
    select: { lastSubmissionAt: true },
  });

  if (profile?.lastSubmissionAt) {
    const elapsedMs = Date.now() - new Date(profile.lastSubmissionAt).getTime();
    if (elapsedMs < 120 * 1000) {
      const remainingSec = Math.ceil((120 * 1000 - elapsedMs) / 1000);
      return {
        success: false,
        error: `Submission cooldown active. Please wait ${remainingSec} seconds before submitting another post.`,
      };
    }
  }

  // Consolidate legacy single image with multi-images array (up to 4)
  const allImageUrls: string[] = [];
  if (imageUrl) allImageUrls.push(imageUrl);
  if (imageUrls && Array.isArray(imageUrls)) {
    imageUrls.forEach((url) => {
      if (url && !allImageUrls.includes(url)) allImageUrls.push(url);
    });
  }
  const finalImages = allImageUrls.slice(0, 4);

  const post = await prisma.post.create({
    data: {
      anonymousProfileId: session.anonymousProfileId,
      collegeId,
      body: body.trim(),
      imageUrl: finalImages[0] || null,
      postType,
      eventType: eventType || null,
      eventDate: eventDate ? new Date(eventDate) : null,
      visibilityScope,
      externalLink: externalLink?.trim() || null,
      teamSizeNeeded: teamSizeNeeded ? Number(teamSizeNeeded) : null,
      rolesNeeded: rolesNeeded.length > 0 ? JSON.stringify(rolesNeeded.map((r) => r.trim()).filter(Boolean)) : null,
      skillsNeeded: skillsNeeded.length > 0 ? JSON.stringify(skillsNeeded.map((s) => s.trim()).filter(Boolean)) : null,
      images: {
        create: finalImages.map((url) => ({ imageUrl: url })),
      },
    },
  });

  await prisma.anonymousProfile.update({
    where: { id: session.anonymousProfileId },
    data: { lastSubmissionAt: new Date() },
  });

  return { success: true, postId: post.id };
}

export async function createCommentAction(parentType: 'POST' | 'REVIEW', parentId: string, body: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Authentication required' };

  if (!body || !body.trim()) {
    return { success: false, error: 'Comment body cannot be empty.' };
  }

  const comment = await prisma.comment.create({
    data: {
      parentType,
      parentId,
      anonymousProfileId: session.anonymousProfileId,
      body: body.trim(),
    },
  });

  // STEP 7 Notification: Alert parent content owner
  try {
    let authorProfileId: string | null = null;
    let title = '';
    let linkUrl = '';

    if (parentType === 'POST') {
      const post = await prisma.post.findUnique({
        where: { id: parentId },
        include: { college: { select: { slug: true } } },
      });
      if (post) {
        authorProfileId = post.anonymousProfileId;
        title = 'New Comment on Your Post';
        linkUrl = `/colleges/${post.college.slug}`;
      }
    } else if (parentType === 'REVIEW') {
      const review = await prisma.review.findUnique({
        where: { id: parentId },
        include: { college: { select: { slug: true } } },
      });
      if (review) {
        authorProfileId = review.anonymousProfileId;
        title = 'New Comment on Your Review';
        linkUrl = `/colleges/${review.college.slug}`;
      }
    }

    if (authorProfileId && authorProfileId !== session.anonymousProfileId) {
      await sendNotification({
        anonymousProfileId: authorProfileId,
        type: 'COMMENT_RECEIVED',
        title,
        message: `${session.publicHandle} commented on your ${parentType.toLowerCase()}: "${body.trim().substring(0, 50)}..."`,
        linkUrl,
      });
    }
  } catch (err) {
    console.error('Failed to trigger comment notification:', err);
  }

  return { success: true, commentId: comment.id };
}

export async function voteAction(targetType: 'POST' | 'REVIEW' | 'COMMENT', targetId: string, direction: 'UP' | 'DOWN') {
  const session = await getSession();
  if (!session) return { success: false, error: 'Authentication required' };

  const existing = await prisma.vote.findUnique({
    where: {
      anonymousProfileId_targetType_targetId: {
        anonymousProfileId: session.anonymousProfileId,
        targetType,
        targetId,
      },
    },
  });

  if (existing) {
    if (existing.direction === direction) {
      await prisma.vote.delete({ where: { id: existing.id } });
    } else {
      await prisma.vote.update({
        where: { id: existing.id },
        data: { direction },
      });
    }
  } else {
    await prisma.vote.create({
      data: {
        anonymousProfileId: session.anonymousProfileId,
        targetType,
        targetId,
        direction,
      },
    });
  }

  return { success: true };
}

export async function reportAction(targetType: 'POST' | 'REVIEW' | 'COMMENT', targetId: string, reason: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Authentication required' };

  if (!reason || !reason.trim()) {
    return { success: false, error: 'Please select or state a reason for reporting.' };
  }

  await prisma.report.create({
    data: {
      anonymousProfileId: session.anonymousProfileId,
      targetType,
      targetId,
      reason: reason.trim(),
      status: 'PENDING',
    },
  });

  const reportCount = await prisma.report.count({
    where: { targetType, targetId, status: 'PENDING' },
  });

  if (reportCount >= 3) {
    let authorProfileId: string | null = null;
    if (targetType === 'REVIEW') {
      const r = await prisma.review.update({ where: { id: targetId }, data: { isHidden: true } });
      authorProfileId = r.anonymousProfileId;
    } else if (targetType === 'POST') {
      const p = await prisma.post.update({ where: { id: targetId }, data: { isHidden: true } });
      authorProfileId = p.anonymousProfileId;
    } else if (targetType === 'COMMENT') {
      const c = await prisma.comment.update({ where: { id: targetId }, data: { isHidden: true } });
      authorProfileId = c.anonymousProfileId;
    }

    if (authorProfileId) {
      await sendNotification({
        anonymousProfileId: authorProfileId,
        type: 'MODERATION_ACTION',
        title: 'Content Hidden by Moderation Audit',
        message: `Your ${targetType.toLowerCase()} was hidden following multiple community flags.`,
      });
    }
  }

  return { success: true, isAutoHidden: reportCount >= 3 };
}

export async function getAllPostsAction({
  postType,
  eventType,
  collegeId,
  stream,
  skillsNeeded,
  visibilityScope,
  sortBy = 'recency',
}: {
  postType?: string;
  eventType?: string;
  collegeId?: string;
  stream?: string;
  skillsNeeded?: string;
  visibilityScope?: string;
  sortBy?: 'eventDate' | 'recency';
} = {}) {
  // Build query filters
  const where: any = { isHidden: false };

  if (postType && postType !== 'ALL') {
    where.postType = postType;
  }

  if (eventType && eventType !== 'ALL') {
    where.eventType = eventType;
  }

  if (visibilityScope && visibilityScope !== 'ALL') {
    where.visibilityScope = visibilityScope;
  }

  if (collegeId && collegeId !== 'ALL') {
    where.collegeId = collegeId;
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'eventDate') {
    orderBy = [
      { eventDate: 'asc' },
      { createdAt: 'desc' },
    ];
  }

  const rawPosts = await prisma.post.findMany({
    where,
    orderBy,
    include: {
      college: {
        select: { id: true, name: true, slug: true, city: true, streams: true },
      },
      anonymousProfile: {
        select: { id: true, publicHandle: true, batchYear: true },
      },
      images: {
        select: { id: true, imageUrl: true },
      },
    },
  });

  // Client-side stream and skills filtering if specified
  let posts = rawPosts.map((p) => {
    let rolesNeededParsed: string[] = [];
    let skillsNeededParsed: string[] = [];
    try {
      if (p.rolesNeeded) rolesNeededParsed = JSON.parse(p.rolesNeeded);
    } catch {}
    try {
      if (p.skillsNeeded) skillsNeededParsed = JSON.parse(p.skillsNeeded);
    } catch {}

    return {
      ...p,
      rolesNeededParsed,
      skillsNeededParsed,
    };
  });

  if (stream && stream !== 'ALL') {
    posts = posts.filter((p) => {
      try {
        const collegeStreams: string[] = JSON.parse(p.college?.streams || '[]');
        return collegeStreams.some((s) => s.toLowerCase().includes(stream.toLowerCase()));
      } catch {
        return false;
      }
    });
  }

  if (skillsNeeded && skillsNeeded.trim()) {
    const q = skillsNeeded.toLowerCase().trim();
    posts = posts.filter((p) =>
      p.skillsNeededParsed.some((skill) => skill.toLowerCase().includes(q))
    );
  }

  const votes = await prisma.vote.findMany({
    where: { targetType: 'POST' },
  });

  const comments = await prisma.comment.findMany({
    where: { parentType: 'POST', isHidden: false },
    include: {
      anonymousProfile: { select: { publicHandle: true } },
    },
  });

  return { posts: posts as unknown as PostWithRelations[], votes, comments };
}

// STEP 6: Leaderboard & Trending Action
export async function getLeaderboardsAction({
  stream,
  city,
}: {
  stream?: string;
  city?: string;
} = {}) {
  const colleges = await getCollegesAction({ stream, city });

  const topRated = [...colleges]
    .filter((c) => c.stats.hasEnoughReviews && c.stats.overallRating !== null)
    .sort((a, b) => (b.stats.overallRating || 0) - (a.stats.overallRating || 0))
    .slice(0, 10);

  const mostReviewed = [...colleges]
    .sort((a, b) => b.stats.reviewCount - a.stats.reviewCount)
    .slice(0, 10);

  return { topRated, mostReviewed };
}

// STEP 6: Trending Action (Spike in activity in last 7 days)
export async function getTrendingCollegesAction() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const colleges = await prisma.college.findMany({
    take: 12,
    include: {
      reviews: { where: { createdAt: { gte: sevenDaysAgo } } },
      posts: { where: { createdAt: { gte: sevenDaysAgo } } },
    },
  });

  const scored = colleges.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    city: c.city,
    recentActivityCount: c.reviews.length * 2 + c.posts.length, // reviews weighted 2x
  }));

  scored.sort((a, b) => b.recentActivityCount - a.recentActivityCount);
  return scored.filter((c) => c.recentActivityCount > 0).slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 1: Similarity-Based Recommendations
// Computes cosine similarity between colleges using their 8-category rating
// vectors. A bonus is added for each shared stream (+0.15) and for the same
// city (+0.10). Only colleges that have met the 5-review public threshold
// participate. The target college itself is excluded from results.
// ─────────────────────────────────────────────────────────────────────────────

type RatingVector = [number, number, number, number, number, number, number, number];

/** Dot product of two equal-length vectors. */
function dotProduct(a: RatingVector, b: RatingVector): number {
  return a.reduce((sum, ai, i) => sum + ai * b[i], 0);
}

/** Euclidean magnitude of a vector. */
function magnitude(v: RatingVector): number {
  return Math.sqrt(v.reduce((sum, vi) => sum + vi * vi, 0));
}

/** Cosine similarity in [0, 1]. Returns 0 if either vector is zero. */
function cosineSimilarity(a: RatingVector, b: RatingVector): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

export async function getSimilarCollegesAction(
  collegeId: string,
  limit = 4
): Promise<
  {
    id: string;
    name: string;
    slug: string;
    city: string;
    type: string;
    streams: string[];
    overallRating: number;
    reviewCount: number;
    similarity: number;
    sharedStreams: string[];
    sameCity: boolean;
  }[]
> {
  // Fetch the target college
  const target = await prisma.college.findUnique({ where: { id: collegeId } });
  if (!target) return [];

  let targetStreams: string[] = [];
  try { targetStreams = JSON.parse(target.streams); } catch { targetStreams = []; }

  const targetStats = await getCollegeStats(collegeId);
  // Target must also have enough reviews (otherwise its vector is null)
  if (!targetStats.hasEnoughReviews || !targetStats.categoryAverages) return [];

  const targetVector: RatingVector = [
    targetStats.categoryAverages.academics,
    targetStats.categoryAverages.placements,
    targetStats.categoryAverages.infrastructure,
    targetStats.categoryAverages.hostel,
    targetStats.categoryAverages.feesValue,
    targetStats.categoryAverages.facultySupport,
    targetStats.categoryAverages.campusLife,
    targetStats.categoryAverages.safety,
  ];

  // Fetch all other colleges
  const allColleges = await prisma.college.findMany({
    where: { id: { not: collegeId } }, // exclude target
  });

  const candidates = [];

  for (const c of allColleges) {
    const stats = await getCollegeStats(c.id);
    if (!stats.hasEnoughReviews || !stats.categoryAverages || !stats.overallRating) continue;

    let cStreams: string[] = [];
    try { cStreams = JSON.parse(c.streams); } catch { cStreams = []; }

    const candidateVector: RatingVector = [
      stats.categoryAverages.academics,
      stats.categoryAverages.placements,
      stats.categoryAverages.infrastructure,
      stats.categoryAverages.hostel,
      stats.categoryAverages.feesValue,
      stats.categoryAverages.facultySupport,
      stats.categoryAverages.campusLife,
      stats.categoryAverages.safety,
    ];

    // Base cosine similarity
    let score = cosineSimilarity(targetVector, candidateVector);

    // Bonus: +0.15 per shared stream (captures same academic domain)
    const sharedStreams = targetStreams.filter((s) =>
      cStreams.some((cs) => cs.toLowerCase() === s.toLowerCase())
    );
    score += sharedStreams.length * 0.15;

    // Bonus: +0.10 for same city (captures geographic peer group)
    const sameCity = c.city.toLowerCase() === target.city.toLowerCase();
    if (sameCity) score += 0.10;

    candidates.push({
      id: c.id,
      name: c.name,
      slug: c.slug,
      city: c.city,
      type: c.type,
      streams: cStreams,
      overallRating: stats.overallRating,
      reviewCount: stats.reviewCount,
      similarity: Math.min(Number(score.toFixed(3)), 2), // cap for display sanity
      sharedStreams,
      sameCity,
    });
  }

  // Sort descending by composite similarity score
  candidates.sort((a, b) => b.similarity - a.similarity);
  return candidates.slice(0, limit);
}
