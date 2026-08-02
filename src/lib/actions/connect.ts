'use server';

import { prisma } from '../prisma';
import { getSession } from '../auth';
import { sendNotification } from './notification';

/**
 * Creates a connect_request on an event or team_request post.
 * Enforces a rate limit of max 5 requests per profile per 24 hours,
 * and verifies blocking rules.
 */
export async function createConnectRequestAction(postId: string, message?: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'You must be logged in to connect with teammates.' };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { anonymousProfile: { select: { id: true, publicHandle: true } } },
  });

  if (!post || post.isHidden) {
    return { success: false, error: 'Post not found or unavailable.' };
  }

  if (post.anonymousProfileId === session.anonymousProfileId) {
    return { success: false, error: 'You cannot send a connect request to your own post.' };
  }

  // Rate limit check: max 5 requests per 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentRequestsCount = await prisma.connectRequest.count({
    where: {
      requesterProfileId: session.anonymousProfileId,
      createdAt: { gte: twentyFourHoursAgo },
    },
  });

  if (recentRequestsCount >= 5) {
    return {
      success: false,
      error: 'Daily connect request limit reached (5 requests / 24h). Please try again tomorrow.',
    };
  }

  // Check if post author blocked requester
  const isBlocked = await prisma.connectBlock.findFirst({
    where: {
      blockerProfileId: post.anonymousProfileId,
      blockedProfileId: session.anonymousProfileId,
    },
  });

  if (isBlocked) {
    return { success: false, error: 'Unable to send connect request to this author.' };
  }

  // Check existing request
  const existingRequest = await prisma.connectRequest.findUnique({
    where: {
      postId_requesterProfileId: {
        postId,
        requesterProfileId: session.anonymousProfileId,
      },
    },
  });

  if (existingRequest) {
    return { success: false, error: `You have already sent a request for this post (status: ${existingRequest.status.toLowerCase()}).` };
  }

  // Create request
  const request = await prisma.connectRequest.create({
    data: {
      postId,
      requesterProfileId: session.anonymousProfileId,
      message: message?.trim() || null,
      status: 'PENDING',
    },
  });

  // Notify post author
  await sendNotification({
    anonymousProfileId: post.anonymousProfileId,
    type: 'CONNECT_REQUEST_RECEIVED',
    title: 'New Teammate Request 🤝',
    message: `${session.publicHandle} expressed interest in your post "${post.body.substring(0, 45)}..."`,
    linkUrl: `/feed?postId=${postId}`,
  });

  return { success: true, requestId: request.id };
}

/**
 * Responds to a connect_request (Accept or Decline).
 * Only executable by the post author.
 */
export async function respondConnectRequestAction(requestId: string, status: 'ACCEPTED' | 'DECLINED') {
  const session = await getSession();
  if (!session) return { success: false, error: 'Authentication required.' };

  const request = await prisma.connectRequest.findUnique({
    where: { id: requestId },
    include: {
      post: {
        select: {
          id: true,
          anonymousProfileId: true,
          eventDate: true,
          body: true,
        },
      },
    },
  });

  if (!request) return { success: false, error: 'Request not found.' };

  if (request.post.anonymousProfileId !== session.anonymousProfileId) {
    return { success: false, error: 'Unauthorized: Only the post author can manage connect requests.' };
  }

  // Update request status
  await prisma.connectRequest.update({
    where: { id: requestId },
    data: { status },
  });

  if (status === 'ACCEPTED') {
    // Calculate auto-expiry date:
    // Event Date + 24 hour grace period, or default 14 days if no event date.
    let expiresAt: Date;
    if (request.post.eventDate) {
      expiresAt = new Date(new Date(request.post.eventDate).getTime() + 24 * 60 * 60 * 1000);
      if (expiresAt.getTime() < Date.now() + 3 * 24 * 60 * 60 * 1000) {
        expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      }
    } else {
      expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    }

    const thread = await prisma.connectThread.upsert({
      where: { connectRequestId: requestId },
      update: { status: 'ACTIVE', expiresAt },
      create: {
        connectRequestId: requestId,
        expiresAt,
        status: 'ACTIVE',
      },
    });

    await sendNotification({
      anonymousProfileId: request.requesterProfileId,
      type: 'CONNECT_REQUEST_ACCEPTED',
      title: 'Teammate Request Accepted! 🎉',
      message: `Your request to connect on "${request.post.body.substring(0, 45)}..." was accepted! Click to open your private thread.`,
      linkUrl: `/connect/threads/${thread.id}`,
    });

    return { success: true, threadId: thread.id };
  } else {
    // Declined: send generic notification without disclosing reason
    await sendNotification({
      anonymousProfileId: request.requesterProfileId,
      type: 'CONNECT_REQUEST_DECLINED',
      title: 'Connect Request Update',
      message: `Your connect request for "${request.post.body.substring(0, 45)}..." was reviewed by the poster.`,
    });

    return { success: true };
  }
}

/**
 * Returns incoming connect requests for a specific post.
 * Accessible only to the post author.
 */
export async function getPostConnectRequestsAction(postId: string) {
  const session = await getSession();
  if (!session) return { requests: [] };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { anonymousProfileId: true },
  });

  if (!post || post.anonymousProfileId !== session.anonymousProfileId) {
    return { requests: [] };
  }

  const requests = await prisma.connectRequest.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    include: {
      requesterProfile: {
        select: {
          id: true,
          publicHandle: true,
          batchYear: true,
          college: { select: { name: true } },
        },
      },
      thread: {
        select: { id: true, expiresAt: true, status: true },
      },
    },
  });

  return { requests };
}

/**
 * Returns active connect thread data and message history for participants.
 * Strict authorization: session profile must be requester or post author.
 */
export async function getConnectThreadAction(threadId: string) {
  const session = await getSession();
  if (!session) return { error: 'Authentication required' };

  const thread = await prisma.connectThread.findUnique({
    where: { id: threadId },
    include: {
      connectRequest: {
        include: {
          post: {
            include: {
              college: { select: { name: true, slug: true } },
              anonymousProfile: {
                select: { id: true, publicHandle: true, batchYear: true },
              },
            },
          },
          requesterProfile: {
            select: { id: true, publicHandle: true, batchYear: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          senderProfile: {
            select: { id: true, publicHandle: true, batchYear: true },
          },
        },
      },
    },
  });

  if (!thread) return { error: 'Connect thread not found.' };

  const authorProfileId = thread.connectRequest.post.anonymousProfileId;
  const requesterProfileId = thread.connectRequest.requesterProfileId;
  const currentProfileId = session.anonymousProfileId;

  if (currentProfileId !== authorProfileId && currentProfileId !== requesterProfileId) {
    return { error: 'Forbidden: You are not a participant in this thread.' };
  }

  // Check auto-expiry
  const isExpired = new Date(thread.expiresAt).getTime() < Date.now();
  if (isExpired && thread.status === 'ACTIVE') {
    await prisma.connectThread.update({
      where: { id: threadId },
      data: { status: 'EXPIRED' },
    });
    thread.status = 'EXPIRED';
  }

  const otherProfile =
    currentProfileId === authorProfileId
      ? thread.connectRequest.requesterProfile
      : thread.connectRequest.post.anonymousProfile;

  return {
    thread: {
      id: thread.id,
      expiresAt: thread.expiresAt,
      status: thread.status,
      createdAt: thread.createdAt,
      post: thread.connectRequest.post,
      otherProfile,
      messages: thread.messages,
    },
    currentProfileId,
  };
}

/**
 * Sends a message in an active connect thread.
 */
export async function sendConnectMessageAction(threadId: string, body: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Authentication required' };

  if (!body || !body.trim()) {
    return { success: false, error: 'Message cannot be empty.' };
  }

  const thread = await prisma.connectThread.findUnique({
    where: { id: threadId },
    include: {
      connectRequest: {
        include: {
          post: { select: { anonymousProfileId: true, body: true } },
        },
      },
    },
  });

  if (!thread) return { success: false, error: 'Thread not found.' };

  const authorProfileId = thread.connectRequest.post.anonymousProfileId;
  const requesterProfileId = thread.connectRequest.requesterProfileId;
  const currentProfileId = session.anonymousProfileId;

  if (currentProfileId !== authorProfileId && currentProfileId !== requesterProfileId) {
    return { success: false, error: 'Unauthorized.' };
  }

  if (thread.status !== 'ACTIVE' || new Date(thread.expiresAt).getTime() < Date.now()) {
    return { success: false, error: 'This thread has expired and is no longer accepting messages.' };
  }

  const message = await prisma.connectMessage.create({
    data: {
      threadId,
      senderProfileId: currentProfileId,
      body: body.trim(),
    },
  });

  // Notify recipient
  const recipientProfileId = currentProfileId === authorProfileId ? requesterProfileId : authorProfileId;
  await sendNotification({
    anonymousProfileId: recipientProfileId,
    type: 'CONNECT_MESSAGE_RECEIVED',
    title: `New message from ${session.publicHandle}`,
    message: `"${body.trim().substring(0, 50)}..." in your teammate thread`,
    linkUrl: `/connect/threads/${threadId}`,
  });

  return { success: true, messageId: message.id };
}

/**
 * Blocks a profile from sending connect requests to the blocker.
 */
export async function blockConnectUserAction(targetProfileId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Authentication required' };

  if (targetProfileId === session.anonymousProfileId) {
    return { success: false, error: 'Cannot block yourself.' };
  }

  await prisma.connectBlock.upsert({
    where: {
      blockerProfileId_blockedProfileId: {
        blockerProfileId: session.anonymousProfileId,
        blockedProfileId: targetProfileId,
      },
    },
    update: {},
    create: {
      blockerProfileId: session.anonymousProfileId,
      blockedProfileId: targetProfileId,
    },
  });

  return { success: true };
}

/**
 * Reports a connect thread to moderation queue.
 */
export async function reportConnectThreadAction(threadId: string, reason: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Authentication required' };

  if (!reason || !reason.trim()) {
    return { success: false, error: 'Reason is required.' };
  }

  await prisma.report.create({
    data: {
      anonymousProfileId: session.anonymousProfileId,
      targetType: 'CONNECT_THREAD',
      targetId: threadId,
      reason: reason.trim(),
      status: 'PENDING',
    },
  });

  return { success: true };
}

/**
 * Purges expired connect threads and hard deletes message history.
 */
export async function purgeExpiredConnectThreadsAction() {
  const now = new Date();

  await prisma.connectThread.updateMany({
    where: {
      expiresAt: { lt: now },
      status: 'ACTIVE',
    },
    data: { status: 'EXPIRED' },
  });

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const expiredThreadsToHardDelete = await prisma.connectThread.findMany({
    where: {
      expiresAt: { lt: twentyFourHoursAgo },
    },
    select: { id: true },
  });

  if (expiredThreadsToHardDelete.length > 0) {
    const threadIds = expiredThreadsToHardDelete.map((t) => t.id);
    await prisma.connectMessage.deleteMany({
      where: { threadId: { in: threadIds } },
    });
    await prisma.connectThread.deleteMany({
      where: { id: { in: threadIds } },
    });
  }

  return { purgedCount: expiredThreadsToHardDelete.length };
}
