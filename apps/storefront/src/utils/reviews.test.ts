import test from 'node:test';
import assert from 'node:assert/strict';
import type { ProductReview } from '../data/types';
import {
  buildProductReviewId,
  computeReviewSummary,
  filterAndSortReviews,
  getFitFeedbackLabel,
  getRatingLabel,
  validateProductReviewInput,
} from './reviews';

const SAMPLE_REVIEWS: ProductReview[] = [
  {
    id: 'p1_u1',
    productId: 'p1',
    productSlug: 'obsidian-arch-hoodie',
    authorUid: 'u1',
    authorName: 'Zara M.',
    city: 'Lahore',
    rating: 5,
    title: 'Architectural weight',
    comment: 'Stands up cleanly on the hood without collapsing and feels warm in December.',
    fitFeedback: 'oversized-drape',
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
  },
  {
    id: 'p1_u2',
    productId: 'p1',
    productSlug: 'obsidian-arch-hoodie',
    authorUid: 'u2',
    authorName: 'Amina T.',
    city: 'Islamabad',
    rating: 4,
    title: 'Soft brushed fleece',
    comment: 'Very plush interior fleece and deep cuffs. Runs relaxed as expected.',
    fitFeedback: 'oversized-drape',
    createdAt: '2026-11-14T10:00:00Z',
    updatedAt: '2026-11-14T10:00:00Z',
  },
  {
    id: 'p1_u3',
    productId: 'p1',
    productSlug: 'obsidian-arch-hoodie',
    authorUid: 'u3',
    authorName: 'Sana R.',
    city: 'Karachi',
    rating: 3,
    title: 'Heavy for mild winters',
    comment: 'Beautiful finishing and stitchwork, just quite heavy for coastal weather.',
    fitFeedback: 'true-to-size',
    createdAt: '2026-11-12T10:00:00Z',
    updatedAt: '2026-11-12T10:00:00Z',
  },
];

test('buildProductReviewId deterministically composes productId and uid and rejects invalid characters', () => {
  assert.equal(buildProductReviewId('obsidian-arch-hoodie', 'uid123'), 'obsidian-arch-hoodie_uid123');
  assert.throws(() => buildProductReviewId('', 'uid123'));
  assert.throws(() => buildProductReviewId('bad/id', 'uid123'));
});

test('validateProductReviewInput enforces rating 1..5, headline, and comment bounds', () => {
  const invalidRating = validateProductReviewInput({
    authorName: 'Hira',
    city: 'Lahore',
    rating: 0,
    title: 'Great',
    comment: 'Enough words for validation here.',
    fitFeedback: 'true-to-size',
  });
  assert.equal(invalidRating.valid, false);

  const shortComment = validateProductReviewInput({
    authorName: 'Hira',
    city: 'Lahore',
    rating: 5,
    title: 'Amazing hoodie',
    comment: 'Too short',
    fitFeedback: 'true-to-size',
  });
  assert.equal(shortComment.valid, false);

  const valid = validateProductReviewInput({
    authorName: '  Hira K. ',
    city: ' Lahore ',
    rating: 5,
    title: ' Best heavyweight hoodie ',
    comment: '  The 500 gsm organic cotton drape is structured and super warm.  ',
    fitFeedback: 'oversized-drape',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.normalized?.authorName, 'Hira K.');
  assert.equal(valid.normalized?.city, 'Lahore');
  assert.equal(valid.normalized?.rating, 5);
});

test('computeReviewSummary aggregates average, star distribution, and dominant fit', () => {
  const summary = computeReviewSummary(SAMPLE_REVIEWS);
  assert.equal(summary.totalCount, 3);
  assert.equal(summary.formattedAverage, '4.0');
  assert.equal(summary.dominantFit, 'oversized-drape');
  assert.deepEqual(
    summary.breakdown.map((b) => ({ star: b.star, count: b.count })),
    [
      { star: 5, count: 1 },
      { star: 4, count: 1 },
      { star: 3, count: 1 },
      { star: 2, count: 0 },
      { star: 1, count: 0 },
    ]
  );

  const empty = computeReviewSummary([]);
  assert.equal(empty.totalCount, 0);
  assert.equal(empty.formattedAverage, '0.0');
  assert.equal(empty.dominantFit, '');
});

test('filterAndSortReviews filters by star tier and sorts newest, highest, and lowest', () => {
  const newest = filterAndSortReviews(SAMPLE_REVIEWS, 'all', 'newest');
  assert.deepEqual(
    newest.map((r) => r.id),
    ['p1_u2', 'p1_u3', 'p1_u1']
  );

  const highest = filterAndSortReviews(SAMPLE_REVIEWS, 'all', 'highest');
  assert.deepEqual(
    highest.map((r) => r.rating),
    [5, 4, 3]
  );

  const lowest = filterAndSortReviews(SAMPLE_REVIEWS, 'all', 'lowest');
  assert.deepEqual(
    lowest.map((r) => r.rating),
    [3, 4, 5]
  );

  const onlyFourStars = filterAndSortReviews(SAMPLE_REVIEWS, 4, 'newest');
  assert.equal(onlyFourStars.length, 1);
  assert.equal(onlyFourStars[0].authorName, 'Amina T.');
});

test('getRatingLabel and getFitFeedbackLabel return human-readable descriptors', () => {
  assert.equal(getRatingLabel(5), 'Exceptional');
  assert.equal(getRatingLabel(1), 'Poor');
  assert.equal(getFitFeedbackLabel('true-to-size'), 'True to size');
  assert.equal(getFitFeedbackLabel(''), '');
});
