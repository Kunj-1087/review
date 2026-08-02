/**
 * Review Quality Flagging (Feature 2)
 *
 * Implements two server-side heuristic checks at review submission time:
 *
 * 1. NEAR-DUPLICATE DETECTION
 *    Uses character bigram Jaccard similarity. Two texts are considered
 *    near-duplicates if Jaccard(bigrams(a), bigrams(b)) >= DUPLICATE_THRESHOLD.
 *    This catches copy-paste spam and minor synonym substitutions.
 *
 * 2. GENERIC/TEMPLATE PHRASE DETECTION
 *    Tests against TEMPLATE_PHRASES, a curated list of low-information phrases
 *    frequently found in spam or promotional reviews. Triggers if >= GENERIC_HIT_THRESHOLD
 *    phrases are found.
 *
 * Both checks are intentionally conservative (not auto-reject) to avoid suppressing
 * real student voices. Flagged reviews are submitted normally and land in the
 * moderation queue for human review via a Report record.
 */

import { prisma } from './prisma';

// ─── Tunable Constants ────────────────────────────────────────────────────────

/** Jaccard similarity threshold above which two reviews are deemed near-duplicates. */
const DUPLICATE_THRESHOLD = 0.55;

/**
 * Number of template/generic phrases that must appear in a review text
 * before it is flagged as low-quality. Set conservatively at 3 to avoid
 * false positives on short genuine reviews that happen to use common language.
 */
const GENERIC_HIT_THRESHOLD = 3;

// ─── Template Phrase Dictionary ───────────────────────────────────────────────
// These phrases carry near-zero informational signal about actual college quality.
// They appear frequently in promotional copy, astroturfing, and low-effort reviews.
const TEMPLATE_PHRASES: string[] = [
  'good college',
  'great college',
  'best college',
  'nice college',
  'good faculty',
  'great faculty',
  'nice faculty',
  'good infrastructure',
  'nice infrastructure',
  'good campus',
  'nice campus',
  'overall good',
  'highly recommended',
  'i recommend this college',
  'must join',
  'very good college',
  'excellent college',
  'i love this college',
  'best institution',
  'good placement',
  'nice placement',
];

// ─── Bigram Helpers ───────────────────────────────────────────────────────────

/** Normalise text: lowercase, collapse whitespace, strip punctuation. */
function normalise(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

/** Generate all character bigrams from a string (sliding window of 2 chars). */
function charBigrams(text: string): Set<string> {
  const bigrams = new Set<string>();
  const t = normalise(text);
  for (let i = 0; i < t.length - 1; i++) {
    bigrams.add(t.slice(i, i + 2));
  }
  return bigrams;
}

/** Jaccard similarity between two sets: |intersection| / |union| */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersectionSize = 0;
  for (const item of a) {
    if (b.has(item)) intersectionSize++;
  }
  const unionSize = a.size + b.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export interface QualityCheckResult {
  /** True if text is too similar to an existing review for this college. */
  isDuplicate: boolean;
  /** True if text matches too many template/generic phrases. */
  isGeneric: boolean;
  /** Human-readable reason for moderation queue. Empty string if no flag. */
  flagReason: string;
}

/**
 * Checks a review's text for quality signals before inserting into the
 * moderation queue. Does NOT auto-reject — always returns the result for
 * the caller to decide how to handle.
 *
 * @param text              The review free-text to analyse.
 * @param collegeId         Only compare against reviews for the same college.
 * @param excludeProfileId  Exclude the submitting user's own previous review
 *                          (for edit flow). NOTE: we pass anonymousProfileId,
 *                          never userId, to preserve the privacy boundary.
 */
export async function checkReviewQuality(
  text: string,
  collegeId: string,
  excludeProfileId: string
): Promise<QualityCheckResult> {
  const result: QualityCheckResult = {
    isDuplicate: false,
    isGeneric: false,
    flagReason: '',
  };

  const reasons: string[] = [];

  // ── Check 1: Near-Duplicate Detection ──────────────────────────────────────
  // Fetch existing visible reviews for this college (excluding the submitter's own).
  // Only selects freeText and id — no user_id or anonymousProfileId is exposed.
  const existingReviews = await prisma.review.findMany({
    where: {
      collegeId,
      isHidden: false,
      anonymousProfileId: { not: excludeProfileId },
    },
    select: {
      id: true,
      freeText: true,
      // PRIVACY: anonymousProfileId intentionally omitted from this query.
      // We only need the text content, not who wrote it.
    },
  });

  const newBigrams = charBigrams(text);
  for (const existing of existingReviews) {
    const existingBigrams = charBigrams(existing.freeText);
    const similarity = jaccard(newBigrams, existingBigrams);
    if (similarity >= DUPLICATE_THRESHOLD) {
      result.isDuplicate = true;
      reasons.push(
        `Near-duplicate text detected (Jaccard similarity ${similarity.toFixed(2)} ≥ ${DUPLICATE_THRESHOLD} with review ${existing.id.slice(0, 8)})`
      );
      break; // One match is enough to flag
    }
  }

  // ── Check 2: Generic/Template Phrase Detection ──────────────────────────────
  const normalisedText = normalise(text);
  const hitPhrases: string[] = [];
  for (const phrase of TEMPLATE_PHRASES) {
    if (normalisedText.includes(phrase)) {
      hitPhrases.push(phrase);
    }
  }

  if (hitPhrases.length >= GENERIC_HIT_THRESHOLD) {
    result.isGeneric = true;
    reasons.push(
      `Generic phrasing detected (${hitPhrases.length} template phrases: "${hitPhrases.slice(0, 3).join('", "')}")`
    );
  }

  result.flagReason = reasons.join('; ');
  return result;
}
