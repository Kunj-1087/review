import { getCollegesByIdsAction, getCollegesAction } from '@/lib/actions/content';
import Link from 'next/link';
import { Scale, ArrowLeft, Building2, ShieldCheck, Lock, Award, ChevronRight } from 'lucide-react';
import { CategoryRatingBar } from '@/components/RatingStars';

export default async function CompareCollegesPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids = '' } = await searchParams;
  const collegeIds = ids.split(',').filter((id) => id.trim().length > 0);

  const colleges = await getCollegesByIdsAction(collegeIds);
  const allColleges = await getCollegesAction();

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Back Link */}
      <div className="space-y-4">
        <Link
          href="/colleges"
          className="text-xs text-text-secondary hover:text-accent inline-flex items-center gap-1.5 font-mono transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to College Directory</span>
        </Link>

        <div className="bg-background-secondary border border-border rounded-xl p-6 sm:p-8 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-accent" />
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-text-primary">
              Side-by-Side Institution Comparison
            </h1>
          </div>
          <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
            Compare weighted scorecards, placement rigor, infrastructure, and category ratings across Gujarat institutions. This comparison page is fully shareable via URL.
          </p>
        </div>
      </div>

      {/* Comparison Grid Table */}
      {colleges.length === 0 ? (
        <div className="p-12 text-center bg-background-secondary border border-border rounded-xl space-y-4">
          <Scale className="w-10 h-10 text-text-secondary mx-auto" />
          <h3 className="text-base font-serif font-semibold text-text-primary">No Colleges Selected for Comparison</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Please return to the College Directory and enable &quot;Compare Mode&quot; to select up to 3 colleges.
          </p>
          <Link
            href="/colleges"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-all shadow-sm"
          >
            <span>Go to Directory</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[700px]">
            {colleges.map((c) => (
              <div
                key={c.id}
                className="bg-background-secondary border border-border rounded-xl p-6 space-y-6 flex flex-col justify-between shadow-sm"
              >
                {/* Header Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-background border border-border text-accent font-semibold">
                      {c.city}, Gujarat
                    </span>
                    <h2 className="text-xl font-serif font-semibold text-text-primary">
                      {c.name}
                    </h2>
                    <p className="text-xs text-text-secondary font-mono">
                      {c.type} {c.typeDetail ? `(${c.typeDetail})` : ''} • Est. {c.establishedYear || 'N/A'}
                    </p>
                  </div>

                  {/* Overall Scorecard */}
                  <div className="p-4 rounded-lg bg-background border border-border space-y-2">
                    <div className="text-[11px] font-mono text-text-secondary uppercase">
                      Weighted Audit Score
                    </div>
                    {c.stats.hasEnoughReviews ? (
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-accent" />
                        <span className="font-mono font-bold text-2xl text-accent">
                          {c.stats.overallRating} / 5.0
                        </span>
                        <span className="text-xs text-text-secondary font-mono">
                          ({c.stats.reviewCount} reviews)
                        </span>
                      </div>
                    ) : (
                      <div className="threshold-lock-stamp">
                        <Lock className="w-3.5 h-3.5 text-warning" />
                        <span>{c.stats.reviewCount}/5 Reviews (Locked)</span>
                      </div>
                    )}
                  </div>

                  {/* Category Breakdown (Step 2) */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider">
                      Category Breakdown
                    </h3>
                    {c.stats.hasEnoughReviews && c.stats.categoryAverages ? (
                      <div className="space-y-2.5 p-3.5 bg-background border border-border rounded-lg">
                        <CategoryRatingBar label="Academics (20%)" score={c.stats.categoryAverages.academics} />
                        <CategoryRatingBar label="Placements (20%)" score={c.stats.categoryAverages.placements} />
                        <CategoryRatingBar label="Infrastructure (12%)" score={c.stats.categoryAverages.infrastructure} />
                        <CategoryRatingBar label="Faculty Support (12%)" score={c.stats.categoryAverages.facultySupport} />
                        <CategoryRatingBar label="Fees Value (12%)" score={c.stats.categoryAverages.feesValue} />
                        <CategoryRatingBar label="Hostel (8%)" score={c.stats.categoryAverages.hostel} />
                        <CategoryRatingBar label="Campus Life (8%)" score={c.stats.categoryAverages.campusLife} />
                        <CategoryRatingBar label="Safety (8%)" score={c.stats.categoryAverages.safety} />
                      </div>
                    ) : (
                      <p className="text-xs text-text-secondary italic p-3 bg-background border border-border rounded-lg">
                        Category breakdown requires at least 5 verified student reviews.
                      </p>
                    )}
                  </div>

                  {/* Institutional Data */}
                  <div className="space-y-3 pt-2 border-t border-border text-xs">
                    <div>
                      <span className="font-mono text-text-secondary">Affiliation:</span>{' '}
                      <strong className="text-text-primary font-medium">{c.affiliation}</strong>
                    </div>

                    <div>
                      <span className="font-mono text-text-secondary block mb-1">Streams Offered:</span>
                      <div className="flex flex-wrap gap-1">
                        {c.streams.map((st) => (
                          <span
                            key={st}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-text-secondary"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-mono text-text-secondary block mb-1">Domain Status:</span>
                      <div className="verification-stamp text-[10px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-verified" />
                        <span>{c.officialDomains.length > 0 ? c.officialDomains.join(', ') : 'Manual Verification'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Link
                    href={`/colleges/${c.slug}`}
                    className="w-full py-2.5 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-all shadow-sm text-center flex items-center justify-center gap-1.5"
                  >
                    <span>View Full Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
