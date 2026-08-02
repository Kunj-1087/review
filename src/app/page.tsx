import Link from 'next/link';
import { getCollegesAction, getAllPostsAction, getTrendingCollegesAction } from '@/lib/actions/content';
import PostCard from '@/components/PostCard';
import { getSession } from '@/lib/auth';
import { ShieldCheck, Lock, Search, Building2, ChevronRight, Award, Flame, ArrowRight, TrendingUp } from 'lucide-react';

export default async function HomePage() {
  const colleges = await getCollegesAction();
  const { posts, votes, comments } = await getAllPostsAction();
  const session = await getSession();
  const trendingColleges = await getTrendingCollegesAction();

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative rounded-lg bg-background-secondary border border-border p-8 sm:p-12 space-y-6 shadow-[0_1px_3px_rgba(31,30,29,0.08)] overflow-hidden">
        <div className="space-y-4 max-w-3xl relative z-10">
          <div className="verification-stamp inline-flex">
            <ShieldCheck className="w-3.5 h-3.5 text-verified" />
            <span>Guaranteed Anonymous • Gujarat Domain Verified</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-semibold text-text-primary tracking-tight leading-tight">
            Real Gujarat Campus Culture.{' '}
            <span className="text-accent">
              Verified Emails, Pseudonymous Handles.
            </span>
          </h1>

          <p className="text-text-secondary text-xs sm:text-sm leading-relaxed max-w-2xl">
            Verified student review ledger across Ahmedabad, Gandhinagar, Vadodara, and Surat. Public 8-category scorecards are unlocked strictly once an institution receives <strong className="text-accent font-mono">≥ 5 verified reviews</strong>.
          </p>

          {/* Search Box */}
          <form action="/colleges" method="GET" className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                name="search"
                placeholder="Search Nirma, PDEU, GTU, LD, MSU..."
                className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-md text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:outline-accent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-accent hover:bg-accent-hover font-medium text-white text-xs rounded-md transition-all shadow-sm shrink-0"
            >
              Search Directory
            </button>
          </form>
        </div>
      </section>

      {/* Threshold Governance Explainer */}
      <section className="bg-background-secondary border border-border rounded-lg p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(31,30,29,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-background border border-border flex items-center justify-center text-warning">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-serif font-semibold text-text-primary">Why the 5-Review Threshold Governance Matters</h3>
            <p className="text-xs text-text-secondary font-mono">Eliminating single-review bias and promotional spam</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed bg-background p-4 rounded-lg border border-border">
          Traditional rating portals display skewed 5-star or 1-star averages based on a single unverified submission. At CV Gujarat Registry, a college&apos;s 8-category numerical scorecard remains <strong className="text-warning font-mono">LOCKED</strong> until at least 5 verified students submit complete reviews. This enforces genuine consensus.
        </p>
      </section>

      {/* Featured Colleges Grid */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-serif font-semibold text-text-primary">Gujarat Institutions</h2>
          </div>
          <Link href="/colleges" className="text-xs font-mono font-medium text-accent hover:underline flex items-center gap-1">
            <span>View All ({colleges.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {colleges.slice(0, 6).map((college) => (
            <Link
              key={college.id}
              href={`/colleges/${college.slug}`}
              className="group bg-background-secondary border border-border hover:border-accent rounded-lg p-5 space-y-4 transition-all flex flex-col justify-between shadow-[0_1px_3px_rgba(31,30,29,0.08)]"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-text-secondary font-semibold">
                      {college.city}
                    </span>
                    <h3 className="text-base font-serif font-semibold text-text-primary group-hover:text-accent transition-colors mt-2">
                      {college.name}
                    </h3>
                  </div>

                  {college.stats.hasEnoughReviews ? (
                    <div className="flex items-center gap-1 bg-background border border-border px-2.5 py-1 rounded-md shrink-0">
                      <Award className="w-3.5 h-3.5 text-accent" />
                      <span className="font-mono font-bold text-xs text-accent">{college.stats.overallRating}</span>
                    </div>
                  ) : (
                    <div className="threshold-lock-stamp shrink-0">
                      <Lock className="w-3 h-3 text-warning" />
                      <span>{college.stats.reviewCount}/5 reviews</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {college.streams.slice(0, 3).map((st: string) => (
                    <span key={st} className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-text-secondary">
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary font-mono">
                <span>{college.stats.reviewCount} Verified Reviews</span>
                <span className="font-medium text-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  <span>View Scorecard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending This Week */}
      {trendingColleges.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-serif font-semibold text-text-primary">Trending This Week</h2>
            </div>
            <Link href="/colleges/leaderboard" className="text-xs font-mono font-medium text-accent hover:underline flex items-center gap-1">
              <span>View Leaderboards</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            {trendingColleges.map((c, idx) => (
              <Link
                key={c.id}
                href={`/colleges/${c.slug}`}
                className="group flex items-center gap-3 px-4 py-3 bg-background-secondary border border-border hover:border-accent rounded-xl transition-all shadow-sm"
              >
                <span className={`w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs border shrink-0 ${
                  idx === 0 ? 'bg-accent text-white border-accent' : 'bg-background border-border text-text-secondary'
                }`}>
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-serif font-semibold text-text-primary group-hover:text-accent transition-colors truncate max-w-[160px]">
                    {c.name}
                  </p>
                  <p className="text-[10px] font-mono text-text-secondary">
                    {c.city} • {c.recentActivityCount} activity pts
                  </p>
                </div>
                <Flame className="w-3.5 h-3.5 text-accent shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Campus Feed Activity */}
      {posts.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-serif font-semibold text-text-primary">Live Campus Discussions</h2>
            </div>
            <Link href="/feed" className="text-xs font-mono font-medium text-accent hover:underline flex items-center gap-1">
              <span>View All Feed</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {posts.slice(0, 4).map((post) => (
              <PostCard
                key={post.id}
                post={post}
                votes={votes}
                comments={comments}
                currentAnonymousProfileId={session?.anonymousProfileId}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
