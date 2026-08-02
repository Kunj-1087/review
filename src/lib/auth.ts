import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';
import { SessionData } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'campusvoice-secret-key-gujarat-v1-super-secure'
);

const COOKIE_NAME = 'cv_session';

export async function createSessionCookie(data: SessionData) {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Generate random pseudonymous handle
export function generatePseudonym(collegeName?: string): string {
  const cleanCollege = collegeName ? collegeName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') : null;
  const prefixes = [
    'Sabarmati', 'Gir', 'Kutch', 'Narmada', 'Tapi', 'Vastrapur', 
    'Infocity', 'Sayaji', 'GIFT_City', 'Somnath', 'Pavagadh', 'Surat_Tech'
  ];
  const roles = ['Coder', 'Debater', 'Researcher', 'Scholar', 'Architect', 'Hacker', 'Innovator', 'Thinker', 'Designer', 'Geek'];
  const num = Math.floor(100 + Math.random() * 900);
  
  const prefix = cleanCollege || prefixes[Math.floor(Math.random() * prefixes.length)];
  const role = roles[Math.floor(Math.random() * roles.length)];
  return `${prefix}_${role}_${num}`;
}

// Domain matching helper
export function extractDomain(email: string): string {
  const parts = email.toLowerCase().trim().split('@');
  return parts.length === 2 ? parts[1] : '';
}

export async function matchCollegeByDomain(email: string) {
  const domain = extractDomain(email);
  if (!domain) return null;

  // Rule 5: Only match colleges with confirmed domain confidence for auto-verification
  const colleges = await prisma.college.findMany({
    where: { domainConfidence: 'confirmed' },
  });

  for (const col of colleges) {
    let domains: string[] = [];
    try {
      domains = JSON.parse(col.officialDomains);
    } catch {
      domains = [];
    }
    if (domains.some(d => domain === d.toLowerCase() || domain.endsWith('.' + d.toLowerCase()))) {
      return col;
    }
  }
  return null;
}
