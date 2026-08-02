import { getLeaderboardsAction, getCollegesAction } from '@/lib/actions/content';
import Link from 'next/link';
import { Award, BarChart3, Building2, Lock, ArrowLeft, Filter, ArrowRight } from 'lucide-react';

const STREAM_OPTIONS = [
  'ALL', 'Engineering', 'Medical', 'Dental', 'Management',
  'Law', 'Pharmacy', 'Commerce', 'Arts', 'Science', 'Architecture',
];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ stream?: string; city?: string }>;
}) {
  const { stream, city } = await searchParams;

  const [leaderboards, allColleges] = await Promise.all([
    getLeaderboardsAction({ stream: stream || undefined, city: city || undefined }),
    getCollegesAction(),
  ]);

  const uniqueCities = Array.from(new Set(allColleges.map((c) => c.city))).sort();

  const { topRated, mostReviewed } = leaderboards;

  return (
    <div className="space-y-10 pb-16">
      {/* Page Header */}
      <div className="space-y-4">
        <Link
          href="/colleges"
          className="text-xs text-text-secondary hover:text-accent inline-flex items-center gap-1.5 font-mono transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to College Directory</span>
        </Link>

        <div className="bg-background-secondary border border-border rounded-xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-accent" />
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-text-primary">
              Gujarat College Leaderboards
            </h1>
          </div>
          <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
            Rankings are computed from verified student reviews only. A college must have{' '}
            <strong className="text-accent font-mono">≥ 5 verified reviews</strong> to appear in the Top Rated list.
            Filter by stream or city to narrow results.
          </p>

          {/* Filter Form */}
          <form method="GET" className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs font-mono text-text-secondary">
              <Filter className="w-3.5 h-3.5 text-accent" />
              <span>Filter:</span>
            </div>

            {/* Stream Filter */}
            <select
              name="stream"
              defaultValue={stream || 'ALL'}
              className="px-3 py-2 bg-background border border-border rounded-md text-xs text-text-primary focus:outline-none focus:outline-accent font-mono"
            >
              <option value="ALL">All Streams</option>
              {STREAM_OPTIONS.filter((s) => s !== 'ALL').map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* City Filter */}
            <select
              name="city"
              defaultValue={city || 'ALL'}
              className="px-3 py-2 bg-background border border-border rounded-md text-xs text-text-primary focus:outline-none focus:outline-accent font-mono"
            >
              <option value="ALL">All Cities</option>
              {uniqueCities.map((ct) => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-md transition-all shadow-sm font-mono"
            >
              Apply Filters
            </button>

            {(stream && stream !== 'ALL') || (city && city !== 'ALL') ? (
              <Link
                href="/colleges/leaderboard"
                className="px-3 py-2 bg-background border border-border rounded-md text-xs text-text-secondary hover:text-text-primary font-mono transition-colors"
              >
                Clear Filters
              </Link>
            ) : null}
          </form>
        </div>
      </div>

      {/* Two-Column Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Rated */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Award className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-serif font-semibold text-text-primary">Top Rated Colleges</h2>
            <span className="ml-auto text-[11px] font-mono text-text-secondary">
              Weighted Audit Score (≥5 reviews)
            </span>
          </div>

          {topRated.length === 0 ? (
            <div className="p-10 text-center bg-background-secondary border border-border rounded-xl space-y-3">
              <Lock className="w-8 h-8 text-text-secondary mx-auto" />
              <p className="text-sm font-serif font-semibold text-text-primary">No colleges with 5+ reviews yet</p>
              <p className="text-xs text-text-secondary">
                {stream && stream !== 'ALL'
                  ? `No ${stream} colleges have reached the 5-review threshold with the current filters.`
                  : 'Be among the first to write verified reviews to unlock rankings.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topRated.map((college, index) => (
                <Link
                  key={college.id}
                  href={`/colleges/${college.slug}`}
                  className="group flex items-center gap-4 p-4 bg-background-secondary border border-border hover:border-accent rounded-xl transition-all shadow-sm"
                >
                  {/* Rank Badge */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0 border ${
                    index === 0
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : index === 1
                      ? 'bg-background border-border text-text-primary'
                      : index === 2
                      ? 'bg-background border-border text-text-secondary'
                      : 'bg-background border-border text-text-secondary'
                  }`}>
                    #{index + 1}
                  </div>

                  {/* College Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-serif font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                      {college.name}
                    </h3>
                    <p className="text-[11px] font-mono text-text-secondary">
                      {college.city} • {college.stats.reviewCount} verified reviews
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="px-3 py-1.5 rounded-md bg-background border border-border flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-accent" />
                      <span className="font-mono font-bold text-sm text-accent">
                        {college.stats.overallRating}
                      </span>
                      <span className="text-[10px] font-mono text-text-secondary">/ 5.0</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-secondary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Most Reviewed */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-serif font-semibold text-text-primary">Most Reviewed</h2>
            <span className="ml-auto text-[11px] font-mono text-text-secondary">
              By total verified review count
            </span>
          </div>

          {mostReviewed.length === 0 ? (
            <div className="p-10 text-center bg-background-secondary border border-border rounded-xl space-y-3">
              <Building2 className="w-8 h-8 text-text-secondary mx-auto" />
              <p className="text-sm font-serif font-semibold text-text-primary">No reviews yet</p>
              <p className="text-xs text-text-secondary">
                No colleges match the current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mostReviewed.map((college, index) => (
                <Link
                  key={college.id}
                  href={`/colleges/${college.slug}`}
                  className="group flex items-center gap-4 p-4 bg-background-secondary border border-border hover:border-accent rounded-xl transition-all shadow-sm"
                >
                  {/* Rank Badge */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0 border ${
                    index === 0
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'bg-background border-border text-text-secondary'
                  }`}>
                    #{index + 1}
                  </div>

                  {/* College Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-serif font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                      {college.name}
                    </h3>
                    <p className="text-[11px] font-mono text-text-secondary">{college.city}</p>
                  </div>

                  {/* Review Count Bar */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 hidden sm:block">
                      <div className="w-full h-1.5 bg-background border border-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (college.stats.reviewCount / (mostReviewed[0]?.stats.reviewCount || 1)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-accent">
                        {college.stats.reviewCount}
                      </span>
                      <span className="text-[10px] font-mono text-text-secondary ml-1">reviews</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-secondary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* CTA to browse directory */}
      <div className="text-center pt-4">
        <Link
          href="/colleges"
          className="inline-flex items-center gap-2 px-6 py-3 bg-background-secondary border border-border hover:border-accent rounded-xl text-xs font-medium font-mono text-text-primary transition-all"
        >
          <Building2 className="w-4 h-4 text-accent" />
          <span>Browse Full College Directory</span>
          <ArrowRight className="w-3.5 h-3.5 text-accent" />
        </Link>
      </div>
    </div>
  );
}
