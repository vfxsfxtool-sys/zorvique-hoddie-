import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronDown, Heart, Ruler, ShoppingBag, Star, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useProductTransition } from '../context/ProductTransitionContext';
import { fetchProductBySlug, subscribeToProductReviews } from '../data/storefront';
import type { Product, ProductReview } from '../data/types';
import { SeoHead } from '../components/SeoHead';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { ProductReviewsSection } from '../components/ProductReviewsSection';
import { Footer } from '../components/Footer';
import { formatPKR } from '../utils/commerce';
import { computeReviewSummary } from '../utils/reviews';
import { buildProductSeoMetadata } from '../utils/seo';

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAnimatingToSlug } = useProductTransition();
  const isFlyingIn = isAnimatingToSlug(slug);
  const {
    products,
    loading: storeLoading,
    testimonials,
    settings,
    wishlist,
    toggleWishlist,
    addToCart,
  } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrySeed, setRetrySeed] = useState(0);
  const [selectedColourIdx, setSelectedColourIdx] = useState(0);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [openAccordion, setOpenAccordion] = useState<'details' | 'shipping' | 'reviews' | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      const fromCache = products.find((p) => p.slug === slug);
      if (fromCache) {
        if (active) {
          setProduct(fromCache);
          setLoading(false);
        }
        return;
      }
      if (!slug) {
        if (active) {
          setProduct(null);
          setLoading(false);
        }
        return;
      }
      try {
        const fetched = await fetchProductBySlug(slug);
        if (active) {
          setProduct(fetched);
        }
      } catch (err) {
        if (active) {
          setProduct(null);
          setLoadError(err instanceof Error ? err.message : 'Unable to load product from Firestore.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    if (!storeLoading) {
      void load();
    }
    return () => {
      active = false;
    };
  }, [slug, products, storeLoading, retrySeed]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    setSelectedColourIdx(0);
    setSelectedImageIdx(0);
    if (product && product.sizes.length > 0) {
      const firstAvailable = product.sizes.find((s) => s.stock > 0) || product.sizes[0];
      setSelectedSize(firstAvailable.label);
    }
  }, [product]);

  useEffect(() => {
    if (!product?.id) {
      setReviews([]);
      setReviewsLoading(false);
      return;
    }
    setReviewsLoading(true);
    setReviewsError(null);
    const unsubscribe = subscribeToProductReviews(
      product.id,
      (items) => {
        setReviews(items);
        setReviewsLoading(false);
      },
      (err) => {
        setReviewsError(err.message);
        setReviewsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [product?.id]);

  const reviewSummary = useMemo(() => computeReviewSummary(reviews), [reviews]);

  const activeColour = product?.colourways[selectedColourIdx] || product?.colourways[0];
  const images = activeColour?.images || [];
  const heroImage = images[selectedImageIdx] || images[0] || '';
  const activeSizeObj = product?.sizes.find((s) => s.label === selectedSize);

  const pieceIndex = useMemo(() => {
    const idx = product ? products.findIndex((p) => p.id === product.id) : -1;
    return idx >= 0 ? `No. ${String(idx + 1).padStart(2, '0')}` : product?.sku || 'No. 01';
  }, [products, product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products.filter((p) => p.id !== product.id).slice(0, 3);
  }, [products, product]);

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const productSeo = useMemo(() => {
    if (!product) return null;
    return buildProductSeoMetadata({
      product,
      brandName: settings.brandName,
      heroImage,
      fallbackOgImage: settings.seo.ogImage,
      siteOrigin,
      reviewCount: reviewSummary.totalCount,
      averageRatingLabel: reviewSummary.formattedAverage,
    });
  }, [
    product,
    settings.brandName,
    settings.seo.ogImage,
    heroImage,
    siteOrigin,
    reviewSummary.totalCount,
    reviewSummary.formattedAverage,
  ]);

  const handleAdd = (goCheckout: boolean) => {
    if (!product || !activeSizeObj || activeSizeObj.stock <= 0) return;
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        size: activeSizeObj.label,
        colour: activeColour?.name || 'Default',
        colourHex: activeColour?.hex || '#9E0B14',
        imageUrl: heroImage,
        qty: 1,
        maxStock: activeSizeObj.stock,
      },
      { openCart: !goCheckout }
    );
    if (goCheckout) {
      navigate('/checkout');
    }
  };

  if (loading || storeLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-10 py-10 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-6">
              <div
                data-pdp-hero-frame
                className="rounded-[20px] bg-[#0E0E10] border border-white/[0.08] aspect-[4/5] p-6 sm:p-10 flex items-center justify-center"
              >
                <div data-pdp-hero-stage className="w-full h-full rounded-2xl bg-[#131316]/70 animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-6 h-[460px] rounded-[20px] bg-[#131316] animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col">
        <SeoHead title="Unable to Load Piece" noIndex />
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div role="alert" className="rounded-[20px] bg-[#131316] border border-red-500/30 p-10 text-center max-w-md space-y-4">
            <h1 className="font-editorial italic text-3xl text-white">Unable to Load Piece</h1>
            <p className="text-sm text-red-200/80">{loadError}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setRetrySeed((v) => v + 1)}
                className="px-6 py-2.5 rounded-full bg-white text-[#0B0B0C] text-[11px] uppercase tracking-[0.2em] font-semibold cursor-pointer"
              >
                Retry
              </button>
              <Link
                to="/"
                className="inline-flex px-6 py-2.5 rounded-full border border-white/25 hover:border-white text-white text-[11px] uppercase tracking-[0.2em] font-medium"
              >
                Back to the Rack
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col">
        <SeoHead title="Piece Not Found" noIndex />
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="rounded-[20px] bg-[#131316] border border-white/10 p-10 text-center max-w-md space-y-4">
            <h1 className="font-editorial italic text-3xl text-white">Piece Not Found</h1>
            <p className="text-sm text-white/60">This run has ended or is not published yet.</p>
            <Link
              to="/"
              className="inline-flex px-7 py-3 rounded-full border border-white/25 hover:border-white text-white text-[11px] uppercase tracking-[0.2em] font-medium"
            >
              Back to the Rack
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isSaved = wishlist.includes(product.id);
  const availableSizeList = product.sizes.filter((s) => s.stock > 0).map((s) => s.label).join(', ');

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col">
      <SeoHead
        title={productSeo?.title || product.name}
        description={productSeo?.description || product.description}
        canonicalPath={productSeo?.canonicalPath || `/product/${product.slug}`}
        imageUrl={productSeo?.imageUrl || heroImage}
        ogType="product"
        productMeta={{
          priceAmount: product.price,
          currency: 'PKR',
          availability: productSeo?.availability,
          brand: settings.brandName,
        }}
        jsonLd={productSeo?.jsonLd || null}
      />
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-10 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Framed Dark Studio Card */}
          <div className="lg:col-span-6 space-y-4">
            <div
              data-pdp-hero-frame
              className="rounded-[20px] overflow-hidden bg-[#0E0E10] border border-white/[0.08] aspect-[4/5] p-6 sm:p-10 flex items-center justify-center"
            >
              <div data-pdp-hero-stage className="w-full h-full flex items-center justify-center">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={`${product.name} — ${activeColour?.name || ''}`}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-contain mix-blend-lighten garment-vignette transition-opacity duration-200 ${
                      isFlyingIn ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-center">
                    <span className="font-editorial italic text-3xl text-white/75">{product.name}</span>
                  </div>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    aria-label={`View image ${idx + 1}`}
                    className={`rounded-xl overflow-hidden aspect-square bg-[#131316] border transition-colors cursor-pointer ${
                      selectedImageIdx === idx ? 'border-white' : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} view ${idx + 1}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Dropday Editorial Purchase & Availability Column */}
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-blush)]/65">
                {pieceIndex} &middot; Tailored Women&apos;s Fit &middot; {product.badges[0] || 'Hoodie'}
              </p>

              <h1 className="font-editorial italic text-4xl sm:text-6xl text-white leading-[1.05] text-balance">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-baseline gap-3 tabular-nums pt-1">
                <span className="text-lg font-medium text-white">{formatPKR(product.price)}</span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-sm text-white/40 line-through">
                    {formatPKR(product.compareAtPrice)}
                  </span>
                )}
              </div>

              <a
                href="#customer-reviews"
                className="inline-flex items-center gap-2 pt-1 text-xs text-white/70 hover:text-white transition-colors"
              >
                <span className="inline-flex items-center gap-0.5 text-[#F5B082]" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        reviewSummary.totalCount > 0 && s <= Math.round(reviewSummary.averageRating)
                          ? 'fill-current'
                          : 'text-white/20'
                      }`}
                    />
                  ))}
                </span>
                <span className="tabular-nums">
                  {reviewSummary.totalCount > 0
                    ? `${reviewSummary.formattedAverage} · ${reviewSummary.totalCount} ${reviewSummary.totalCount === 1 ? 'review' : 'reviews'}`
                    : 'No reviews yet · Write a review'}
                </span>
              </a>
            </div>

            <div className="border-t border-white/10 pt-5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-blush)]/55">
                Availability
              </p>
              <p className="text-sm text-white">
                {availableSizeList ? `In stock · ${availableSizeList}` : 'Sold out · No restocks'}
              </p>
            </div>

            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              {product.description}
            </p>

            <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
              {product.fabric}
            </p>

            {/* Colourway Swatches (if multiple) */}
            {product.colourways.length > 1 && (
              <div className="space-y-2.5 pt-1">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                  Wash: <span className="text-white">{activeColour?.name}</span>
                </p>
                <div className="flex items-center gap-3">
                  {product.colourways.map((cw, idx) => {
                    const selected = idx === selectedColourIdx;
                    return (
                      <button
                        key={`${cw.name}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedColourIdx(idx);
                          setSelectedImageIdx(0);
                        }}
                        aria-label={`Select ${cw.name}`}
                        aria-pressed={selected}
                        className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                          selected
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0B0B0C]'
                            : 'opacity-75 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: cw.hex }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                  Size: <strong className="text-white">{selectedSize || 'Select'}</strong>
                  {activeSizeObj && (
                    <span className="ml-2 text-white/50">
                      ({activeSizeObj.stock > 0 ? `${activeSizeObj.stock} left` : 'Out'})
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/65 hover:text-white underline cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const selected = selectedSize === s.label;
                  const out = s.stock <= 0;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      disabled={out}
                      onClick={() => setSelectedSize(s.label)}
                      className={`min-w-[52px] min-h-[44px] px-4 rounded-full text-xs font-medium tracking-wider transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                        selected
                          ? 'bg-white text-[#0B0B0C]'
                          : 'bg-[#141416] text-white/80 border border-white/15 hover:border-white/40'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Row */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                disabled={!activeSizeObj || activeSizeObj.stock <= 0}
                onClick={() => handleAdd(false)}
                className="min-h-[48px] px-7 py-3 rounded-full bg-[var(--color-primary)] hover:opacity-90 text-white text-[11px] font-semibold uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 transition-opacity disabled:opacity-40 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{activeSizeObj && activeSizeObj.stock > 0 ? 'Add to Bag' : 'Sold Out'}</span>
              </button>
              <button
                type="button"
                disabled={!activeSizeObj || activeSizeObj.stock <= 0}
                onClick={() => handleAdd(true)}
                className="min-h-[48px] px-7 py-3 rounded-full border border-white/30 hover:border-white hover:bg-white hover:text-[#0B0B0C] text-white text-[11px] font-medium uppercase tracking-[0.2em] transition-all disabled:opacity-40 cursor-pointer"
              >
                Buy Now &amp; Checkout
              </button>
              <Link
                to={`/studio?piece=${encodeURIComponent(product.slug)}`}
                className="min-h-[48px] px-5 py-3 rounded-full border border-[var(--color-blush)]/30 hover:border-white text-[var(--color-blush)] hover:text-white text-[11px] font-medium uppercase tracking-[0.2em] inline-flex items-center justify-center transition-colors"
              >
                Inspect in 3D
              </Link>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                aria-pressed={isSaved}
                className={`min-w-[48px] min-h-[48px] rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-white/20 text-white/75 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <Link
                to="/"
                className="min-h-[48px] px-2 inline-flex items-center text-[11px] uppercase tracking-[0.22em] text-white/55 hover:text-white transition-colors"
              >
                Back to the Rack
              </Link>
            </div>

            {/* Clean Accordions */}
            <div className="divide-y divide-white/10 border-t border-white/10 pt-2">
              <div>
                <button
                  type="button"
                  aria-expanded={openAccordion === 'shipping'}
                  onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                  className="w-full py-4 flex items-center justify-between text-left text-xs uppercase tracking-[0.18em] font-medium text-white cursor-pointer"
                >
                  <span>Pakistan Dispatch &amp; Exchanges</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'shipping' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'shipping' && (
                  <div className="pb-4 text-sm text-white/65 space-y-2 leading-relaxed">
                    <p>Dispatched via TCS, Leopard, or Trax across Lahore, Karachi, Islamabad, and all Pakistan cities within 24–48 business hours.</p>
                    <p>7-day unused exchange window with original numbered Zorvique tags intact.</p>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  aria-expanded={openAccordion === 'reviews'}
                  onClick={() => setOpenAccordion(openAccordion === 'reviews' ? null : 'reviews')}
                  className="w-full py-4 flex items-center justify-between text-left text-xs uppercase tracking-[0.18em] font-medium text-white cursor-pointer"
                >
                  <span>Boutique Testimonials ({testimonials.length})</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'reviews' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'reviews' && (
                  <div className="pb-4 space-y-3">
                    {testimonials.length === 0 ? (
                      <p className="text-xs text-white/55">No client notes published yet.</p>
                    ) : (
                      testimonials.slice(0, 3).map((t) => (
                        <div key={t.id} className="rounded-xl bg-[#131316] border border-white/[0.06] p-3.5 space-y-1.5">
                          <div className="flex items-center gap-1 text-[var(--color-primary)]">
                            {Array.from({ length: t.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                          <p className="text-xs text-white/85">&ldquo;{t.text}&rdquo;</p>
                          <p className="text-[11px] text-white/50">{t.name} &middot; {t.city}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Ratings & Verified Client Reviews */}
        <ProductReviewsSection
          productId={product.id}
          productSlug={product.slug}
          productName={product.name}
          reviews={reviews}
          reviewsLoading={reviewsLoading}
          reviewsError={reviewsError}
        />

        {/* Related Drop Pieces */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-white/[0.08]">
            <h2 className="font-editorial italic text-3xl sm:text-4xl text-white mb-8">
              Also on the Rack
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((rel, idx) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  index={idx}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Zorvique Size Guide"
          onClick={() => setSizeGuideOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[20px] bg-[#141416] border border-white/10 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-editorial italic text-2xl text-white">Cut &amp; Dimension Profile</h2>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                aria-label="Close size guide"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/60">
              Relaxed drop-shoulder women&apos;s silhouette measured in inches (flat garment width).
            </p>
            <table className="w-full text-sm text-left tabular-nums">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-white/55">
                  <th className="py-2">Size</th>
                  <th className="py-2">Chest</th>
                  <th className="py-2">Length</th>
                  <th className="py-2">Sleeve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/85">
                <tr><td className="py-2.5 font-semibold">S</td><td>46&quot;</td><td>26.5&quot;</td><td>22.5&quot;</td></tr>
                <tr><td className="py-2.5 font-semibold">M</td><td>49&quot;</td><td>27.5&quot;</td><td>23.0&quot;</td></tr>
                <tr><td className="py-2.5 font-semibold">L</td><td>52&quot;</td><td>28.5&quot;</td><td>23.5&quot;</td></tr>
                <tr><td className="py-2.5 font-semibold">XL</td><td>55&quot;</td><td>29.5&quot;</td><td>24.0&quot;</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
