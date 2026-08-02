'use server';

import { prisma } from '../prisma';
import { getSession } from '../auth';

export async function getNotificationsAction() {
  const session = await getSession();
  if (!session) return { notifications: [], unreadCount: 0 };

  const notifications = await prisma.notification.findMany({
    where: { anonymousProfileId: session.anonymousProfileId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      anonymousProfileId: session.anonymousProfileId,
      isRead: false,
    },
  });

  return { notifications, unreadCount };
}

export async function markNotificationReadAction(notificationId: string) {
  const session = await getSession();
  if (!session) return { success: false };

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      anonymousProfileId: session.anonymousProfileId,
    },
    data: { isRead: true },
  });

  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const session = await getSession();
  if (!session) return { success: false };

  await prisma.notification.updateMany({
    where: {
      anonymousProfileId: session.anonymousProfileId,
      isRead: false,
    },
    data: { isRead: true },
  });

  return { success: true };
}

export async function sendNotification({
  anonymousProfileId,
  type,
  title,
  message,
  linkUrl,
}: {
  anonymousProfileId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        anonymousProfileId,
        type,
        title,
        message,
        linkUrl: linkUrl || null,
      },
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
