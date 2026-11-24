import { useEffect, useMemo, useState } from 'react';
import { Check, LogOut, Star, Trash2, UserCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { deleteProductReview, upsertProductReview } from '../data/storefront';
import type { ProductReview, ReviewFitFeedback } from '../data/types';
import {
  type ReviewRatingFilter,
  type ReviewSortOption,
  computeReviewSummary,
  filterAndSortReviews,
  formatReviewTimestamp,
  getFitFeedbackLabel,
  getRatingLabel,
  validateProductReviewInput,
} from '../utils/reviews';

interface ProductReviewsSectionProps {
  productId: string;
  productSlug: string;
  productName: string;
  reviews: ProductReview[];
  reviewsLoading: boolean;
  reviewsError: string | null;
}

const FIT_OPTIONS: { value: ReviewFitFeedback; label: string }[] = [
  { value: 'runs-small', label: 'Runs small' },
  { value: 'true-to-size', label: 'True to size' },
  { value: 'oversized-drape', label: 'Oversized drape' },
];

export function ProductReviewsSection({
  productId,
  productSlug,
  productName,
  reviews,
  reviewsLoading,
  reviewsError,
}: ProductReviewsSectionProps) {
  const {
    customerUser,
    authReady,
    authBusy,
    authError,
    signInCustomer,
    signOutCustomer,
  } = useStore();

  const summary = useMemo(() => computeReviewSummary(reviews), [reviews]);

  const myExistingReview = useMemo(() => {
    if (!customerUser) return null;
    return reviews.find((r) => r.authorUid === customerUser.uid) || null;
  }, [reviews, customerUser]);

  const [ratingFilter, setRatingFilter] = useState<ReviewRatingFilter>('all');
  const [sortBy, setSortBy] = useState<ReviewSortOption>('newest');

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [authorName, setAuthorName] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [fitFeedback, setFitFeedback] = useState<ReviewFitFeedback>('true-to-size');

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    setRatingFilter('all');
    setSortBy('newest');
    setConfirmDelete(false);
    setFormError(null);
    setFormSuccess(null);
  }, [productId]);

  useEffect(() => {
    if (myExistingReview) {
      setRating(myExistingReview.rating);
      setAuthorName(myExistingReview.authorName);
      setCity(myExistingReview.city || '');
      setTitle(myExistingReview.title);
      setComment(myExistingReview.comment);
      setFitFeedback(myExistingReview.fitFeedback || 'true-to-size');
    } else if (customerUser) {
      setAuthorName((prev) => prev || customerUser.displayName || 'Verified Customer');
      setRating(5);
      setTitle('');
      setComment('');
      setCity('');
      setFitFeedback('true-to-size');
    }
    setConfirmDelete(false);
  }, [myExistingReview, customerUser]);

  const visibleReviews = useMemo(
    () => filterAndSortReviews(reviews, ratingFilter, sortBy),
    [reviews, ratingFilter, sortBy]
  );

  const activeStarPreview = hoverRating ?? rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const validation = validateProductReviewInput({
      authorName,
      city,
      rating,
      title,
      comment,
      fitFeedback,
    });
    if (!validation.valid) {
      setFormError(validation.error || 'Please review your rating and feedback.');
      return;
    }

    setSubmitting(true);
    try {
      await upsertProductReview({
        productId,
        productSlug,
        authorName,
        city,
        rating,
        title,
        comment,
        fitFeedback,
      });
      setFormSuccess(myExistingReview ? 'Your review has been updated.' : 'Your review is now live.');
      setConfirmDelete(false);
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Unable to save review right now.';
      if (msg.startsWith('{')) {
        try {
          const parsed = JSON.parse(msg) as { error?: string };
          if (parsed.error?.includes('Missing or insufficient permissions')) {
            msg = 'Please sign in with a verified Google account to publish a review.';
          } else if (parsed.error) {
            msg = parsed.error;
          }
        } catch {
          // Keep original error message
        }
      }
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setFormError(null);
    setFormSuccess(null);
    setDeleting(true);
    try {
      await deleteProductReview(productId);
      setTitle('');
      setComment('');
      setRating(5);
      setConfirmDelete(false);
      setFormSuccess('Your review has been removed.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to remove review right now.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section
      id="customer-reviews"
      aria-labelledby="customer-reviews-heading"
      className="mt-20 pt-14 border-t border-white/[0.08] space-y-10 scroll-mt-28"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-blush)]/65">
            Client Impressions
          </p>
          <h2
            id="customer-reviews-heading"
            className="font-editorial italic text-3xl sm:text-4xl text-white"
          >
            Ratings &amp; Reviews for {productName}
          </h2>
        </div>

        {summary.dominantFit && (
          <p className="text-xs text-white/65">
            Fit consensus:{' '}
            <span className="text-white font-medium">{getFitFeedbackLabel(summary.dominantFit)}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Rating Breakdown + Authenticated Review Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Aggregate Score & Star Distribution */}
          <div className="rounded-[20px] bg-[#131316] border border-white/[0.08] p-6 space-y-6">
            <div className="flex items-end justify-between gap-4 pb-5 border-b border-white/[0.08]">
              <div>
                <div className="flex items-baseline gap-2 tabular-nums">
                  <span
                    className={`font-editorial italic text-5xl leading-none ${
                      summary.totalCount > 0 ? 'text-white' : 'text-white/45'
                    }`}
                  >
                    {summary.totalCount > 0 ? summary.formattedAverage : '0.0'}
                  </span>
                  <span className="text-xs text-white/50">/ 5.0</span>
                </div>
                <p className="text-xs text-white/60 mt-2 tabular-nums">
                  {summary.totalCount === 0
                    ? 'No ratings yet'
                    : `Based on ${summary.totalCount} verified ${summary.totalCount === 1 ? 'review' : 'reviews'}`}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[#F5B082]" aria-label={`Average rating ${summary.formattedAverage} out of 5`}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = summary.totalCount > 0 && star <= Math.round(summary.averageRating);
                  return (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${filled ? 'fill-current' : 'text-white/20'}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Interactive Rating Filter Bars */}
            <div className="space-y-2" role="group" aria-label="Filter reviews by star rating">
              {summary.breakdown.map((row) => {
                const isActive = ratingFilter === row.star;
                return (
                  <button
                    key={row.star}
                    type="button"
                    onClick={() => setRatingFilter(isActive ? 'all' : row.star)}
                    aria-pressed={isActive}
                    className={`w-full min-h-[36px] px-2.5 py-1.5 rounded-lg flex items-center gap-3 text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span className="w-10 text-left font-medium tabular-nums shrink-0">
                      {row.star} ★
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#F5B082] transition-all duration-300"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-white/55 tabular-nums shrink-0">
                      {row.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review Submission Card */}
          <div className="rounded-[20px] bg-[#131316] border border-white/[0.08] p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-medium text-white">
                  {myExistingReview ? 'Update Your Review' : 'Write a Review'}
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  Share fabric weight, drape, and sizing feedback with future wearers.
                </p>
              </div>
              {customerUser && (
                <button
                  type="button"
                  onClick={() => void signOutCustomer()}
                  disabled={authBusy}
                  className="min-h-[36px] px-2.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/55 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              )}
            </div>

            {(authError || formError) && (
              <div
                role="alert"
                className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-200 leading-relaxed"
              >
                {formError || authError}
              </div>
            )}

            {formSuccess && (
              <div
                role="status"
                className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-center gap-2 text-xs text-emerald-200"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {!authReady ? (
              <div className="h-24 rounded-xl bg-white/[0.04] animate-pulse" />
            ) : !customerUser ? (
              <div className="space-y-4 pt-1">
                <p className="text-xs text-white/70 leading-relaxed">
                  Sign in with your Google account to verify your identity and publish a rating to our studio archive.
                </p>
                <button
                  type="button"
                  onClick={() => void signInCustomer()}
                  disabled={authBusy}
                  className="w-full min-h-[46px] px-6 py-3 rounded-full bg-white hover:bg-white/90 text-[#0B0B0C] text-xs font-semibold uppercase tracking-[0.18em] inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{authBusy ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <p className="text-xs text-white/60">
                  Reviewing as{' '}
                  <span className="text-white font-medium">
                    {customerUser.displayName || 'Google Member'}
                  </span>
                </p>

                {/* Star Rating Picker */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/80">Overall Rating</span>
                    <span className="text-xs text-[#F5B082] font-medium tabular-nums">
                      {activeStarPreview}/5 &middot; {getRatingLabel(activeStarPreview)}
                    </span>
                  </div>
                  <div
                    role="radiogroup"
                    aria-label="Select star rating from 1 to 5"
                    className="flex items-center gap-1.5"
                    onMouseLeave={() => setHoverRating(null)}
                  >
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const active = starValue <= activeStarPreview;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onMouseEnter={() => setHoverRating(starValue)}
                          onClick={() => setRating(starValue)}
                          aria-label={`Rate ${starValue} out of 5 stars`}
                          aria-pressed={rating === starValue}
                          className="min-w-[44px] min-h-[44px] rounded-xl bg-[#0B0B0C] border border-white/10 hover:border-white/35 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${
                              active ? 'text-[#F5B082] fill-current' : 'text-white/25'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fit Feedback Selector */}
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-white/80">How did it fit?</span>
                  <div className="grid grid-cols-3 gap-2">
                    {FIT_OPTIONS.map((opt) => {
                      const selected = fitFeedback === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFitFeedback(selected ? '' : opt.value)}
                          aria-pressed={selected}
                          className={`min-h-[40px] px-2.5 py-2 rounded-xl text-[11px] font-medium transition-colors cursor-pointer ${
                            selected
                              ? 'bg-white text-[#0B0B0C]'
                              : 'bg-[#0B0B0C] border border-white/10 text-white/75 hover:border-white/30'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="rev-author" className="block text-xs font-medium text-white/80">
                      Display Name
                    </label>
                    <input
                      id="rev-author"
                      type="text"
                      maxLength={80}
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. Ayesha K."
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#0B0B0C] border border-white/15 text-sm text-white placeholder:text-white/30 focus:border-white outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="rev-city" className="block text-xs font-medium text-white/80">
                      City (Optional)
                    </label>
                    <input
                      id="rev-city"
                      type="text"
                      maxLength={80}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Lahore"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#0B0B0C] border border-white/15 text-sm text-white placeholder:text-white/30 focus:border-white outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="rev-title" className="block text-xs font-medium text-white/80">
                    Review Headline
                  </label>
                  <input
                    id="rev-title"
                    type="text"
                    maxLength={120}
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Sum up your impression in a few words"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#0B0B0C] border border-white/15 text-sm text-white placeholder:text-white/30 focus:border-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="rev-comment" className="block text-xs font-medium text-white/80">
                      Your Review
                    </label>
                    <span className="text-[11px] text-white/45 tabular-nums">
                      {comment.length}/1500
                    </span>
                  </div>
                  <textarea
                    id="rev-comment"
                    rows={4}
                    maxLength={1500}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Comment on fabric weight, warmth, stitching, or sizing..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0C] border border-white/15 text-sm text-white placeholder:text-white/30 focus:border-white outline-none resize-y"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={submitting || deleting}
                    className="flex-1 min-h-[46px] px-6 py-3 rounded-full bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-semibold uppercase tracking-[0.18em] transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    {submitting
                      ? 'Saving...'
                      : myExistingReview
                        ? 'Update Review'
                        : 'Publish Review'}
                  </button>

                  {myExistingReview && !confirmDelete && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="min-h-[46px] px-4 py-3 rounded-full border border-white/15 hover:border-red-400/50 text-xs text-white/75 hover:text-red-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                {myExistingReview && confirmDelete && (
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] text-xs">
                    <span className="text-red-200">Remove your review permanently?</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="min-h-[36px] px-3 rounded-full border border-white/15 text-white/80 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => void handleDelete()}
                        className="min-h-[36px] px-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium disabled:opacity-50 cursor-pointer"
                      >
                        {deleting ? 'Removing...' : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Filter Controls & Reviews Feed */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3 text-xs text-white/65">
              <span className="tabular-nums">
                Showing {visibleReviews.length} of {reviews.length}{' '}
                {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
              {ratingFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setRatingFilter('all')}
                  className="text-[var(--color-primary)] hover:underline cursor-pointer"
                >
                  Clear {ratingFilter}★ filter
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="rev-sort" className="text-xs text-white/55">
                Sort
              </label>
              <select
                id="rev-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ReviewSortOption)}
                className="min-h-[40px] px-3.5 py-2 rounded-full bg-[#131316] border border-white/15 text-xs text-white outline-none focus:border-white cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </div>
          </div>

          {reviewsError && (
            <div role="alert" className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-200">
              Unable to load live customer reviews at the moment.
            </div>
          )}

          {reviewsLoading ? (
            <div className="space-y-4">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className="rounded-[20px] bg-[#131316] border border-white/[0.08] p-6 space-y-3 animate-pulse"
                >
                  <div className="h-4 w-28 bg-white/10 rounded" />
                  <div className="h-5 w-52 bg-white/10 rounded" />
                  <div className="h-12 w-full bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : visibleReviews.length === 0 ? (
            <div className="rounded-[20px] bg-[#131316] border border-white/[0.08] p-8 sm:p-10 text-center space-y-3">
              <p className="font-editorial italic text-2xl text-white">
                {ratingFilter === 'all'
                  ? 'No reviews for this piece yet.'
                  : `No ${ratingFilter}-star reviews yet.`}
              </p>
              <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                {ratingFilter === 'all'
                  ? 'Be the first verified wearer to rate the fleece weight, finish, and drape of this limited run.'
                  : 'Reset the star filter to view all reviews for this hoodie.'}
              </p>
              {ratingFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setRatingFilter('all')}
                  className="mt-2 min-h-[40px] px-5 py-2 rounded-full border border-white/20 hover:border-white text-xs text-white cursor-pointer"
                >
                  Show all reviews
                </button>
              )}
            </div>
          ) : (
            <ul className="rounded-[20px] bg-[#131316] border border-white/[0.08] divide-y divide-white/[0.08]">
              {visibleReviews.map((review) => {
                const isMine = Boolean(customerUser && review.authorUid === customerUser.uid);
                const fitText = getFitFeedbackLabel(review.fitFeedback);
                return (
                  <li key={review.id} className="p-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[#F5B082]" aria-label={`${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= review.rating ? 'fill-current' : 'text-white/20'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-white/45 tabular-nums">
                        {formatReviewTimestamp(review.updatedAt || review.createdAt)}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm sm:text-base font-medium text-white">
                        {review.title}
                      </h4>
                      <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
                        {review.comment}
                      </p>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-white/50">
                      <span className="text-white/80 font-medium">{review.authorName}</span>
                      {review.city && (
                        <>
                          <span aria-hidden="true">&middot;</span>
                          <span>{review.city}</span>
                        </>
                      )}
                      {fitText && (
                        <>
                          <span aria-hidden="true">&middot;</span>
                          <span>Fit: {fitText}</span>
                        </>
                      )}
                      {isMine && (
                        <>
                          <span aria-hidden="true">&middot;</span>
                          <span className="text-[#F5B082]">Your review</span>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
