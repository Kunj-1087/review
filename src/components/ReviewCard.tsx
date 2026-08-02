'use client';

import { useState } from 'react';
import { CategoryRatingBar } from './RatingStars';
import { voteAction, createCommentAction, toggleReviewHelpfulAction } from '@/lib/actions/content';
import ReportModal from './ReportModal';
import { ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, ChevronUp, Flag, User, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ReviewWithRelations, ContentVote, CommentWithProfile } from '@/lib/types';

export default function ReviewCard({
  review,
  votes,
  comments,
  currentAnonymousProfileId,
}: {
  review: ReviewWithRelations;
  votes: ContentVote[];
  comments: CommentWithProfile[];
  currentAnonymousProfileId?: string;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const router = useRouter();

  const reviewVotes = votes.filter((v) => v.targetType === 'REVIEW' && v.targetId === review.id);
  const upvotes = reviewVotes.filter((v) => v.direction === 'UP').length;
  const downvotes = reviewVotes.filter((v) => v.direction === 'DOWN').length;
  const userVote = reviewVotes.find((v) => v.anonymousProfileId === currentAnonymousProfileId)?.direction;

  const helpfulVotes = (review as { helpfulVotes?: { anonymousProfileId: string }[] }).helpfulVotes || [];
  const isHelpfulMarked = helpfulVotes.some((h) => h.anonymousProfileId === currentAnonymousProfileId);
  const helpfulCount = (review as { helpfulCount?: number }).helpfulCount || 0;

  const reviewComments = comments.filter((c) => c.parentType === 'REVIEW' && c.parentId === review.id);

  const handleVote = async (dir: 'UP' | 'DOWN') => {
    if (!currentAnonymousProfileId) {
      alert('Please log in to vote on reviews.');
      return;
    }
    await voteAction('REVIEW', review.id, dir);
    router.refresh();
  };

  const handleToggleHelpful = async () => {
    if (!currentAnonymousProfileId) {
      alert('Please log in to mark reviews as helpful.');
      return;
    }
    await toggleReviewHelpfulAction(review.id);
    router.refresh();
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnonymousProfileId) {
      alert('Please log in to comment.');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    const res = await createCommentAction('REVIEW', review.id, newComment);
    setSubmittingComment(false);

    if (res.success) {
      setNewComment('');
      router.refresh();
    } else {
      alert(res.error || 'Failed to post comment');
    }
  };

  // Calculate composite rating for this individual review
  const compositeScore = Number(
    (
      (review.academics +
        review.placements +
        review.infrastructure +
        review.hostel +
        review.feesValue +
        review.facultySupport +
        review.campusLife +
        review.safety) /
      8
    ).toFixed(1)
  );

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-4 transition-all">
      {/* Review Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--surface-primary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--accent-secondary)]">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold text-xs text-[var(--text-primary)]">{review.anonymousProfile.publicHandle}</span>
              {review.anonymousProfile.batchYear && (
                <span className="badge-tag font-mono">
                  Class of {review.anonymousProfile.batchYear}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="verification-stamp">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" />
                <span>Verified Student Review</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono" suppressHydrationWarning>
                • {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Scorecard Badge */}
        <div className="flex flex-col items-end shrink-0">
          <div className="px-2.5 py-1 rounded-md bg-[var(--surface-primary)] border border-[var(--border-primary)] font-mono font-bold text-xs text-[var(--accent-secondary)] flex items-center gap-1.5 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
            <span>{compositeScore.toFixed(1)}</span>
            <span className="text-[var(--text-muted)] text-[10px] font-normal">/ 5.0</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono mt-1">Audit Score</span>
        </div>
      </div>

      {/* Free Text Body */}
      <p className="text-xs sm:text-sm text-text-primary leading-relaxed bg-background p-4 rounded-lg border border-border">
        &quot;{review.freeText}&quot;
      </p>

      {/* Category Ratings Accordion Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs font-medium text-accent hover:underline flex items-center gap-1 py-1 transition-colors font-mono"
        >
          <span>{showBreakdown ? 'Hide Category Breakdown' : 'View Category Scorecard Breakdown'}</span>
          {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showBreakdown && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-background border border-border rounded-lg animate-in fade-in duration-200">
            <CategoryRatingBar label="Academics & Rigor" score={review.academics} />
            <CategoryRatingBar label="Placements & Career" score={review.placements} />
            <CategoryRatingBar label="Infrastructure & Labs" score={review.infrastructure} />
            <CategoryRatingBar label="Faculty Support" score={review.facultySupport} />
            <CategoryRatingBar label="Fees & ROI" score={review.feesValue} />
            <CategoryRatingBar label="Hostel & Food" score={review.hostel} />
            <CategoryRatingBar label="Campus Life" score={review.campusLife} />
            <CategoryRatingBar label="Safety & Environment" score={review.safety} />
          </div>
        )}
      </div>

      {/* Footer Controls: Helpful Mark, Votes, Comments, Report */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Helpful Signal Button (Step 3) */}
          <button
            type="button"
            onClick={handleToggleHelpful}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-mono text-xs transition-colors ${
              isHelpfulMarked
                ? 'bg-accent/15 border-accent text-accent font-semibold'
                : 'bg-background border-border hover:border-accent text-text-primary'
            }`}
            title="Mark this review as helpful"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-accent" />
            <span>Helpful ({helpfulCount})</span>
          </button>

          {/* Upvote */}
          <button
            type="button"
            onClick={() => handleVote('UP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-mono text-xs transition-colors ${
              userVote === 'UP'
                ? 'bg-verified/10 border-verified text-verified font-bold'
                : 'bg-background border-border hover:border-text-secondary text-text-primary'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{upvotes}</span>
          </button>

          {/* Downvote */}
          <button
            type="button"
            onClick={() => handleVote('DOWN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-mono text-xs transition-colors ${
              userVote === 'DOWN'
                ? 'bg-warning/10 border-warning text-warning font-bold'
                : 'bg-background border-border hover:border-text-secondary text-text-primary'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>{downvotes}</span>
          </button>

          {/* Comments count */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background border border-border hover:border-text-secondary text-text-primary transition-colors font-mono text-xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-accent" />
            <span>{reviewComments.length} Comments</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="p-1.5 rounded-md hover:bg-background hover:text-warning transition-colors"
          title="Report this review"
        >
          <Flag className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Comment Section Drawer */}
      {showComments && (
        <div className="pt-3 border-t border-border space-y-3 animate-in fade-in duration-200">
          <div className="space-y-2">
            {reviewComments.length === 0 ? (
              <p className="text-xs text-text-secondary italic p-3 bg-background rounded-lg border border-border">
                No comments yet. Write a comment to join the discussion.
              </p>
            ) : (
              reviewComments.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-background border border-border text-xs space-y-1">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="font-mono font-semibold text-text-primary">{c.anonymousProfile.publicHandle}</span>
                    <span className="text-[10px] font-mono" suppressHydrationWarning>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-text-primary">{c.body}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Write an anonymous comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-background border border-border rounded-md text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="px-4 py-2 bg-accent hover:bg-accent-hover font-medium text-white text-xs rounded-md transition-all disabled:opacity-50"
            >
              {submittingComment ? 'Sending...' : 'Post Reply'}
            </button>
          </form>
        </div>
      )}

      {isReportOpen && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="REVIEW"
          targetId={review.id}
        />
      )}
    </div>
  );
}
