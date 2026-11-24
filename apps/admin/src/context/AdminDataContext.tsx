import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_ADMIN_HOMEPAGE,
  DEFAULT_ADMIN_SETTINGS,
  fetchAdmins,
  fetchCollections,
  fetchDiscountCodes,
  fetchHeroSlides,
  fetchHomepage,
  fetchMediaAssets,
  fetchOrders,
  fetchPages,
  fetchProducts,
  fetchSiteSettings,
  fetchSubscribers,
  fetchTestimonials,
  importStudioCatalog,
  repairPlaceholderStudioImages,
} from '../data/adminApi';
import type {
  AdminUser,
  CmsPage,
  Collection,
  DiscountCode,
  HeroSlide,
  HomepageData,
  MediaAsset,
  Order,
  Product,
  SiteSettings,
  Subscriber,
  Testimonial,
} from '../data/types';
import { useAuth } from './AuthContext';

interface AdminDataContextValue {
  loading: boolean;
  error: string | null;
  settings: SiteSettings;
  homepage: HomepageData;
  heroSlides: HeroSlide[];
  products: Product[];
  collections: Collection[];
  testimonials: Testimonial[];
  pages: CmsPage[];
  orders: Order[];
  discountCodes: DiscountCode[];
  subscribers: Subscriber[];
  media: MediaAsset[];
  admins: AdminUser[];
  refreshAll: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthorized, isOwner } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_ADMIN_SETTINGS);
  const [homepage, setHomepage] = useState<HomepageData>(DEFAULT_ADMIN_HOMEPAGE);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const didInitialMigrateRef = useRef(false);
  const didImageRepairRef = useRef(false);

  const refreshAll = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    setError(null);
    try {
      const [
        s,
        h,
        slides,
        prodsInitial,
        colsInitial,
        tests,
        pgs,
        ords,
        codes,
        subs,
        meds,
        adms,
      ] = await Promise.all([
        fetchSiteSettings(),
        fetchHomepage(),
        fetchHeroSlides(),
        fetchProducts(),
        fetchCollections(),
        fetchTestimonials(),
        fetchPages(),
        fetchOrders(),
        fetchDiscountCodes(),
        fetchSubscribers(),
        fetchMediaAssets(),
        isOwner ? fetchAdmins() : Promise.resolve([]),
      ]);

      let prods = prodsInitial;
      let cols = colsInitial;

      if (prods.length === 0 && cols.length === 0 && !didInitialMigrateRef.current) {
        didInitialMigrateRef.current = true;
        try {
          await importStudioCatalog([]);
          const [seededProds, seededCols] = await Promise.all([fetchProducts(), fetchCollections()]);
          prods = seededProds;
          cols = seededCols;
        } catch {
          // Non-fatal: admin can also trigger migration from Products page
        }
      } else if (prods.length > 0 && !didImageRepairRef.current) {
        didImageRepairRef.current = true;
        try {
          const repaired = await repairPlaceholderStudioImages(prods);
          if (repaired > 0) {
            prods = await fetchProducts();
          }
        } catch {
          // Non-fatal: manual repair remains available in Products page
        }
      }

      setSettings(s);
      setHomepage(h);
      setHeroSlides(slides);
      setProducts(prods);
      setCollections(cols);
      setTestimonials(tests);
      setPages(pgs);
      setOrders(ords);
      setDiscountCodes(codes);
      setSubscribers(subs);
      setMedia(meds);
      setAdmins(adms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, [isAuthorized, isOwner]);

  useEffect(() => {
    if (isAuthorized) {
      void refreshAll();
    } else {
      setLoading(false);
    }
  }, [isAuthorized, refreshAll]);

  return (
    <AdminDataContext.Provider
      value={{
        loading,
        error,
        settings,
        homepage,
        heroSlides,
        products,
        collections,
        testimonials,
        pages,
        orders,
        discountCodes,
        subscribers,
        media,
        admins,
        refreshAll,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData(): AdminDataContextValue {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used inside AdminDataProvider');
  return ctx;
}
