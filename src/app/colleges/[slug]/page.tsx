import { getCollegeBySlugAction, getSimilarCollegesAction } from '@/lib/actions/content';
import { getSession } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReviewCard from '@/components/ReviewCard';
import PostCard from '@/components/PostCard';
import CreatePostForm from '@/components/CreatePostForm';
import { StarRating, CategoryRatingBar } from '@/components/RatingStars';
import { Lock, ShieldCheck, MessageSquareText, PenSquare, ArrowLeft, Award } from 'lucide-react';
import { ReviewWithRelations, PostWithRelations } from '@/lib/types';
import SimilarColleges from '@/components/SimilarColleges';
import CollegeSummaryWidget from '@/components/CollegeSummaryWidget';

export default async function CollegeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const college = await getCollegeBySlugAction(slug);
  const session = await getSession();

  if (!college) notFound();

  // Fetch similarity-based recommendations (Feature 1)
  const similarColleges = await getSimilarCollegesAction(college.id, 4);

  // Check if current logged-in user already wrote a review for this college
  const userHasReviewed = session
    ? college.reviews.some((r: ReviewWithRelations) => r.anonymousProfile.id === session.anonymousProfileId)
    : false;

  return (
    <div className="space-y-8 pb-12">
      {/* Back Navigation Link */}
      <div>
        <Link href="/colleges" className="text-xs text-text-secondary hover:text-accent inline-flex items-center gap-1.5 font-mono transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to College Directory</span>
        </Link>
      </div>

      {/* College Banner Header */}
      <div className="bg-background-secondary border border-border rounded-lg p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(31,30,29,0.08)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono px-3 py-1 rounded bg-background border border-border text-accent font-semibold">
                {college.city}, Gujarat
              </span>
              <span className="text-xs px-3 py-1 rounded bg-background border border-border text-text-secondary font-mono">
                {college.type} • Est. {college.establishedYear || 'N/A'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-semibold tracking-tight text-text-primary">
              {college.name}
            </h1>

            <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
              <span>Affiliation: <strong className="text-text-primary font-medium">{college.affiliation}</strong></span>
              <span>•</span>
              <span>Domains:</span>
              <span className="verification-stamp text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-verified" />
                <span>{college.officialDomains.length > 0 ? college.officialDomains.join(', ') : 'Verification Required'}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {college.streams.map((st: string) => (
                <span key={st} className="text-[11px] font-mono px-2.5 py-1 rounded bg-background border border-border text-text-secondary">
                  {st}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            {userHasReviewed ? (
              <Link
                href={`/colleges/${college.slug}/review`}
                className="px-5 py-2.5 rounded-md bg-verified/10 border border-verified/30 text-verified hover:bg-verified/20 text-xs font-semibold font-mono flex items-center justify-center gap-2 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Edit Your Review</span>
              </Link>
            ) : (
              <Link
                href={`/colleges/${college.slug}/review`}
                className="px-5 py-2.5 rounded-md bg-accent hover:bg-accent-hover font-medium text-white text-xs shadow-sm transition-all text-center flex items-center justify-center gap-2"
              >
                <PenSquare className="w-4 h-4" />
                <span>Write Verified Review</span>
              </Link>
            )}
          </div>
        </div>

        {/* STEP 2 — 5-Review Threshold Governance Rating Breakdown */}
        <div className="pt-6 border-t border-border">
          {college.stats.hasEnoughReviews ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center font-mono text-2xl font-bold text-accent shadow-sm">
                      {college.stats.overallRating}
                    </div>
                    <div>
                      <h3 className="text-base font-serif font-semibold text-text-primary">Weighted Audit Scorecard</h3>
                      <p className="text-xs text-text-secondary font-mono">
                        Consensus average from {college.stats.reviewCount} verified student audits (Weighted: Academics 20%, Placements 20%)
                      </p>
                    </div>
                  </div>
                </div>
                <StarRating value={college.stats.overallRating!} readonly size="lg" />
              </div>

              {/* 8 Category Scorecard Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-background border border-border rounded-lg">
                <CategoryRatingBar label="Academics & Rigor (20%)" score={college.stats.categoryAverages!.academics} />
                <CategoryRatingBar label="Placements & Career (20%)" score={college.stats.categoryAverages!.placements} />
                <CategoryRatingBar label="Infrastructure & Labs (12%)" score={college.stats.categoryAverages!.infrastructure} />
                <CategoryRatingBar label="Faculty Support (12%)" score={college.stats.categoryAverages!.facultySupport} />
                <CategoryRatingBar label="Fees & ROI (12%)" score={college.stats.categoryAverages!.feesValue} />
                <CategoryRatingBar label="Hostel & Food (8%)" score={college.stats.categoryAverages!.hostel} />
                <CategoryRatingBar label="Campus Life (8%)" score={college.stats.categoryAverages!.campusLife} />
                <CategoryRatingBar label="Safety & Environment (8%)" score={college.stats.categoryAverages!.safety} />
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-background border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="threshold-lock-stamp">
                      <Lock className="w-3.5 h-3.5 text-warning" />
                      <span>Public Scorecard Locked</span>
                    </span>
                    <span className="text-xs font-mono text-text-primary font-bold">
                      {college.stats.reviewCount} / 5 Verified Reviews
                    </span>
                  </div>
                  <h3 className="text-sm font-serif font-semibold text-text-primary">
                    Not enough reviews yet — be the first to review {college.name}
                  </h3>
                </div>

                <Link
                  href={`/colleges/${college.slug}/review`}
                  className="px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-all shrink-0 text-center flex items-center justify-center gap-2"
                >
                  <PenSquare className="w-3.5 h-3.5" />
                  <span>Review {college.name}</span>
                </Link>
              </div>

              <div className="space-y-1.5">
                <div className="w-full h-2.5 bg-background-secondary border border-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full transition-all duration-500"
                    style={{ width: `${(college.stats.reviewCount / 5) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  CampusVoice Gujarat enforces a strict 5-review threshold before displaying overall scorecards. This eliminates single-review bias and ensures transparent consensus.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature 3: Student Voice Summary (shown only when summary exists) */}
      {college.collegeSummary && (
        <CollegeSummaryWidget summary={college.collegeSummary} />
      )}

      {/* Main Content: Reviews Feed (Left 2 Cols) & Campus Feed (Right 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Reviews Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-lg font-serif font-semibold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-verified" />
              <span>Verified Student Reviews ({college.reviews.length})</span>
            </h2>
            <span className="text-[11px] font-mono text-text-secondary">
              Sorted by Helpfulness
            </span>
          </div>

          {college.reviews.length === 0 ? (
            <div className="p-10 text-center bg-background-secondary border border-border rounded-lg space-y-3">
              <PenSquare className="w-8 h-8 text-text-secondary mx-auto" />
              <h3 className="text-sm font-semibold text-text-primary">No reviews yet — be the first to review</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Are you a student at {college.name}? Write an anonymous review to help prospective students across Gujarat.
              </p>
              <Link
                href={`/colleges/${college.slug}/review`}
                className="inline-block mt-2 px-5 py-2.5 rounded-md bg-accent hover:bg-accent-hover font-medium text-white text-xs shadow-sm transition-all"
              >
                Write Verified Review
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {college.reviews.map((review: ReviewWithRelations) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  votes={college.votes}
                  comments={college.comments}
                  currentAnonymousProfileId={session?.anonymousProfileId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Campus Feed */}
        <div className="space-y-6">
          <div className="bg-background-secondary border border-border rounded-lg p-5 space-y-4 shadow-[0_1px_3px_rgba(31,30,29,0.08)]">
            <h3 className="text-sm font-serif font-semibold text-text-primary flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-accent" />
              <span>Post to {college.name} Feed</span>
            </h3>
            <CreatePostForm collegeId={college.id} session={session} />
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-mono font-semibold text-text-secondary uppercase tracking-wider">
              Campus Feed Posts ({college.posts.length})
            </h3>

            {college.posts.length === 0 ? (
              <p className="text-xs text-text-secondary italic bg-background-secondary p-4 rounded-lg border border-border">
                No campus posts yet for this institution.
              </p>
            ) : (
              (college.posts as PostWithRelations[]).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  votes={college.votes}
                  comments={college.comments}
                  currentAnonymousProfileId={session?.anonymousProfileId}
                />
              ))
            )}
          </div>

          {/* Feature 1: Similarity-Based Recommendations */}
          <SimilarColleges colleges={similarColleges} />
        </div>
      </div>
    </div>
  );
}
