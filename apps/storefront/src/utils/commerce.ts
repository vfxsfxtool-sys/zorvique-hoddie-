import type { DiscountCode, Product, ShippingConfig } from '../data/types';

export const PAKISTAN_CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Sialkot',
  'Gujranwala',
  'Quetta',
  'Other',
] as const;

export function formatPKR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `PKR ${safe.toLocaleString('en-PK')}`;
}

export function validatePakistanPhone(raw: string): { valid: boolean; normalized: string; error?: string } {
  const cleaned = raw.replace(/[\s\-()]/g, '');
  if (!cleaned) {
    return { valid: false, normalized: '', error: 'Phone number is required.' };
  }

  let normalized = cleaned;
  if (/^03\d{9}$/.test(cleaned)) {
    normalized = `+92${cleaned.slice(1)}`;
  } else if (/^3\d{9}$/.test(cleaned)) {
    normalized = `+92${cleaned}`;
  } else if (/^923\d{9}$/.test(cleaned)) {
    normalized = `+${cleaned}`;
  } else if (!/^\+923\d{9}$/.test(cleaned)) {
    return {
      valid: false,
      normalized: cleaned,
      error: 'Enter a valid Pakistan mobile number (e.g. +92 300 1234567).',
    };
  }

  return { valid: true, normalized };
}

export function validateDiscountEligibility(
  codeDoc: DiscountCode | null,
  now: Date = new Date()
): { valid: boolean; reason?: string } {
  if (!codeDoc) {
    return { valid: false, reason: 'Promo code not found.' };
  }
  if (!codeDoc.active) {
    return { valid: false, reason: 'This promo code is currently inactive.' };
  }
  if (codeDoc.usageLimit > 0 && codeDoc.usedCount >= codeDoc.usageLimit) {
    return { valid: false, reason: 'This promo code has reached its usage limit.' };
  }
  if (codeDoc.expiresAt) {
    const expiry = new Date(codeDoc.expiresAt);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < now.getTime()) {
      return { valid: false, reason: 'This promo code has expired.' };
    }
  }
  return { valid: true };
}

export function calculateDiscountAmount(subtotal: number, discount: DiscountCode | null): number {
  if (!discount || subtotal <= 0) return 0;
  const pct = Math.max(0, Math.min(100, discount.percent));
  return Math.round((subtotal * pct) / 100);
}

export function calculateShipping(
  subtotal: number,
  city: string,
  shipping: ShippingConfig
): number {
  if (subtotal <= 0) return 0;
  if (shipping.freeThreshold > 0 && subtotal >= shipping.freeThreshold) {
    return 0;
  }
  const normalizedCity = city.trim();
  if (normalizedCity && normalizedCity in shipping.flatByCity) {
    return Math.max(0, shipping.flatByCity[normalizedCity]);
  }
  if ('Other' in shipping.flatByCity) {
    return Math.max(0, shipping.flatByCity['Other']);
  }
  return 250;
}

export function computeOrderTotals(
  items: { price: number; qty: number }[],
  city: string,
  shippingConfig: ShippingConfig,
  discount: DiscountCode | null
): { subtotal: number; shipping: number; discountAmount: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + Math.max(0, item.price) * Math.max(0, item.qty), 0);
  const discountAmount = Math.min(subtotal, calculateDiscountAmount(subtotal, discount));
  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const shipping = calculateShipping(netSubtotal, city, shippingConfig);
  const total = Math.max(0, netSubtotal + shipping);
  return { subtotal, shipping, discountAmount, total };
}

export type ProductSortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export interface ProductFilterOptions {
  collectionId?: string;
  colour?: string;
  size?: string;
  maxPrice?: number;
  search?: string;
  sort?: ProductSortOption;
}

export function normalizeProductSort(raw: string | null | undefined): ProductSortOption {
  if (raw === 'price-asc' || raw === 'price-desc' || raw === 'newest' || raw === 'featured') {
    return raw;
  }
  return 'featured';
}

export function parseProductTimestampMs(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (val instanceof Date) {
    const ms = val.getTime();
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (typeof val === 'string') {
    const ms = Date.parse(val);
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (typeof val === 'object' && val !== null) {
    const rec = val as {
      toMillis?: () => number;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };
    if (typeof rec.toMillis === 'function') {
      const ms = rec.toMillis();
      return Number.isFinite(ms) ? ms : 0;
    }
    const sec = typeof rec.seconds === 'number' ? rec.seconds : rec._seconds;
    if (typeof sec === 'number' && Number.isFinite(sec)) {
      const ns = typeof rec.nanoseconds === 'number' ? rec.nanoseconds : rec._nanoseconds || 0;
      return sec * 1000 + Math.floor(ns / 1_000_000);
    }
  }
  return 0;
}

export const FALLBACK_COLLECTION_NAMES: Record<string, string> = {
  'drop-01': 'Limited Run Drop',
};

export function resolveCollectionName(
  collectionId: string,
  collections: { id: string; name: string; slug?: string }[] = []
): string {
  if (!collectionId) return '';
  const match = collections.find(
    (c) => c.id === collectionId || (c.slug && c.slug === collectionId)
  );
  if (match) return match.name;
  if (collectionId in FALLBACK_COLLECTION_NAMES) {
    return FALLBACK_COLLECTION_NAMES[collectionId];
  }
  return collectionId.replace(/[-_]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export interface CatalogSearchResults {
  collections: { id: string; name: string; slug: string; productCount: number }[];
  products: { product: Product; collectionName: string }[];
}

export function searchCatalog(
  products: Product[],
  collections: { id: string; name: string; slug: string; visible?: boolean }[],
  rawQuery: string,
  limit = 6
): CatalogSearchResults {
  const q = rawQuery.trim().toLowerCase();
  if (!q) {
    return { collections: [], products: [] };
  }

  const publishedProducts = products.filter((p) => p.status === 'published');

  // Merge declared visible collections with any fallback collection IDs present on published products
  const collectionMap = new Map<string, { id: string; name: string; slug: string; productCount: number }>();
  for (const col of collections) {
    if (col.visible === false) continue;
    collectionMap.set(col.id, { id: col.id, name: col.name, slug: col.slug, productCount: 0 });
  }
  for (const p of publishedProducts) {
    if (!p.collectionId) continue;
    if (!collectionMap.has(p.collectionId)) {
      collectionMap.set(p.collectionId, {
        id: p.collectionId,
        name: resolveCollectionName(p.collectionId, collections),
        slug: p.collectionId,
        productCount: 0,
      });
    }
    const entry = collectionMap.get(p.collectionId);
    if (entry) entry.productCount += 1;
  }

  const matchedCollections = Array.from(collectionMap.values()).filter(
    (col) =>
      col.productCount > 0 &&
      (col.name.toLowerCase().includes(q) || col.slug.toLowerCase().includes(q) || col.id.toLowerCase().includes(q))
  );

  const scoredProducts: { score: number; product: Product; collectionName: string }[] = [];
  for (const product of publishedProducts) {
    const colName = resolveCollectionName(product.collectionId, collections);
    const nameLower = product.name.toLowerCase();
    const colLower = colName.toLowerCase();
    const colourHay = product.colourways.map((c) => c.name.toLowerCase()).join(' ');
    const skuLower = product.sku.toLowerCase();

    let score = 0;
    if (nameLower.startsWith(q)) score = 100;
    else if (nameLower.includes(q)) score = 80;
    else if (colLower.startsWith(q)) score = 70;
    else if (colLower.includes(q) || product.collectionId.toLowerCase().includes(q)) score = 60;
    else if (colourHay.includes(q) || skuLower.includes(q)) score = 40;
    else if (product.fabric.toLowerCase().includes(q)) score = 20;

    if (score > 0) {
      scoredProducts.push({ score, product, collectionName: colName });
    }
  }

  scoredProducts.sort((a, b) => b.score - a.score || Number(b.product.featured) - Number(a.product.featured));

  return {
    collections: matchedCollections.slice(0, 4),
    products: scoredProducts.slice(0, limit).map(({ product, collectionName }) => ({
      product,
      collectionName,
    })),
  };
}

export function filterAndSortProducts(
  products: Product[],
  opts: ProductFilterOptions,
  collections: { id: string; name: string; slug?: string }[] = []
): Product[] {
  const q = (opts.search ?? '').trim().toLowerCase();
  const filtered = products.filter((p) => {
    if (p.status !== 'published') return false;
    if (opts.collectionId && opts.collectionId !== 'all' && p.collectionId !== opts.collectionId) {
      return false;
    }
    if (opts.colour && opts.colour !== 'all') {
      const hasColour = p.colourways.some((c) => c.name.toLowerCase() === opts.colour!.toLowerCase());
      if (!hasColour) return false;
    }
    if (opts.size && opts.size !== 'all') {
      const hasSize = p.sizes.some((s) => s.label.toLowerCase() === opts.size!.toLowerCase() && s.stock > 0);
      if (!hasSize) return false;
    }
    if (typeof opts.maxPrice === 'number' && opts.maxPrice > 0 && p.price > opts.maxPrice) {
      return false;
    }
    if (q) {
      const colName = resolveCollectionName(p.collectionId, collections);
      const colourNames = p.colourways.map((c) => c.name).join(' ');
      const hay = `${p.name} ${colName} ${p.collectionId} ${colourNames} ${p.description} ${p.fabric} ${p.sku}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (opts.sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
      break;
    case 'newest':
      sorted.sort((a, b) => {
        const at = parseProductTimestampMs(a.createdAt) || parseProductTimestampMs(a.updatedAt);
        const bt = parseProductTimestampMs(b.createdAt) || parseProductTimestampMs(b.updatedAt);
        return bt - at || a.name.localeCompare(b.name);
      });
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
      break;
  }
  return sorted;
}

export function getTotalStock(product: Product): number {
  return product.sizes.reduce((sum, s) => sum + Math.max(0, s.stock), 0);
}
