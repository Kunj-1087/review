'use client';

import { Star } from 'lucide-react';

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(star)}
          className={`${readonly ? 'cursor-default' : 'hover:scale-110 focus:outline-none'} transition-transform`}
        >
          <Star
            className={`${iconSizes[size]} ${
              star <= value
                ? 'text-[var(--color-accent)] fill-[var(--color-accent)]'
                : 'text-[var(--color-border)] fill-[var(--color-border)]'
            }`}
          />
        </button>
      ))}
      <span className="ml-1.5 font-semibold font-mono text-[var(--color-text-primary)] text-xs">{value.toFixed(1)}</span>
    </div>
  );
}

export function CategoryRatingBar({
  label,
  score,
  description,
}: {
  label: string;
  score: number;
  description?: string;
}) {
  const pct = Math.min(100, Math.max(0, (score / 5) * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-[var(--color-text-primary)]">{label}</span>
        <span className="font-mono font-semibold text-[var(--color-text-primary)]">{score.toFixed(1)} <span className="text-[var(--color-text-secondary)] font-normal">/ 5.0</span></span>
      </div>
      {description && <p className="text-[11px] text-[var(--color-text-secondary)] leading-tight">{description}</p>}
      <div className="h-2 w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-[var(--color-accent)] transition-all duration-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
