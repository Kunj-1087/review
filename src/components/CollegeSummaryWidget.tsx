import { ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';

interface CollegeSummaryData {
  pros: string[];
  cons: string[];
  generatedAt: Date | string;
  atReviewCount: number;
}

export default function CollegeSummaryWidget({ summary }: { summary: CollegeSummaryData }) {
  const hasPros = summary.pros.length > 0;
  const hasCons = summary.cons.length > 0;

  if (!hasPros && !hasCons) return null;

  return (
    <div className="bg-background-secondary border border-border rounded-lg p-5 space-y-4 shadow-[0_1px_3px_rgba(31,30,29,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent shrink-0" />
          <h3 className="text-sm font-serif font-semibold text-text-primary">
            Student Voice Summary
          </h3>
        </div>
        <span className="text-[10px] font-mono text-text-secondary px-2 py-0.5 rounded bg-background border border-border">
          From {summary.atReviewCount} reviews
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pros */}
        {hasPros && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-verified uppercase tracking-wide">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Recurring Strengths</span>
            </div>
            <ul className="space-y-1">
              {summary.pros.map((theme) => (
                <li
                  key={theme}
                  className="flex items-center gap-1.5 text-[11px] text-text-primary"
                >
                  <span className="w-1 h-1 rounded-full bg-verified shrink-0" />
                  <span className="capitalize">{theme}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cons */}
        {hasCons && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-warning uppercase tracking-wide">
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>Recurring Concerns</span>
            </div>
            <ul className="space-y-1">
              {summary.cons.map((theme) => (
                <li
                  key={theme}
                  className="flex items-center gap-1.5 text-[11px] text-text-primary"
                >
                  <span className="w-1 h-1 rounded-full bg-warning shrink-0" />
                  <span className="capitalize">{theme}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-[10px] font-mono text-text-secondary pt-1 border-t border-border">
        Derived from recurring terms in verified reviews — updated at 10/25/50/100 review milestones
      </p>
    </div>
  );
}
