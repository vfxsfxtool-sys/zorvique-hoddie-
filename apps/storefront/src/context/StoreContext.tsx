import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../data/firebase';
import {
  DEFAULT_HOMEPAGE,
  DEFAULT_SITE_SETTINGS,
  fetchCollections,
  fetchDiscountCode,
  fetchHeroSlides,
  fetchHomepage,
  fetchPublishedProducts,
  fetchSiteSettings,
  fetchTestimonials,
  subscribeToPublishedProducts,
} from '../data/storefront';
import type {
  CartItem,
  Collection,
  DiscountCode,
  HeroSlide,
  HomepageData,
  Product,
  SiteSettings,
  Testimonial,
} from '../data/types';

const CART_STORAGE_KEY = 'zorvique_cart_v1';
const WISHLIST_STORAGE_KEY = 'zorvique_wishlist_v1';

interface StoreContextValue {
  loading: boolean;
  error: string | null;
  settings: SiteSettings;
  homepage: HomepageData;
  heroSlides: HeroSlide[];
  products: Product[];
  collections: Collection[];
  testimonials: Testimonial[];
  cart: CartItem[];
  wishlist: string[];
  appliedDiscount: DiscountCode | null;
  cartOpen: boolean;
  wishlistOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setWishlistOpen: (open: boolean) => void;
  addToCart: (item: CartItem, options?: { openCart?: boolean }) => void;
  updateCartQty: (productId: string, size: string, colour: string, qty: number) => void;
  removeFromCart: (productId: string, size: string, colour: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  applyDiscount: (code: string) => Promise<{ ok: boolean; error?: string }>;
  removeDiscount: () => void;
  reloadCatalog: () => Promise<void>;
  customerUser: User | null;
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  signInCustomer: () => Promise<void>;
  signOutCustomer: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [homepage, setHomepage] = useState<HomepageData>(DEFAULT_HOMEPAGE);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => readStorage<CartItem[]>(CART_STORAGE_KEY, []));
  const [wishlist, setWishlist] = useState<string[]>(() => readStorage<string[]>(WISHLIST_STORAGE_KEY, []));
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setCustomerUser(nextUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, h, slides, prods, cols, tests] = await Promise.all([
        fetchSiteSettings(),
        fetchHomepage(),
        fetchHeroSlides(),
        fetchPublishedProducts(),
        fetchCollections(),
        fetchTestimonials(),
      ]);
      setSettings(s);
      setHomepage(h);
      setHeroSlides(slides);
      setProducts(prods);
      setCollections(cols);
      setTestimonials(tests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load storefront content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
    const unsubscribeProducts = subscribeToPublishedProducts(
      (liveProducts) => {
        setProducts(liveProducts);
      },
      (err) => {
        setError(err.message);
      }
    );
    return () => unsubscribeProducts();
  }, [loadAll]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.colors.primary) {
      root.style.setProperty('--color-primary', settings.colors.primary);
    }
    if (settings.colors.background) {
      root.style.setProperty('--color-background', settings.colors.background);
    }
    if (settings.colors.surface) {
      root.style.setProperty('--color-surface', settings.colors.surface);
    }
  }, [settings.colors.primary, settings.colors.background, settings.colors.surface]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // Ignore quota errors
    }
  }, [wishlist]);

  const addToCart = useCallback((incoming: CartItem, options?: { openCart?: boolean }) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.productId === incoming.productId &&
          item.size === incoming.size &&
          item.colour === incoming.colour
      );
      if (idx >= 0) {
        const next = [...prev];
        const existing = next[idx];
        const max = incoming.maxStock > 0 ? incoming.maxStock : existing.maxStock;
        next[idx] = {
          ...existing,
          qty: Math.min(max || 20, existing.qty + incoming.qty),
        };
        return next;
      }
      return [...prev, incoming];
    });
    if (options?.openCart !== false) {
      setCartOpen(true);
    }
  }, []);

  const updateCartQty = useCallback((productId: string, size: string, colour: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) {
        return prev.filter(
          (item) => !(item.productId === productId && item.size === size && item.colour === colour)
        );
      }
      return prev.map((item) => {
        if (item.productId === productId && item.size === size && item.colour === colour) {
          const capped = item.maxStock > 0 ? Math.min(item.maxStock, qty) : Math.min(20, qty);
          return { ...item, qty: capped };
        }
        return item;
      });
    });
  }, []);

  const removeFromCart = useCallback((productId: string, size: string, colour: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.size === size && item.colour === colour))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedDiscount(null);
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const applyDiscount = useCallback(async (code: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetchDiscountCode(code);
    if (!res.discount) {
      return { ok: false, error: res.error || 'Invalid promo code.' };
    }
    setAppliedDiscount(res.discount);
    return { ok: true };
  }, []);

  const removeDiscount = useCallback(() => {
    setAppliedDiscount(null);
  }, []);

  const signInCustomer = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError('Sign-in was cancelled before completing.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Browser blocked the sign-in popup. Please allow popups for this site and try again.');
      } else {
        setAuthError(err instanceof Error ? err.message : 'Unable to sign in right now.');
      }
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signOutCustomer = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign out.');
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      loading,
      error,
      settings,
      homepage,
      heroSlides,
      products,
      collections,
      testimonials,
      cart,
      wishlist,
      appliedDiscount,
      cartOpen,
      wishlistOpen,
      setCartOpen,
      setWishlistOpen,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      applyDiscount,
      removeDiscount,
      reloadCatalog: loadAll,
      customerUser,
      authReady,
      authBusy,
      authError,
      signInCustomer,
      signOutCustomer,
    }),
    [
      loading,
      error,
      settings,
      homepage,
      heroSlides,
      products,
      collections,
      testimonials,
      cart,
      wishlist,
      appliedDiscount,
      cartOpen,
      wishlistOpen,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      applyDiscount,
      removeDiscount,
      loadAll,
      customerUser,
      authReady,
      authBusy,
      authError,
      signInCustomer,
      signOutCustomer,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
