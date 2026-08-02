'use server';

import { prisma } from '../prisma';
import { matchCollegeByDomain, generatePseudonym, createSessionCookie, destroySession, getSession } from '../auth';
import { SessionData } from '../types';

export async function sendOtpAction(email: string) {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete previous OTP tokens for this email
  await prisma.otpToken.deleteMany({ where: { email: cleanEmail } });

  // Store new OTP token
  await prisma.otpToken.create({
    data: {
      email: cleanEmail,
      code,
      expiresAt,
    },
  });

  // Check if domain matches any Gujarat college
  const matchedCollege = await matchCollegeByDomain(cleanEmail);

  return {
    success: true,
    message: `OTP sent to ${cleanEmail}. (For testing, your OTP is ${code})`,
    demoCode: code,
    matchedCollegeName: matchedCollege ? matchedCollege.name : null,
  };
}

export async function verifyOtpAction(email: string, code: string) {
  const cleanEmail = email.toLowerCase().trim();
  const token = await prisma.otpToken.findFirst({
    where: { email: cleanEmail, code },
  });

  if (!token) {
    return { success: false, error: 'Invalid OTP code. Please check and try again.' };
  }

  if (new Date() > token.expiresAt) {
    return { success: false, error: 'OTP code has expired. Please request a new code.' };
  }

  // Delete token after successful use
  await prisma.otpToken.delete({ where: { id: token.id } });

  // Find or create User
  let user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  const matchedCollege = await matchCollegeByDomain(cleanEmail);

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        verificationStatus: matchedCollege ? 'DOMAIN_VERIFIED' : 'UNVERIFIED',
        verifiedCollegeId: matchedCollege ? matchedCollege.id : null,
        role: cleanEmail.includes('admin') ? 'ADMIN' : 'STUDENT',
      },
    });
  } else if (matchedCollege && user.verificationStatus === 'UNVERIFIED') {
    // Upgrade unverified user to domain verified if domain matches
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationStatus: 'DOMAIN_VERIFIED',
        verifiedCollegeId: matchedCollege.id,
      },
    });
  }

  // Find or create AnonymousProfile
  let profile = await prisma.anonymousProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    let handle = generatePseudonym(matchedCollege?.name);
    // Ensure handle uniqueness
    let existing = await prisma.anonymousProfile.findUnique({ where: { publicHandle: handle } });
    while (existing) {
      handle = generatePseudonym(matchedCollege?.name);
      existing = await prisma.anonymousProfile.findUnique({ where: { publicHandle: handle } });
    }

    profile = await prisma.anonymousProfile.create({
      data: {
        userId: user.id,
        publicHandle: handle,
        collegeId: user.verifiedCollegeId,
        batchYear: new Date().getFullYear() + 2,
      },
    });
  }

  const sessionData: SessionData = {
    userId: user.id,
    anonymousProfileId: profile.id,
    email: user.email,
    role: user.role as SessionData['role'],
    verificationStatus: user.verificationStatus as SessionData['verificationStatus'],
    verifiedCollegeId: user.verifiedCollegeId,
    publicHandle: profile.publicHandle,
  };

  await createSessionCookie(sessionData);

  return {
    success: true,
    user: sessionData,
  };
}

export async function submitManualVerificationAction(collegeId: string, idCardUrl: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Authentication required' };

  if (!idCardUrl || !idCardUrl.trim()) {
    return { success: false, error: 'Please upload a valid student ID card image.' };
  }

  await prisma.verificationRequest.create({
    data: {
      userId: session.userId,
      collegeId,
      idCardUrl,
      status: 'PENDING',
      notes: 'Manual student ID upload submitted for verification.',
    },
  });

  await prisma.user.update({
    where: { id: session.userId },
    data: { verificationStatus: 'PENDING' },
  });

  // Refresh cookie session with PENDING status
  await createSessionCookie({
    ...session,
    verificationStatus: 'PENDING',
  });

  return { success: true };
}

export async function logoutAction() {
  await destroySession();
  return { success: true };
}
