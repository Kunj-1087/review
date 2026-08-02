/**
 * Auto-Generated Review Summary (Feature 3)
 *
 * Derives a pros/cons summary per college from real submitted review text.
 * No AI/LLM is used — themes are extracted via term-frequency analysis on
 * the actual free-text reviews grouped by sentiment (rating ≥4 = positive,
 * rating ≤2 = negative).
 *
 * REGENERATION POLICY:
 * Summaries are only regenerated when the visible review count crosses one of
 * the defined SUMMARY_THRESHOLDS (10, 25, 50, 100). This avoids expensive
 * recomputation on every submission while keeping summaries up to date at
 * meaningful milestones.
 *
 * PUBLIC THRESHOLD RULE:
 * No summary is generated for colleges with fewer than MIN_REVIEWS_FOR_SUMMARY
 * visible reviews (enforces same floor as the 5-review public scorecard rule).
 */

import { prisma } from './prisma';

// ─── Tunable Constants ────────────────────────────────────────────────────────

/**
 * Minimum visible reviews before a summary can be generated.
 * Matches the existing 5-review public scorecard threshold.
 */
const MIN_REVIEWS_FOR_SUMMARY = 5;

/**
 * Review count milestones at which a summary is (re)generated.
 * The check is: does the review count CROSS one of these thresholds with the
 * new submission? (i.e. oldCount < threshold && newCount >= threshold)
 */
export const SUMMARY_THRESHOLDS = [10, 25, 50, 100] as const;

/**
 * Number of top recurring terms to include in each sentiment bucket (pros/cons).
 * Kept small so the summary is scannable, not a word dump.
 */
const TOP_TERMS_PER_BUCKET = 5;

/**
 * Minimum document frequency for a term to be included in the summary.
 * Prevents one-off terms from appearing; ensures recurrence across reviews.
 */
const MIN_TERM_FREQUENCY = 2;

// ─── Stop Words ───────────────────────────────────────────────────────────────
// Common English words that carry no information about college quality.
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'as',
  'into', 'through', 'from', 'up', 'down', 'out', 'off', 'over', 'under',
  'that', 'this', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
  'we', 'our', 'i', 'my', 'me', 'he', 'she', 'his', 'her', 'you', 'your',
  'not', 'no', 'also', 'very', 'just', 'so', 'too', 'than', 'then', 'when',
  'if', 'all', 'some', 'many', 'much', 'more', 'most', 'other', 'any',
  'college', 'university', 'institute', 'institution', // Domain-specific stop words
]);

// ─── Text Utilities ───────────────────────────────────────────────────────────

/** Extract meaningful word tokens from text (2+ chars, not stop words, not digits). */
function extractTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w) && isNaN(Number(w)));
}

/** Term frequency map: token → count of reviews containing that token. */
function buildTermFrequency(reviews: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const text of reviews) {
    const tokens = new Set(extractTokens(text)); // dedupe per review
    for (const token of tokens) {
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
  }
  return freq;
}

/** Return the top N terms by frequency, filtered by MIN_TERM_FREQUENCY. */
function topTerms(freq: Map<string, number>, n: number): string[] {
  return [...freq.entries()]
    .filter(([, count]) => count >= MIN_TERM_FREQUENCY)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term]) => term);
}

// ─── Core Exports ─────────────────────────────────────────────────────────────

/**
 * Returns true if a new summary should be generated, i.e. the review count
 * just crossed one of the defined SUMMARY_THRESHOLDS.
 *
 * @param prevCount  Review count BEFORE the new submission.
 * @param newCount   Review count AFTER the new submission.
 */
export function shouldRegenerateSummary(prevCount: number, newCount: number): boolean {
  if (newCount < MIN_REVIEWS_FOR_SUMMARY) return false;
  return SUMMARY_THRESHOLDS.some(
    (threshold) => prevCount < threshold && newCount >= threshold
  );
}

/**
 * Generates and persists a CollegeSummary for the given college.
 * Derives pros from reviews with an overall average rating ≥ 4,
 * and cons from reviews with an overall average rating ≤ 2.
 * Uses term-frequency analysis on real free-text — no LLM.
 *
 * Safe to call on any college — no-ops if the college has fewer than
 * MIN_REVIEWS_FOR_SUMMARY visible reviews.
 */
export async function generateCollegeSummary(collegeId: string): Promise<void> {
  // Fetch all visible reviews (id, freeText, and numeric ratings for sentiment bucket)
  const reviews = await prisma.review.findMany({
    where: { collegeId, isHidden: false },
    select: {
      freeText: true,
      academics: true,
      placements: true,
      infrastructure: true,
      hostel: true,
      feesValue: true,
      facultySupport: true,
      campusLife: true,
      safety: true,
    },
  });

  const reviewCount = reviews.length;
  if (reviewCount < MIN_REVIEWS_FOR_SUMMARY) return;

  // Compute per-review simple average across 8 categories to determine sentiment
  const positiveTexts: string[] = [];
  const negativeTexts: string[] = [];

  for (const r of reviews) {
    const avg =
      (r.academics + r.placements + r.infrastructure + r.hostel +
       r.feesValue + r.facultySupport + r.campusLife + r.safety) / 8;

    if (avg >= 4) positiveTexts.push(r.freeText);
    else if (avg <= 2) negativeTexts.push(r.freeText);
    // avg in (2, 4) is neutral — excluded from summary to reduce noise
  }

  const prosFreq = buildTermFrequency(positiveTexts);
  const consFreq = buildTermFrequency(negativeTexts);

  const pros = topTerms(prosFreq, TOP_TERMS_PER_BUCKET);
  const cons = topTerms(consFreq, TOP_TERMS_PER_BUCKET);

  // Upsert the summary record
  await prisma.collegeSummary.upsert({
    where: { collegeId },
    create: {
      collegeId,
      pros: JSON.stringify(pros),
      cons: JSON.stringify(cons),
      atReviewCount: reviewCount,
    },
    update: {
      pros: JSON.stringify(pros),
      cons: JSON.stringify(cons),
      generatedAt: new Date(),
      atReviewCount: reviewCount,
    },
  });
}
