import type { ProductReview, ReviewFitFeedback } from '../data/types';

export type ReviewSortOption = 'newest' | 'highest' | 'lowest';
export type ReviewRatingFilter = 'all' | 1 | 2 | 3 | 4 | 5;

export interface ReviewDraftInput {
  authorName: string;
  city: string;
  rating: number;
  title: string;
  comment: string;
  fitFeedback: ReviewFitFeedback;
}

export interface NormalizedReviewInput {
  authorName: string;
  city: string;
  rating: number;
  title: string;
  comment: string;
  fitFeedback: ReviewFitFeedback;
}

export interface ReviewBreakdownRow {
  star: 5 | 4 | 3 | 2 | 1;
  count: number;
  percentage: number;
}

export interface ReviewSummary {
  totalCount: number;
  averageRating: number;
  formattedAverage: string;
  breakdown: ReviewBreakdownRow[];
  fitCounts: {
    'runs-small': number;
    'true-to-size': number;
    'oversized-drape': number;
  };
  dominantFit: ReviewFitFeedback;
}

const VALID_ID_PART_RE = /^[a-zA-Z0-9_-]+$/;
const ALLOWED_FIT_VALUES: readonly ReviewFitFeedback[] = [
  '',
  'runs-small',
  'true-to-size',
  'oversized-drape',
];

export function buildProductReviewId(productId: string, uid: string): string {
  const cleanProductId = productId.trim();
  const cleanUid = uid.trim();
  if (!cleanProductId || !cleanUid) {
    throw new Error('Both product ID and user ID are required.');
  }
  if (!VALID_ID_PART_RE.test(cleanProductId) || !VALID_ID_PART_RE.test(cleanUid)) {
    throw new Error('Invalid characters in review identifier.');
  }
  const combined = `${cleanProductId}_${cleanUid}`;
  if (combined.length > 128) {
    throw new Error('Review identifier exceeds maximum length.');
  }
  return combined;
}

export function getRatingLabel(rating: number): string {
  switch (Math.round(rating)) {
    case 5:
      return 'Exceptional';
    case 4:
      return 'Very Good';
    case 3:
      return 'Good';
    case 2:
      return 'Fair';
    case 1:
      return 'Poor';
    default:
      return 'Select rating';
  }
}

export function getFitFeedbackLabel(fit: ReviewFitFeedback): string {
  switch (fit) {
    case 'runs-small':
      return 'Runs small';
    case 'true-to-size':
      return 'True to size';
    case 'oversized-drape':
      return 'Oversized drape';
    default:
      return '';
  }
}

export function validateProductReviewInput(input: ReviewDraftInput): {
  valid: boolean;
  error?: string;
  normalized?: NormalizedReviewInput;
} {
  const rating = input.rating;
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { valid: false, error: 'Please select a star rating from 1 to 5.' };
  }

  const authorName = input.authorName.trim();
  if (authorName.length < 1 || authorName.length > 80) {
    return { valid: false, error: 'Display name must be between 1 and 80 characters.' };
  }

  const city = input.city.trim();
  if (city.length > 80) {
    return { valid: false, error: 'City must be 80 characters or fewer.' };
  }

  const title = input.title.trim();
  if (title.length < 1 || title.length > 120) {
    return { valid: false, error: 'Review headline must be between 1 and 120 characters.' };
  }

  const comment = input.comment.trim();
  if (comment.length < 10 || comment.length > 1500) {
    return {
      valid: false,
      error: 'Please write at least 10 characters of feedback (max 1,500).',
    };
  }

  const fitFeedback = ALLOWED_FIT_VALUES.includes(input.fitFeedback) ? input.fitFeedback : '';

  return {
    valid: true,
    normalized: {
      authorName,
      city,
      rating,
      title,
      comment,
      fitFeedback,
    },
  };
}

export function parseReviewTimestampMs(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object') {
    const candidate = value as { toMillis?: () => number; seconds?: number };
    if (typeof candidate.toMillis === 'function') {
      return candidate.toMillis();
    }
    if (typeof candidate.seconds === 'number') {
      return candidate.seconds * 1000;
    }
  }
  return 0;
}

export function formatReviewTimestamp(value: unknown): string {
  const ms = parseReviewTimestampMs(value);
  if (!ms) return 'Just now';
  return new Date(ms).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function computeReviewSummary(reviews: ProductReview[]): ReviewSummary {
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const fitCounts = {
    'runs-small': 0,
    'true-to-size': 0,
    'oversized-drape': 0,
  };

  let ratingSum = 0;
  let validCount = 0;

  for (const review of reviews) {
    const star = Math.round(review.rating);
    if (star >= 1 && star <= 5) {
      counts[star as 1 | 2 | 3 | 4 | 5] += 1;
      ratingSum += star;
      validCount += 1;
    }
    if (
      review.fitFeedback === 'runs-small' ||
      review.fitFeedback === 'true-to-size' ||
      review.fitFeedback === 'oversized-drape'
    ) {
      fitCounts[review.fitFeedback] += 1;
    }
  }

  const averageRating = validCount > 0 ? ratingSum / validCount : 0;
  const formattedAverage = validCount > 0 ? averageRating.toFixed(1) : '0.0';

  const breakdown: ReviewBreakdownRow[] = ([5, 4, 3, 2, 1] as const).map((star) => ({
    star,
    count: counts[star],
    percentage: validCount > 0 ? Math.round((counts[star] / validCount) * 100) : 0,
  }));

  let dominantFit: ReviewFitFeedback = '';
  let maxFitCount = 0;
  (['true-to-size', 'oversized-drape', 'runs-small'] as const).forEach((key) => {
    if (fitCounts[key] > maxFitCount) {
      maxFitCount = fitCounts[key];
      dominantFit = key;
    }
  });

  return {
    totalCount: validCount,
    averageRating,
    formattedAverage,
    breakdown,
    fitCounts,
    dominantFit,
  };
}

export function filterAndSortReviews(
  reviews: ProductReview[],
  ratingFilter: ReviewRatingFilter = 'all',
  sortBy: ReviewSortOption = 'newest'
): ProductReview[] {
  const filtered =
    ratingFilter === 'all'
      ? [...reviews]
      : reviews.filter((r) => Math.round(r.rating) === ratingFilter);

  return filtered.sort((a, b) => {
    if (sortBy === 'highest') {
      if (b.rating !== a.rating) return b.rating - a.rating;
    } else if (sortBy === 'lowest') {
      if (a.rating !== b.rating) return a.rating - b.rating;
    }
    const timeDiff = parseReviewTimestampMs(b.createdAt) - parseReviewTimestampMs(a.createdAt);
    if (timeDiff !== 0) return timeDiff;
    return parseReviewTimestampMs(b.updatedAt) - parseReviewTimestampMs(a.updatedAt);
  });
}
