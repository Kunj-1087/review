import Link from 'next/link';
import { Award, MapPin, Users, GitBranch, Shuffle } from 'lucide-react';

interface SimilarCollege {
  id: string;
  name: string;
  slug: string;
  city: string;
  type: string;
  streams: string[];
  overallRating: number;
  reviewCount: number;
  similarity: number;
  sharedStreams: string[];
  sameCity: boolean;
}

export default function SimilarColleges({ colleges }: { colleges: SimilarCollege[] }) {
  if (colleges.length === 0) return null;

  return (
    <div className="bg-background-secondary border border-border rounded-lg p-5 space-y-4 shadow-[0_1px_3px_rgba(31,30,29,0.08)]">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Shuffle className="w-4 h-4 text-accent shrink-0" />
        <h3 className="text-sm font-serif font-semibold text-text-primary">
          Colleges Like This One
        </h3>
      </div>

      <div className="space-y-3">
        {colleges.map((college) => (
          <Link
            key={college.id}
            href={`/colleges/${college.slug}`}
            className="group block p-3.5 rounded-lg bg-background border border-border hover:border-accent transition-all"
          >
            {/* Name + Rating */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-serif font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                  {college.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-text-secondary">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{college.city}</span>
                  <span>•</span>
                  <span>{college.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-background-secondary border border-border px-2 py-1 rounded-md shrink-0">
                <Award className="w-3 h-3 text-accent" />
                <span className="font-mono font-bold text-xs text-accent">{college.overallRating}</span>
              </div>
            </div>

            {/* Why matched */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {college.sameCity && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent">
                  <MapPin className="w-2.5 h-2.5" />
                  Same city
                </span>
              )}
              {college.sharedStreams.slice(0, 2).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-verified/10 border border-verified/20 text-verified"
                >
                  <GitBranch className="w-2.5 h-2.5" />
                  {s}
                </span>
              ))}
            </div>

            {/* Review count */}
            <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-text-secondary">
              <Users className="w-3 h-3" />
              <span>{college.reviewCount} verified reviews</span>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-[10px] font-mono text-text-secondary pt-1 border-t border-border">
        Ranked by rating-vector similarity + shared streams/city
      </p>
    </div>
  );
}
