import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  computeFallbackTargetRect,
  sanitizeRect,
  type RectSnapshot,
} from '../utils/transition';

interface TransitionPayload {
  slug: string;
  imageUrl: string;
  name: string;
  sourceRect: RectSnapshot;
  targetRect: RectSnapshot | null;
}

interface ProductTransitionContextValue {
  activeSlug: string | null;
  isAnimatingToSlug: (slug?: string) => boolean;
  navigateToProduct: (
    slug: string,
    sourceEl: HTMLElement | null,
    info: { imageUrl: string; name: string }
  ) => void;
}

const ProductTransitionContext = createContext<ProductTransitionContextValue | null>(null);

export function ProductTransitionProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [transition, setTransition] = useState<TransitionPayload | null>(null);

  const navigateToProduct = useCallback(
    (
      slug: string,
      sourceEl: HTMLElement | null,
      info: { imageUrl: string; name: string }
    ) => {
      if (!slug) return;

      if (prefersReducedMotion || !sourceEl || !info.imageUrl) {
        setTransition(null);
        navigate(`/product/${slug}`);
        return;
      }

      const rawRect = sourceEl.getBoundingClientRect();
      if (rawRect.width < 10 || rawRect.height < 10) {
        setTransition(null);
        navigate(`/product/${slug}`);
        return;
      }

      setTransition({
        slug,
        imageUrl: info.imageUrl,
        name: info.name,
        sourceRect: sanitizeRect(rawRect),
        targetRect: null,
      });

      navigate(`/product/${slug}`);
    },
    [navigate, prefersReducedMotion]
  );

  // Measure the mounted [data-pdp-hero-frame] on the destination ProductPage
  useEffect(() => {
    if (!transition || transition.targetRect) return;

    let cancelled = false;
    let attempts = 0;

    const tryMeasure = () => {
      if (cancelled) return;
      const targetEl =
        document.querySelector('[data-pdp-hero-stage]') ||
        document.querySelector('[data-pdp-hero-frame]');
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        if (rect.width > 40 && rect.height > 40) {
          setTransition((prev) =>
            prev ? { ...prev, targetRect: sanitizeRect(rect) } : null
          );
          return;
        }
      }

      attempts += 1;
      if (attempts < 12) {
        window.requestAnimationFrame(tryMeasure);
      } else {
        setTransition((prev) =>
          prev
            ? {
                ...prev,
                targetRect: computeFallbackTargetRect(window.innerWidth, window.innerHeight),
              }
            : null
        );
      }
    };

    const rafId = window.requestAnimationFrame(tryMeasure);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [transition]);

  // Safety cleanup timer in case navigation or animation stalls
  useEffect(() => {
    if (!transition) return;
    const timer = window.setTimeout(() => {
      setTransition(null);
    }, 950);
    return () => window.clearTimeout(timer);
  }, [transition]);

  const isAnimatingToSlug = useCallback(
    (slug?: string) => Boolean(transition && slug && transition.slug === slug),
    [transition]
  );

  const value = useMemo<ProductTransitionContextValue>(
    () => ({
      activeSlug: transition?.slug ?? null,
      isAnimatingToSlug,
      navigateToProduct,
    }),
    [transition?.slug, isAnimatingToSlug, navigateToProduct]
  );

  const goal = transition?.targetRect || transition?.sourceRect;

  return (
    <ProductTransitionContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {transition && goal && (
          <motion.div
            key={`${transition.slug}-${transition.sourceRect.left}`}
            aria-hidden="true"
            initial={{
              left: transition.sourceRect.left,
              top: transition.sourceRect.top,
              width: transition.sourceRect.width,
              height: transition.sourceRect.height,
              opacity: 1,
            }}
            animate={{
              left: goal.left,
              top: goal.top,
              width: goal.width,
              height: goal.height,
              opacity: 1,
            }}
            exit={{ opacity: 0, transition: { duration: 0.14 } }}
            transition={{
              duration: 0.48,
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => {
              if (transition.targetRect) {
                setTransition(null);
              }
            }}
            className="pointer-events-none fixed z-50 flex items-center justify-center"
          >
            <img
              src={transition.imageUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain mix-blend-lighten garment-vignette"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ProductTransitionContext.Provider>
  );
}

export function useProductTransition(): ProductTransitionContextValue {
  const ctx = useContext(ProductTransitionContext);
  if (!ctx) {
    throw new Error('useProductTransition must be used inside ProductTransitionProvider');
  }
  return ctx;
}
