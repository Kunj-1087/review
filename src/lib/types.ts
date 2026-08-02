import { College, Comment, Post, PostImage, Review, Vote, ConnectRequest, ConnectThread, ConnectMessage } from '@prisma/client';

export type PostType = 'GENERAL' | 'EVENT' | 'TEAM_REQUEST';
export type EventType = 'HACKATHON' | 'FEST' | 'WORKSHOP' | 'SEMINAR' | 'CULTURAL' | 'SPORTS' | 'OTHER';
export type VisibilityScope = 'COLLEGE_ONLY' | 'OPEN_GUJARAT';

export interface SessionData {
  userId: string;
  anonymousProfileId: string;
  email: string;
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN';
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'DOMAIN_VERIFIED' | 'MANUALLY_VERIFIED';
  verifiedCollegeId: string | null;
  publicHandle: string;
}

export interface AnonymousProfileSummary {
  id?: string;
  publicHandle: string;
  batchYear?: number | null;
}

export interface PostWithRelations extends Omit<Post, 'anonymousProfile' | 'college'> {
  anonymousProfile: AnonymousProfileSummary;
  college?: { id?: string; name: string; slug: string; city?: string; streams?: string } | College | null;
  images?: Array<{ id: string; imageUrl: string }> | PostImage[];
  rolesNeededParsed?: string[];
  skillsNeededParsed?: string[];
}

export interface ConnectRequestWithRelations extends ConnectRequest {
  requesterProfile: AnonymousProfileSummary & { college?: { name: string } | null };
  thread?: { id: string; expiresAt: Date; status: string } | null;
}

export interface ReviewWithRelations extends Omit<Review, 'anonymousProfile' | 'college'> {
  anonymousProfile: AnonymousProfileSummary;
  college?: { name: string; slug: string; city?: string } | College | null;
}

export interface CommentWithProfile extends Omit<Comment, 'anonymousProfile'> {
  anonymousProfile: AnonymousProfileSummary;
}

export type ContentVote = Vote;

export type ReviewCategoryKey =
  | 'academics'
  | 'placements'
  | 'infrastructure'
  | 'hostel'
  | 'feesValue'
  | 'facultySupport'
  | 'campusLife'
  | 'safety';

export const REVIEW_CATEGORIES: { key: ReviewCategoryKey; label: string; description: string }[] = [
  { key: 'academics', label: 'Academics & Curriculum', description: 'Quality of syllabus, exams, and learning rigor' },
  { key: 'placements', label: 'Placements & Internships', description: 'Company visits, package transparency, and T&P support' },
  { key: 'infrastructure', label: 'Infrastructure & Labs', description: 'Libraries, computer labs, Wi-Fi, and classrooms' },
  { key: 'hostel', label: 'Hostel & Food', description: 'Room cleanliness, mess quality, curfews, and amenities' },
  { key: 'feesValue', label: 'Value for Fees', description: 'Tuition cost relative to facilities and placement ROI' },
  { key: 'facultySupport', label: 'Faculty Support', description: 'Teacher availability, guidance, and research encouragement' },
  { key: 'campusLife', label: 'Campus Life & Clubs', description: 'Cultural fests, technical societies, and sports' },
  { key: 'safety', label: 'Safety & Environment', description: 'Campus security, anti-ragging policies, and atmosphere' },
];

// Weighted average factors used by getCollegeStats().
// Academics (20%) & Placements (20%) are weighted highest as core educational outcomes.
// Infrastructure (12%), Faculty Support (12%), and Value for Money (12%) are medium weight.
// Hostel (8%), Campus Life (8%), and Safety (8%) comprise the remaining balance.
// Total weight = 1.0 (100%). These can be tuned without a migration.
export const CATEGORY_WEIGHTS = {
  academics: 0.20,
  placements: 0.20,
  infrastructure: 0.12,
  facultySupport: 0.12,
  feesValue: 0.12,
  hostel: 0.08,
  campusLife: 0.08,
  safety: 0.08,
} as const;
