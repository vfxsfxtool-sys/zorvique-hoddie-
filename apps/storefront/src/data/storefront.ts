import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { OperationType, handleFirestoreError } from './errors';
import type {
  CmsPage,
  Collection,
  DiscountCode,
  HeroSlide,
  HomepageData,
  Order,
  OrderCustomer,
  OrderItem,
  OrderTrackingRecord,
  PaymentMethod,
  Product,
  ProductReview,
  ReviewFitFeedback,
  SiteSettings,
  Testimonial,
} from './types';
import { computeOrderTotals, validateDiscountEligibility } from '../utils/commerce';
import { buildTrackingRecordFromOrder, normalizeOrderLookupId } from '../utils/orderTracking';
import { buildProductReviewId, validateProductReviewInput } from '../utils/reviews';
import { buildSubscriberDocId, validateSubscriberEmail } from '../utils/newsletter';
import { normalizeStudioProduct } from './studioRack';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandName: 'Zorvique',
  logoUrl: '',
  colors: {
    primary: '#9E0B14',
    background: '#0B0B0C',
    surface: '#141416',
  },
  nav: [
    { label: 'Rack', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  footerLinks: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Shipping', href: '/page/shipping-returns' },
    { label: 'Privacy Policy', href: '/page/privacy-policy' },
  ],
  social: {
    instagram: '',
    facebook: '',
    tiktok: '',
    whatsapp: '03084540977',
  },
  announcement: '',
  shipping: {
    flatByCity: {
      Lahore: 200,
      Karachi: 300,
      Islamabad: 250,
      Rawalpindi: 250,
      Faisalabad: 250,
      Multan: 300,
      Peshawar: 350,
      Sialkot: 250,
      Gujranwala: 250,
      Quetta: 400,
      Other: 350,
    },
    freeThreshold: 12000,
  },
  payments: {
    cod: { enabled: true },
    jazzcash: { enabled: false, account: '', instructions: '' },
    easypaisa: { enabled: false, account: '', instructions: '' },
  },
  seo: {
    title: "Zorvique — Luxury Women's Hoodies Pakistan",
    description: 'Architectural fleece hoodies crafted in Pakistan for quiet luxury warmth.',
    ogImage: '',
  },
};

export const DEFAULT_CMS_PAGES: Record<string, CmsPage> = {
  'shipping-returns': {
    slug: 'shipping-returns',
    title: 'Shipping & Returns',
    visible: true,
    body: `# Shipping & Exchanges Across Pakistan

## Dispatch & Courier Partners
Orders placed before 2:00 PM PKT dispatch the same business day from our Lahore studio via TCS, Leopard, or Trax.

- Lahore delivery: 1–2 business days (PKR 200 flat or free on orders PKR 12,000+)
- Karachi, Islamabad & Rawalpindi: 2–3 business days (PKR 250–300 or free on orders PKR 12,000+)
- Other cities nationwide: 3–5 business days (PKR 250–400 or free on orders PKR 12,000+)

## Payment Verification
Cash on Delivery (COD), JazzCash, and EasyPaisa are supported. For JazzCash / EasyPaisa transfers, share your Transaction Reference during checkout for swift verification.

## 7-Day Size & Piece Exchanges
Unused garments in original condition with numbered Zorvique studio tags intact may be exchanged within 7 days of delivery. Contact our studio on WhatsApp (+92 308 4540977) with your Order ID (ZRV-...) to schedule an exchange.`,
  },
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    visible: true,
    body: `# Zorvique Privacy Policy

We collect only the customer contact and delivery details (name, email, phone number, city, and street address) required to confirm, dispatch, and track your hoodie orders across Pakistan.

- Your order details are never sold or shared with third-party advertisers.
- Order lookup via Track Order only displays anonymized delivery milestone, city, and garment summary.
- You may request updates or removal of your contact details anytime via our WhatsApp Helpline (+92 308 4540977).`,
  },
  'terms-of-service': {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    visible: true,
    body: `# Terms of Service

All prices on Zorvique are listed in Pakistani Rupees (PKR).

- Limited-run drops are produced in numbered batches with no automatic restocks once sold out.
- Orders ship nationwide via TCS, Leopard, or Trax.
- Cash on Delivery and verified JazzCash / EasyPaisa transfers are processed prior to dispatch.`,
  },
  support: {
    slug: 'support',
    title: 'Customer Support',
    visible: true,
    body: `# Zorvique Studio Concierge

Our Lahore studio concierge is available Monday to Saturday, 10:00 AM – 7:00 PM PKT.

- WhatsApp Helpline: +92 308 4540977
- Order Status: Visit Track Order with your ZRV- order number anytime.`,
  },
};

export const DEFAULT_HOMEPAGE: HomepageData = {
  heroMode: 'carousel',
  heroVideoUrl: '',
  heroPosterUrl: '',
  sections: [
    { id: 'hero', type: 'hero', visible: true, order: 0, title: 'Stand out Without trying.', body: '' },
    { id: 'collection', type: 'collection', visible: true, order: 1, title: 'Luxury Oversized Hoodies', body: 'Curated Collection' },
    { id: 'craft', type: 'craft', visible: true, order: 2, title: 'Craftsmanship', body: '' },
    { id: 'testimonials', type: 'testimonials', visible: true, order: 3, title: 'Loved Across Pakistan', body: '' },
    { id: 'newsletter', type: 'newsletter', visible: true, order: 4, title: 'Join the Zorvique Inner Circle', body: 'Subscribe for early drop access and private member releases.' },
  ],
  stats: [
    { value: '500+', label: 'GSM Heavyweight Fabric' },
    { value: '100%', label: 'Pre-shrunk Combed Cotton' },
  ],
  craft: {
    title: 'Engineered in Pakistan for Ultimate Comfort',
    body: 'Every Zorvique hoodie is cut from heavyweight long-staple cotton blends tailored for structured drape, thermal warmth, and effortless winter layering.',
    imageUrl: '',
  },
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const path = 'siteSettings/main';
  try {
    const snap = await getDoc(doc(db, 'siteSettings', 'main'));
    if (!snap.exists()) return DEFAULT_SITE_SETTINGS;
    const raw = snap.data() as Partial<SiteSettings>;
    return {
      ...DEFAULT_SITE_SETTINGS,
      ...raw,
      colors: { ...DEFAULT_SITE_SETTINGS.colors, ...(raw.colors || {}) },
      social: {
        ...DEFAULT_SITE_SETTINGS.social,
        ...(raw.social || {}),
        whatsapp: raw.social?.whatsapp?.trim() || DEFAULT_SITE_SETTINGS.social.whatsapp,
      },
      shipping: {
        ...DEFAULT_SITE_SETTINGS.shipping,
        ...(raw.shipping || {}),
        flatByCity: {
          ...DEFAULT_SITE_SETTINGS.shipping.flatByCity,
          ...(raw.shipping?.flatByCity || {}),
        },
      },
      payments: {
        cod: { ...DEFAULT_SITE_SETTINGS.payments.cod, ...(raw.payments?.cod || {}) },
        jazzcash: { ...DEFAULT_SITE_SETTINGS.payments.jazzcash, ...(raw.payments?.jazzcash || {}) },
        easypaisa: { ...DEFAULT_SITE_SETTINGS.payments.easypaisa, ...(raw.payments?.easypaisa || {}) },
      },
      seo: { ...DEFAULT_SITE_SETTINGS.seo, ...(raw.seo || {}) },
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchHomepage(): Promise<HomepageData> {
  const path = 'homepage/main';
  try {
    const snap = await getDoc(doc(db, 'homepage', 'main'));
    if (!snap.exists()) return DEFAULT_HOMEPAGE;
    const raw = snap.data() as Partial<HomepageData>;
    return {
      ...DEFAULT_HOMEPAGE,
      ...raw,
      sections: Array.isArray(raw.sections) && raw.sections.length > 0 ? raw.sections : DEFAULT_HOMEPAGE.sections,
      stats: Array.isArray(raw.stats) ? raw.stats : DEFAULT_HOMEPAGE.stats,
      craft: { ...DEFAULT_HOMEPAGE.craft, ...(raw.craft || {}) },
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchHeroSlides(): Promise<HeroSlide[]> {
  const path = 'heroSlides';
  try {
    const q = query(collection(db, 'heroSlides'), where('active', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<HeroSlide, 'id'>) }))
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchPublishedProducts(): Promise<Product[]> {
  const path = 'products';
  try {
    const q = query(collection(db, 'products'), where('status', '==', 'published'));
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      normalizeStudioProduct({ id: d.id, ...(d.data() as Omit<Product, 'id'>) })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToPublishedProducts(
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, 'products'), where('status', '==', 'published'));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) =>
        normalizeStudioProduct({ id: d.id, ...(d.data() as Omit<Product, 'id'>) })
      );
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'products');
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error('Unable to sync live products.'));
      }
    }
  );
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const path = 'products';
  try {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'published'),
      where('slug', '==', slug)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const first = snap.docs[0];
    return normalizeStudioProduct({ id: first.id, ...(first.data() as Omit<Product, 'id'>) });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchCollections(): Promise<Collection[]> {
  const path = 'collections';
  try {
    const q = query(collection(db, 'collections'), where('visible', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Collection, 'id'>) }))
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const path = 'testimonials';
  try {
    const q = query(collection(db, 'testimonials'), where('visible', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Testimonial, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchPageBySlug(slug: string): Promise<CmsPage | null> {
  const cleanSlug = slug.trim().toLowerCase();
  const path = `pages/${cleanSlug}`;
  try {
    const snap = await getDoc(doc(db, 'pages', cleanSlug));
    if (!snap.exists()) {
      return DEFAULT_CMS_PAGES[cleanSlug] || null;
    }
    const data = snap.data() as Omit<CmsPage, 'slug'>;
    if (!data.visible) return null;
    return { slug: snap.id, ...data };
  } catch (error) {
    if (cleanSlug in DEFAULT_CMS_PAGES) {
      return DEFAULT_CMS_PAGES[cleanSlug];
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchDiscountCode(rawCode: string): Promise<{
  discount: DiscountCode | null;
  error?: string;
}> {
  const code = rawCode.trim().toUpperCase();
  if (!code || !/^[A-Z0-9_-]+$/.test(code)) {
    return { discount: null, error: 'Enter a valid promo code (letters and numbers only).' };
  }
  const path = `discountCodes/${code}`;
  try {
    const snap = await getDoc(doc(db, 'discountCodes', code));
    if (!snap.exists()) {
      return { discount: null, error: 'Promo code not found.' };
    }
    const data = snap.data() as Omit<DiscountCode, 'code'>;
    const discount: DiscountCode = { code: snap.id, ...data };
    const eligibility = validateDiscountEligibility(discount);
    if (!eligibility.valid) {
      return { discount: null, error: eligibility.reason };
    }
    return { discount };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export interface CreateOrderInput {
  customer: OrderCustomer;
  items: { productId: string; size: string; colour: string; qty: number }[];
  paymentMethod: PaymentMethod;
  transactionId: string;
  discountCode?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const settings = await fetchSiteSettings();
  const publishedProducts = await fetchPublishedProducts();
  const productMap = new Map(publishedProducts.map((p) => [p.id, p]));

  const verifiedItems: OrderItem[] = [];
  for (const reqItem of input.items) {
    const product = productMap.get(reqItem.productId);
    if (!product) {
      throw new Error('One or more items in your bag are no longer available.');
    }
    const sizeEntry = product.sizes.find((s) => s.label === reqItem.size);
    if (!sizeEntry || sizeEntry.stock < reqItem.qty) {
      throw new Error(`Insufficient stock for ${product.name} (${reqItem.size}).`);
    }
    verifiedItems.push({
      productId: product.id,
      name: product.name,
      size: reqItem.size,
      colour: reqItem.colour,
      price: product.price,
      qty: reqItem.qty,
    });
  }

  let verifiedDiscount: DiscountCode | null = null;
  if (input.discountCode && input.discountCode.trim()) {
    const res = await fetchDiscountCode(input.discountCode);
    if (res.discount) {
      verifiedDiscount = res.discount;
    }
  }

  const totals = computeOrderTotals(
    verifiedItems,
    input.customer.city,
    settings.shipping,
    verifiedDiscount
  );

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `ord_${Date.now()}_${randomSuffix}`;
  const orderNo = `ZRV-${String(Date.now()).slice(-4)}${randomSuffix}`;

  const orderDoc: Omit<Order, 'id'> = {
    orderNo,
    customer: {
      name: input.customer.name.trim(),
      email: input.customer.email.trim().toLowerCase(),
      phone: input.customer.phone.trim(),
      city: input.customer.city.trim(),
      address: input.customer.address.trim(),
      postalCode: input.customer.postalCode.trim(),
    },
    items: verifiedItems,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    discount: totals.discountAmount,
    ...(verifiedDiscount ? { discountCode: verifiedDiscount.code } : {}),
    total: totals.total,
    paymentMethod: input.paymentMethod,
    transactionId: input.paymentMethod === 'cod' ? '' : input.transactionId.trim(),
    paymentStatus: input.paymentMethod === 'cod' ? 'pending' : 'verification',
    status: 'new',
    courier: '',
    trackingNo: '',
    createdAt: serverTimestamp(),
  };

  const trackingPayload: OrderTrackingRecord = {
    orderNo,
    orderId,
    city: orderDoc.customer.city,
    itemCount: verifiedItems.reduce((sum, i) => sum + i.qty, 0),
    itemSummary: verifiedItems.map((i) => ({
      name: i.name,
      size: i.size,
      colour: i.colour,
      qty: i.qty,
    })),
    total: totals.total,
    paymentMethod: orderDoc.paymentMethod,
    paymentStatus: orderDoc.paymentStatus,
    status: 'new',
    courier: '',
    trackingNo: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'orders', orderId), orderDoc);
    batch.set(doc(db, 'orderTracking', orderNo), trackingPayload);
    await batch.commit();
    return {
      ...orderDoc,
      id: orderId,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `orders/${orderId}`);
  }
}

export async function fetchOrderTracking(rawOrderId: string): Promise<OrderTrackingRecord | null> {
  const parsed = normalizeOrderLookupId(rawOrderId);
  if (!parsed.valid) {
    throw new Error(parsed.error || 'Invalid Order ID.');
  }
  const lookupId = parsed.normalized;
  const path = `orderTracking/${lookupId}`;
  try {
    const snap = await getDoc(doc(db, 'orderTracking', lookupId));
    if (snap.exists()) {
      return snap.data() as OrderTrackingRecord;
    }
    if (lookupId.startsWith('ord_') && typeof window !== 'undefined') {
      try {
        const rawLocal = window.sessionStorage.getItem(`zorvique_order_${lookupId}`);
        if (rawLocal) {
          return buildTrackingRecordFromOrder(JSON.parse(rawLocal) as Order);
        }
      } catch {
        // Ignore session storage errors
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createSubscriber(email: string): Promise<{ id: string; email: string }> {
  const checked = validateSubscriberEmail(email);
  if (!checked.valid) {
    throw new Error(checked.error || 'Please enter a valid email address.');
  }
  const safeId = buildSubscriberDocId();
  try {
    await setDoc(doc(db, 'subscribers', safeId), {
      email: checked.email,
      createdAt: serverTimestamp(),
    });
    return { id: safeId, email: checked.email };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `subscribers/${safeId}`);
  }
}

export function subscribeToProductReviews(
  productId: string,
  onData: (reviews: ProductReview[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, 'productReviews'), where('productId', '==', productId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ProductReview, 'id'>),
      }));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'productReviews');
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error('Unable to load product reviews.'));
      }
    }
  );
}

export interface SubmitProductReviewInput {
  productId: string;
  productSlug: string;
  authorName: string;
  city: string;
  rating: number;
  title: string;
  comment: string;
  fitFeedback: ReviewFitFeedback;
}

export async function upsertProductReview(input: SubmitProductReviewInput): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in with Google before submitting a review.');
  }
  if (!user.emailVerified) {
    throw new Error('A verified email account is required to publish a review.');
  }

  const validated = validateProductReviewInput({
    authorName: input.authorName,
    city: input.city,
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    fitFeedback: input.fitFeedback,
  });
  if (!validated.valid || !validated.normalized) {
    throw new Error(validated.error || 'Please check your review details.');
  }

  const reviewId = buildProductReviewId(input.productId, user.uid);
  const ref = doc(db, 'productReviews', reviewId);
  const path = `productReviews/${reviewId}`;

  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await updateDoc(ref, {
        ...validated.normalized,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        productId: input.productId,
        productSlug: input.productSlug,
        authorUid: user.uid,
        ...validated.normalized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductReview(productId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in first.');
  }
  const reviewId = buildProductReviewId(productId, user.uid);
  const path = `productReviews/${reviewId}`;
  try {
    await deleteDoc(doc(db, 'productReviews', reviewId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

