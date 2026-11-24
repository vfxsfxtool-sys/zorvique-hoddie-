import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Box, ChevronLeft, ChevronRight, Heart, Menu, MessageCircle, Search, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useProductTransition } from '../context/ProductTransitionContext';
import { buildRackItems } from '../data/studioRack';
import { formatPKR } from '../utils/commerce';
import { buildWhatsAppHref } from '../utils/whatsapp';
import { normalizeSlideDirection } from '../utils/transition';
import { GlobalSearchBar } from './GlobalSearchBar';

function toGothicDisplay(name: string): string {
  const clean = name.trim() || 'Zorvique';
  if (clean === clean.toUpperCase()) {
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }
  return clean;
}

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir * 64,
    scale: 0.94,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -64,
    scale: 0.94,
  }),
};

export function Hero() {
  const {
    loading,
    error,
    reloadCatalog,
    settings,
    homepage,
    heroSlides,
    products,
    cart,
    wishlist,
    setCartOpen,
    setWishlistOpen,
    addToCart,
  } = useStore();
  const navigate = useNavigate();
  const { navigateToProduct } = useProductTransition();
  const prefersReducedMotion = useReducedMotion();

  const rackItems = useMemo(
    () => buildRackItems(products, heroSlides),
    [products, heroSlides]
  );

  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [sizeSelections, setSizeSelections] = useState<Record<string, string>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const viewerStageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const brandTitle = toGothicDisplay(settings.brandName);
  const currentPiece = rackItems[activeIndex % Math.max(1, rackItems.length)] || rackItems[0];
  const selectedSize =
    (currentPiece && sizeSelections[currentPiece.id]) ||
    currentPiece?.sizes.find((s) => s.stock > 0)?.label ||
    currentPiece?.sizes[0]?.label ||
    'M';

  const openSpotlight = useCallback(
    (idx: number) => {
      setDirection(normalizeSlideDirection(idx, activeIndex, rackItems.length));
      setActiveIndex(idx);
      setViewerOpen(true);
    },
    [activeIndex, rackItems.length]
  );

  const goNext = useCallback(() => {
    if (rackItems.length <= 1) return;
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % rackItems.length);
  }, [rackItems.length]);

  const goPrev = useCallback(() => {
    if (rackItems.length <= 1) return;
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + rackItems.length) % rackItems.length);
  }, [rackItems.length]);

  useEffect(() => {
    if (!viewerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerOpen(false);
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewerOpen, goNext, goPrev]);

  const saveDataEnabled =
    typeof navigator !== 'undefined' &&
    Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

  const activeSizeObj = useMemo(() => {
    if (!currentPiece || currentPiece.sizes.length === 0) return null;
    return (
      currentPiece.sizes.find((s) => s.label === selectedSize) ||
      currentPiece.sizes.find((s) => s.stock > 0) ||
      currentPiece.sizes[0]
    );
  }, [currentPiece, selectedSize]);

  const handleQuickAddFromViewer = (goCheckout = false) => {
    if (!currentPiece) return;
    const matched = products.find((p) => p.id === currentPiece.id);
    if (!matched) return;
    const chosenSize =
      matched.sizes.find((s) => s.label === (activeSizeObj?.label || selectedSize)) ||
      matched.sizes.find((s) => s.stock > 0) ||
      matched.sizes[0];
    if (!chosenSize || chosenSize.stock <= 0) return;

    addToCart({
      productId: matched.id,
      slug: matched.slug,
      name: matched.name,
      price: matched.price,
      compareAtPrice: matched.compareAtPrice,
      size: chosenSize.label,
      colour: currentPiece.colourName,
      colourHex: currentPiece.colourHex,
      imageUrl: currentPiece.imageUrl,
      qty: 1,
      maxStock: chosenSize.stock,
    });
    setViewerOpen(false);
    if (goCheckout) {
      setCartOpen(false);
      navigate('/checkout');
    }
  };

  const handleViewerSeeAvailability = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!currentPiece) return;
    e.preventDefault();
    const stageEl = viewerStageRef.current;
    navigateToProduct(currentPiece.slug, stageEl, {
      imageUrl: currentPiece.imageUrl,
      name: currentPiece.name,
    });
    setViewerOpen(false);
  };

  const tickerText = `${settings.brandName.toUpperCase()} ATELIER  •  WOMEN'S HEAVYWEIGHT DROP  •  LIMITED RUN  •  NO RESTOCKS  •  `;
  const collapsedSlotWidth = rackItems.length > 9 ? 52 : rackItems.length > 7 ? 60 : 74;

  return (
    <section
      aria-label="Dropday Interactive Garment Rack"
      className="relative min-h-[100svh] w-full flex flex-col justify-between overflow-hidden bg-[#0B0B0C]"
    >
      {/* Subtle studio spotlight backdrop with warm boutique aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#171316_0%,#0B0B0C_68%)]"
      />

      {homepage.heroMode === 'video' && homepage.heroVideoUrl && !saveDataEnabled && (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={homepage.heroPosterUrl || undefined}
          className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
        >
          <source src={homepage.heroVideoUrl} />
        </video>
      )}

      {/* Minimal Dropday Header */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-10 pt-5 sm:pt-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Navigation */}
          <div className="flex items-center gap-4 lg:gap-6 md:flex-1 min-w-0">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen((v) => !v);
                setMobileSearchOpen(false);
              }}
              aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden min-w-[36px] min-h-[36px] -ml-1 inline-flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <nav aria-label="Left navigation" className="hidden md:flex items-center gap-4 lg:gap-6">
              <Link
                to="/"
                className="text-[11px] font-medium uppercase tracking-[0.2em] text-white transition-colors whitespace-nowrap"
              >
                Rack
              </Link>
              <Link
                to="/shop"
                className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/75 hover:text-white transition-colors whitespace-nowrap"
              >
                Shop
              </Link>
              <Link
                to="/studio"
                className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-blush)] hover:text-white transition-colors whitespace-nowrap"
              >
                3D Atelier
              </Link>
              <Link
                to="/track-order"
                className="hidden lg:inline-block text-[11px] font-medium uppercase tracking-[0.2em] text-white/75 hover:text-white transition-colors whitespace-nowrap"
              >
                Track Order
              </Link>
              <Link
                to="/about"
                className="hidden xl:inline-block text-[11px] font-medium uppercase tracking-[0.2em] text-white/75 hover:text-white transition-colors whitespace-nowrap"
              >
                About
              </Link>
            </nav>
          </div>

          {/* Center Gothic Brand Wordmark */}
          <div className="flex justify-center shrink-0 px-1">
            <Link
              to="/"
              className="focus-visible:outline-2 focus-visible:outline-offset-4 rounded-lg"
            >
              <h1 className="font-gothic text-[26px] sm:text-5xl text-white tracking-wide leading-none select-none">
                {brandTitle}
              </h1>
            </Link>
          </div>

          {/* Right Navigation, Global Search & Bag */}
          <div className="flex items-center justify-end gap-1 sm:gap-3.5 md:flex-1 min-w-0">
            <GlobalSearchBar
              inputId="global-nav-search"
              className="hidden lg:block w-48 xl:w-56"
            />

            <Link
              to="/contact"
              className="hidden xl:inline-block text-[11px] font-medium uppercase tracking-[0.2em] text-white/75 hover:text-white transition-colors whitespace-nowrap"
            >
              Contact
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen((v) => !v);
                setMobileMenuOpen(false);
              }}
              aria-label="Search products and collections"
              aria-expanded={mobileSearchOpen}
              className="lg:hidden min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] inline-flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setWishlistOpen(true)}
              aria-label={`Open wishlist (${wishlist.length} saved)`}
              className="relative min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] inline-flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <Heart className="w-4 h-4" />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping bag (${cartCount} items)`}
              className="relative min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] inline-flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Expandable Global Search Bar */}
        {mobileSearchOpen && (
          <div className="lg:hidden mt-3 max-w-md ml-auto">
            <GlobalSearchBar
              inputId="hero-mobile-search"
              autoFocus
              onAfterNavigate={() => setMobileSearchOpen(false)}
            />
          </div>
        )}

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden mt-4 p-4 rounded-2xl glass-nav flex flex-col gap-1"
          >
            {[
              { label: 'Rack', href: '/' },
              { label: 'Shop Drop', href: '/shop' },
              { label: '3D Atelier', href: '/studio' },
              { label: 'Track Order', href: '/track-order' },
              { label: 'About', href: '/about' },
              { label: 'Contact', href: '/contact' },
              { label: 'Shipping & Returns', href: '/page/shipping-returns' },
            ].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-xs uppercase tracking-[0.2em] text-white/85 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={buildWhatsAppHref(
                settings.social.whatsapp,
                `Hi ${settings.brandName}, I need help ordering a hoodie.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-1 px-4 py-3 rounded-xl bg-[#25D366]/15 border border-[#25D366]/40 text-xs uppercase tracking-[0.2em] text-[#86EFAC] hover:bg-[#25D366]/25 inline-flex items-center gap-2 font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>WhatsApp Help</span>
            </a>
          </nav>
        )}
      </header>

      {/* Center Stage: Metallic Hanging Rail & Side-Folded Unfolding Garments */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Brushed Chrome Garment Rail */}
          <div className="relative z-20 flex items-center w-full px-1">
            <div className="w-3.5 h-6 rounded-sm chrome-cap shrink-0 z-10" aria-hidden="true" />
            <div className="h-2.5 sm:h-3 flex-1 chrome-rail" aria-hidden="true" />
            <div className="w-3.5 h-6 rounded-sm chrome-cap shrink-0 z-10" aria-hidden="true" />
          </div>

          {/* Hanging Garments Row */}
          {loading && rackItems.length === 0 ? (
            <div
              className="relative z-10 -mt-5 sm:-mt-6 flex items-start justify-center gap-4 px-4 sm:px-6 pt-4 pb-6"
              aria-label="Loading garments on rack"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="aspect-[3/4] w-[110px] md:w-[140px] rounded-xl bg-[#131316]/85 border border-white/[0.06] animate-pulse shrink-0"
                />
              ))}
            </div>
          ) : rackItems.length === 0 ? (
            <div className="relative z-10 mt-6 mb-4 max-w-md mx-auto rounded-2xl bg-[#131316]/90 border border-white/10 p-6 text-center space-y-3">
              <p className="font-editorial italic text-2xl text-white">
                {error ? 'Unable to connect to studio rack.' : 'The rack is currently empty.'}
              </p>
              <p className="text-xs text-white/60">
                {error
                  ? 'Please retry loading the live product collection.'
                  : 'Publish hoodies in your Zorvique catalog to hang them here.'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-1">
                {error ? (
                  <button
                    type="button"
                    onClick={() => void reloadCatalog()}
                    className="min-h-[40px] px-5 py-2 rounded-full bg-white text-[#0B0B0C] text-[11px] font-semibold uppercase tracking-[0.18em] cursor-pointer"
                  >
                    Retry
                  </button>
                ) : (
                  <Link
                    to="/shop"
                    className="min-h-[40px] px-5 py-2 rounded-full border border-white/25 hover:border-white text-white text-[11px] font-medium uppercase tracking-[0.18em] inline-flex items-center"
                  >
                    Browse Shop
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div
              className="relative z-10 -mt-5 sm:-mt-6 flex items-start justify-start md:justify-center gap-3 md:gap-1 overflow-x-auto md:overflow-visible px-4 sm:px-6 pt-1 pb-4 snap-x snap-mandatory touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="list"
              aria-label="Hanging drop garments"
            >
              {rackItems.map((piece, idx) => {
                const isExpanded = isDesktop && hoveredId === piece.id;
                return (
                  <motion.div
                    key={piece.id}
                    role="listitem"
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : isDesktop
                          ? { width: isExpanded ? 218 : collapsedSlotWidth }
                          : { width: 138 }
                    }
                    transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.85 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className={`relative shrink-0 snap-center flex flex-col items-center overflow-visible ${
                      isExpanded ? 'z-30' : 'z-10'
                    }`}
                  >
                    {/* Warm Boutique Mirror Aura on Hovered Piece */}
                    <div
                      aria-hidden="true"
                      className={`pointer-events-none absolute -inset-x-6 top-2 bottom-4 rounded-full bg-[radial-gradient(circle,rgba(232,213,206,0.16)_0%,rgba(158,11,20,0.12)_48%,transparent_74%)] blur-xl transition-opacity duration-300 ${
                        isExpanded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => openSpotlight(idx)}
                      onMouseEnter={() => setHoveredId(piece.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onFocus={() => setHoveredId(piece.id)}
                      onBlur={() => setHoveredId(null)}
                      aria-label={`${piece.name} — ${formatPKR(piece.price)}`}
                      style={{ transformStyle: 'preserve-3d' }}
                      className="group relative w-full flex flex-col items-center overflow-visible cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                      <motion.div
                        initial={
                          prefersReducedMotion || !isDesktop
                            ? { transformPerspective: 740, rotateY: 0, scale: 1, y: 0, opacity: 1 }
                            : { transformPerspective: 740, rotateY: -66, scale: 0.94, y: 0, opacity: 0.9 }
                        }
                        animate={
                          prefersReducedMotion
                            ? { transformPerspective: 740, rotateY: 0, scale: 1, y: 0, opacity: 1 }
                            : !isDesktop
                              ? {
                                  transformPerspective: 740,
                                  rotateY: hoveredId === piece.id ? 0 : -26,
                                  scale: hoveredId === piece.id ? 1.03 : 0.97,
                                  y: 0,
                                  opacity: 1,
                                }
                              : isExpanded
                                ? {
                                    transformPerspective: 740,
                                    rotateY: 0,
                                    scale: 1.06,
                                    y: -4,
                                    opacity: 1,
                                  }
                                : {
                                    transformPerspective: 740,
                                    rotateY: -66,
                                    scale: 0.94,
                                    y: 0,
                                    opacity: 0.9,
                                  }
                        }
                        transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.85 }}
                        style={{
                          transformOrigin: '50% 6%',
                          backfaceVisibility: 'visible',
                          willChange: 'transform',
                        }}
                        className="relative aspect-[3/4] w-[138px] md:w-[190px] shrink-0"
                      >
                        {piece.imageUrl ? (
                          <img
                            src={piece.imageUrl}
                            alt={piece.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain mix-blend-lighten [mask-image:radial-gradient(ellipse_66%_78%_at_50%_50%,#000_46%,transparent_88%)] select-none"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#161618] border border-white/10 rounded-xl flex items-center justify-center p-2 text-center">
                            <span className="font-editorial italic text-sm text-white/80">
                              {piece.name}
                            </span>
                          </div>
                        )}
                      </motion.div>

                      {/* Subtle floor shadow beneath hanging garment */}
                      <div
                        aria-hidden="true"
                        className={`mx-auto h-3 rounded-full bg-black/80 blur-md -mt-1 transition-all duration-300 ${
                          isExpanded ? 'w-3/4 opacity-100' : 'w-1/2 opacity-65'
                        }`}
                      />
                    </button>

                    {/* Hover Label Reveal (matching Sudiv video) */}
                    <div
                      className={`pointer-events-none mt-1.5 text-center transition-all duration-200 ${
                        isExpanded
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-1.5 md:block hidden'
                      }`}
                    >
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#F5EAE6] whitespace-nowrap">
                        {piece.name}
                      </p>
                      <p className="font-editorial italic text-sm text-[var(--color-blush)]/80 tabular-nums mt-0.5">
                        {formatPKR(piece.price)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Center Primary CTA ("SEE AVAILABILITY" + "3D ATELIER") */}
        <div className="mt-3 sm:mt-5 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={rackItems.length === 0}
              onClick={() => openSpotlight(activeIndex)}
              className="min-h-[44px] px-8 py-3 rounded-full border border-white/25 hover:border-white bg-black/30 hover:bg-white hover:text-[#0B0B0C] text-white text-[11px] font-medium uppercase tracking-[0.22em] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              See Availability
            </button>
            <Link
              to="/studio"
              className="min-h-[44px] px-6 py-3 rounded-full border border-[var(--color-blush)]/30 hover:border-white bg-[var(--color-primary)]/90 hover:bg-[var(--color-primary)] text-white text-[11px] font-medium uppercase tracking-[0.22em] inline-flex items-center transition-all duration-200"
            >
              Inspect in 3D
            </Link>
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-blush)]/55 text-center">
            Tailored for Women &middot; Hover Rack or Open 3D Atelier
          </p>
        </div>
      </div>

      {/* Bottom Crimson Marquee Ticker */}
      <div
        aria-label="Drop announcement"
        className="relative z-20 w-full bg-[var(--color-primary)] border-t border-white/15 py-2.5 overflow-hidden select-none"
      >
        <div className="animate-dropday-marquee">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              aria-hidden={i > 0}
              className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white whitespace-nowrap px-3"
            >
              {tickerText}
            </span>
          ))}
        </div>
      </div>

      {/* Dropday Spotlight Product Viewer Overlay */}
      <AnimatePresence>
        {viewerOpen && currentPiece && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.24 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${currentPiece.name} spotlight viewer`}
            className="fixed inset-0 z-50 bg-[#0B0B0C]/92 backdrop-blur-xl flex flex-col justify-between px-5 sm:px-10 py-5 sm:py-8 overflow-y-auto"
          >
            {/* Soft Blurred Rack Silhouette Behind Spotlight (matching video) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-2/3 flex items-center justify-center gap-4 opacity-[0.09] blur-md scale-95"
            >
              {rackItems.map((bgItem) =>
                bgItem.imageUrl ? (
                  <img
                    key={`bg-${bgItem.id}`}
                    src={bgItem.imageUrl}
                    alt=""
                    className="w-28 aspect-[3/4] object-contain"
                  />
                ) : null
              )}
            </div>

            {/* Viewer Header */}
            <div className="relative z-10 max-w-7xl w-full mx-auto grid grid-cols-3 items-center">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-blush)]/60">
                Women&apos;s Drop Spotlight
              </div>
              <div className="flex justify-center">
                <span className="font-gothic text-2xl sm:text-4xl text-white/40 select-none">
                  {brandTitle}
                </span>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewerOpen(false)}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/80 hover:text-white cursor-pointer"
                >
                  <span>Close</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewer Center Garment + Arrows */}
            <div className="relative z-10 flex-1 max-w-4xl w-full mx-auto flex flex-col items-center justify-center my-4">
              <div className="relative w-full flex items-center justify-center">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous piece"
                  className="w-11 h-11 rounded-full border border-white/20 hover:border-white text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 mr-4 sm:mr-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentPiece.id}
                    ref={viewerStageRef}
                    custom={direction}
                    variants={SLIDE_VARIANTS}
                    initial={prefersReducedMotion ? false : 'enter'}
                    animate="center"
                    exit={prefersReducedMotion ? undefined : 'exit'}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="w-56 sm:w-72 md:w-80 aspect-[3/4]"
                  >
                    {currentPiece.imageUrl ? (
                      <img
                        src={currentPiece.imageUrl}
                        alt={currentPiece.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain mix-blend-lighten garment-vignette select-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center border border-white/10 rounded-2xl">
                        <span className="font-editorial italic text-2xl text-white">
                          {currentPiece.name}
                        </span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next piece"
                  className="w-11 h-11 rounded-full border border-white/20 hover:border-white text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-4 sm:ml-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Piece Counter, Italic Title, Price, Size Selector & Direct Purchase Actions */}
              <div className="mt-4 text-center space-y-3 max-w-xl w-full">
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] tracking-[0.22em] text-[var(--color-blush)]/70 uppercase tabular-nums">
                  <span>
                    {String((activeIndex % rackItems.length) + 1).padStart(2, '0')} /{' '}
                    {String(rackItems.length).padStart(2, '0')}
                  </span>
                  <span aria-hidden="true">&middot;</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/30"
                      style={{ backgroundColor: currentPiece.colourHex }}
                      aria-hidden="true"
                    />
                    <span>{currentPiece.colourName}</span>
                  </span>
                </div>

                <h2 className="font-editorial italic text-3xl sm:text-4xl text-white leading-tight">
                  {currentPiece.name}
                </h2>

                <div className="flex items-baseline justify-center gap-2.5 tabular-nums">
                  <span className="text-base font-medium text-white">
                    {formatPKR(currentPiece.price)}
                  </span>
                  {currentPiece.compareAtPrice && currentPiece.compareAtPrice > currentPiece.price && (
                    <span className="text-xs text-white/45 line-through">
                      {formatPKR(currentPiece.compareAtPrice)}
                    </span>
                  )}
                </div>

                {/* Inline Size Selector for Immediate Purchase */}
                {currentPiece.sizes.length > 0 && (
                  <div className="pt-1 flex flex-col items-center gap-2">
                    <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Choose size">
                      {currentPiece.sizes.map((s) => {
                        const isSelected = (activeSizeObj?.label || selectedSize) === s.label;
                        const isOut = s.stock <= 0;
                        return (
                          <button
                            key={s.label}
                            type="button"
                            disabled={isOut}
                            onClick={() =>
                              setSizeSelections((prev) => ({
                                ...prev,
                                [currentPiece.id]: s.label,
                              }))
                            }
                            aria-pressed={isSelected}
                            className={`min-w-[44px] min-h-[40px] px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer disabled:opacity-35 disabled:line-through disabled:cursor-not-allowed ${
                              isSelected
                                ? 'bg-white text-[#0B0B0C]'
                                : 'bg-white/[0.06] text-white/80 border border-white/15 hover:border-white/40'
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                    {activeSizeObj && (
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                        {activeSizeObj.stock > 0
                          ? `Size ${activeSizeObj.label} · ${activeSizeObj.stock} available`
                          : `Size ${activeSizeObj.label} · Sold out`}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    disabled={!activeSizeObj || activeSizeObj.stock <= 0}
                    onClick={() => handleQuickAddFromViewer(true)}
                    className="min-h-[44px] px-7 py-2.5 rounded-full bg-white hover:bg-[var(--color-blush)] text-[#0B0B0C] text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Buy Now &middot; {activeSizeObj?.label || selectedSize}
                  </button>
                  <button
                    type="button"
                    disabled={!activeSizeObj || activeSizeObj.stock <= 0}
                    onClick={() => handleQuickAddFromViewer(false)}
                    className="min-h-[44px] px-6 py-2.5 rounded-full bg-[var(--color-primary)] hover:opacity-90 text-white text-[11px] font-semibold uppercase tracking-[0.2em] inline-flex items-center gap-2 transition-opacity disabled:opacity-40 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Bag</span>
                  </button>

                  <a
                    href={buildWhatsAppHref(
                      settings.social.whatsapp,
                      `Hi ${settings.brandName}, I'm viewing ${currentPiece.name} (Size ${activeSizeObj?.label || selectedSize}) — ${formatPKR(currentPiece.price)} and need assistance.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0E1913] border border-emerald-500/40 hover:border-emerald-400 text-emerald-200 hover:text-white text-[11px] font-medium uppercase tracking-[0.18em] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Help</span>
                  </a>

                  <Link
                    to={`/product/${currentPiece.slug}`}
                    onClick={handleViewerSeeAvailability}
                    className="min-h-[44px] inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-white/25 hover:border-white hover:bg-white hover:text-[#0B0B0C] text-white text-[11px] font-medium uppercase tracking-[0.2em] transition-all"
                  >
                    See Availability
                  </Link>

                  <Link
                    to={`/studio?piece=${encodeURIComponent(currentPiece.slug)}`}
                    onClick={() => setViewerOpen(false)}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full border border-white/15 hover:border-white/50 text-[var(--color-blush)] hover:text-white text-[11px] font-medium uppercase tracking-[0.18em] transition-colors"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>3D</span>
                  </Link>
                </div>

                <p className="pt-1 text-[10px] uppercase tracking-[0.22em] text-white/40">
                  &larr; &rarr; Browse &middot; Esc Close
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
