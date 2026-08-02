'use client';

import { useState } from 'react';
import { REVIEW_CATEGORIES, ReviewCategoryKey, SessionData } from '@/lib/types';
import { submitReviewAction } from '@/lib/actions/content';
import { useRouter } from 'next/navigation';
import { Star, ShieldCheck, AlertTriangle, Lock, CheckCircle2, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

interface ExistingReviewData {
  academics: number;
  placements: number;
  infrastructure: number;
  hostel: number;
  feesValue: number;
  facultySupport: number;
  campusLife: number;
  safety: number;
  freeText: string;
}

export default function ReviewFormClient({
  college,
  session,
  existingReview,
}: {
  college: { id: string; name: string; slug: string; city: string };
  session: SessionData | null;
  existingReview?: ExistingReviewData | null;
}) {
  const router = useRouter();

  const [scores, setScores] = useState<Record<ReviewCategoryKey, number>>({
    academics: existingReview?.academics || 4,
    placements: existingReview?.placements || 4,
    infrastructure: existingReview?.infrastructure || 4,
    hostel: existingReview?.hostel || 4,
    feesValue: existingReview?.feesValue || 4,
    facultySupport: existingReview?.facultySupport || 4,
    campusLife: existingReview?.campusLife || 4,
    safety: existingReview?.safety || 4,
  });

  const [freeText, setFreeText] = useState(existingReview?.freeText || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const minChars = 50;
  const currentLength = freeText.trim().length;
  const isTextValid = currentLength >= minChars;

  const setCategoryScore = (key: ReviewCategoryKey, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const isVerifiedForThisCollege =
    session &&
    (session.verificationStatus === 'DOMAIN_VERIFIED' || session.verificationStatus === 'MANUALLY_VERIFIED') &&
    (!session.verifiedCollegeId || session.verifiedCollegeId === college.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTextValid) {
      setError(`Your written review is too short (${currentLength}/${minChars} chars). Please write at least 50 characters of details.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await submitReviewAction(college.id, scores, freeText);
    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/colleges/${college.slug}`);
        router.refresh();
      }, 1500);
    } else {
      setError(res.error || 'Failed to submit review.');
    }
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-xl bg-background-secondary border border-border text-center space-y-4">
        <Lock className="w-10 h-10 text-accent mx-auto" />
        <h2 className="text-xl font-serif font-semibold text-text-primary">Authentication Required</h2>
        <p className="text-xs text-text-secondary max-w-md mx-auto">
          You must be logged in with a verified student account to write a review for {college.name}.
        </p>
        <Link
          href={`/colleges/${college.slug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to College Profile</span>
        </Link>
      </div>
    );
  }

  if (!isVerifiedForThisCollege) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-xl bg-background-secondary border border-border space-y-4 text-center">
        <AlertTriangle className="w-10 h-10 text-warning mx-auto" />
        <h2 className="text-xl font-serif font-semibold text-text-primary">Verification Required for {college.name}</h2>
        <p className="text-xs text-text-secondary max-w-md mx-auto">
          {session.verifiedCollegeId && session.verifiedCollegeId !== college.id
            ? `Your student profile is currently verified for a different institution. To maintain audit integrity, students can only post ratings for their own verified college.`
            : `Only verified students (domain email or verified student ID card) can submit reviews. Please verify your student identity in the navigation menu.`}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href={`/colleges/${college.slug}`}
            className="px-4 py-2 rounded-md bg-background border border-border text-xs text-text-primary hover:border-accent font-medium transition-colors"
          >
            Back to {college.name}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-xl bg-background-secondary border border-border text-center space-y-4 animate-in fade-in duration-300">
        <CheckCircle2 className="w-12 h-12 text-verified mx-auto" />
        <h2 className="text-2xl font-serif font-semibold text-text-primary">Review Submitted!</h2>
        <p className="text-xs text-text-secondary">
          Thank you for contributing to the CampusVoice Gujarat audit ledger. Redirecting back to {college.name}...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8 bg-background-secondary border border-border p-6 sm:p-8 rounded-xl shadow-sm">
      {/* Header */}
      <div className="space-y-2 border-b border-border pb-6">
        <Link href={`/colleges/${college.slug}`} className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-mono">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {college.name}</span>
        </Link>

        <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
          <div>
            <h1 className="text-2xl font-serif font-semibold text-text-primary">
              {existingReview ? 'Edit Your Review' : 'Rate & Audit'} {college.name}
            </h1>
            <p className="text-xs text-text-secondary font-mono mt-0.5">
              {college.city} • Verified Student Feedback
            </p>
          </div>
          <div className="verification-stamp">
            <ShieldCheck className="w-3.5 h-3.5 text-verified" />
            <span>Posting as {session.publicHandle}</span>
          </div>
        </div>
      </div>

      {/* 8 Category Ratings */}
      <div className="space-y-6">
        <h3 className="text-sm font-serif font-semibold text-text-primary uppercase tracking-wider text-xs">
          1. Category Ratings (1 to 5 Stars)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REVIEW_CATEGORIES.map((cat) => {
            const currentScore = scores[cat.key];
            return (
              <div key={cat.key} className="p-4 rounded-lg bg-background border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-text-primary">{cat.label}</span>
                  <span className="font-mono text-xs text-accent font-bold">{currentScore} / 5</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-tight">{cat.description}</p>

                <div className="flex items-center gap-1 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCategoryScore(cat.key, star)}
                      className="p-1 text-text-secondary hover:text-accent transition-colors"
                      title={`${star} Star`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= currentScore ? 'fill-accent text-accent' : 'text-border'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Free Text Review Section */}
      <div className="space-y-3 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <label className="font-serif font-semibold text-sm text-text-primary">
            2. Detailed Student Experience Review
          </label>
          <span
            className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
              isTextValid
                ? 'bg-verified/10 text-verified border-verified/30'
                : 'bg-warning/10 text-warning border-warning/30'
            }`}
          >
            {currentLength} / {minChars} min characters
          </span>
        </div>

        <p className="text-xs text-text-secondary">
          Share genuine details regarding faculty quality, lab equipment, hostel food, placement cutoffs, and campus culture. Avoid profanity or hate speech.
        </p>

        <textarea
          rows={5}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="Write your honest, detailed review here (minimum 50 characters required)..."
          className="w-full p-4 bg-background border border-border rounded-lg text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent resize-none leading-relaxed"
        />

        {!isTextValid && (
          <p className="text-[11px] font-mono text-warning flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Need {minChars - currentLength} more characters before submitting.</span>
          </p>
        )}
      </div>

      {/* Submission Errors */}
      {error && (
        <div className="p-3 rounded-md bg-warning/10 border border-warning/30 text-warning text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="border-t border-border pt-6 flex items-center justify-end gap-3">
        <Link
          href={`/colleges/${college.slug}`}
          className="px-4 py-2.5 rounded-md bg-background border border-border text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={submitting || !isTextValid}
          className="px-6 py-2.5 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <span>Saving Review...</span>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>{existingReview ? 'Update Review' : 'Publish Review'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
