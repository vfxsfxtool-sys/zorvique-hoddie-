import type { Order, Product, ProductSizeStock, Subscriber } from '../data/types';

export const OWNER_EMAIL = 'lessuse611@gmail.com';
export const OWNER_EMAILS = ['lessuse611@gmail.com', 'uselesss611@gmail.com'] as const;

export function isOwnerEmail(email: string | null | undefined): boolean {
  const normalized = (email || '').trim().toLowerCase();
  return (OWNER_EMAILS as readonly string[]).includes(normalized);
}

export type ResolvedAdminRole = 'owner' | 'member' | null;

export function resolveAdminRole(
  email: string | null | undefined,
  docRole?: string | null
): ResolvedAdminRole {
  if (isOwnerEmail(email)) return 'owner';
  if (docRole === 'member' || docRole === 'admin' || docRole === 'owner') {
    return 'member';
  }
  return null;
}

export function validateNewMemberEmail(
  rawEmail: string
): { ok: true; email: string } | { ok: false; reason: string } {
  const clean = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) || clean.length > 254) {
    return { ok: false, reason: 'Enter a valid email address.' };
  }
  if (isOwnerEmail(clean)) {
    return {
      ok: false,
      reason: `${clean} is already the primary Store Admin (Owner).`,
    };
  }
  return { ok: true, email: clean };
}

export interface AdminAuthErrorInfo {
  message: string;
  needsConsoleEmailProvider: boolean;
  consoleUrl?: string;
}

export function buildFirebaseAuthProvidersUrl(projectId: string | null | undefined): string {
  const clean = (projectId || '').trim();
  if (!clean) {
    return 'https://console.firebase.google.com/';
  }
  return `https://console.firebase.google.com/project/${encodeURIComponent(clean)}/authentication/providers`;
}

export function buildFirebaseAuthUsersUrl(projectId: string | null | undefined): string {
  const clean = (projectId || '').trim();
  if (!clean) {
    return 'https://console.firebase.google.com/';
  }
  return `https://console.firebase.google.com/project/${encodeURIComponent(clean)}/authentication/users`;
}

export function mapAdminAuthError(err: unknown, projectId?: string | null): AdminAuthErrorInfo {
  const code = (err as { code?: string } | null)?.code || '';
  if (code === 'auth/operation-not-allowed') {
    return {
      message:
        'Email/Password sign-in is disabled in Firebase Authentication for this project. Enable the Email/Password provider in Firebase Console once, then try again.',
      needsConsoleEmailProvider: true,
      consoleUrl: buildFirebaseAuthProvidersUrl(projectId),
    };
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password'
  ) {
    return {
      message:
        'Incorrect email or password, or this account is not set up yet. Primary Admin can use "Admin Setup" above, while added Members must use credentials created by the Admin.',
      needsConsoleEmailProvider: false,
    };
  }
  if (code === 'auth/email-already-in-use') {
    return {
      message:
        'This email is already registered in Firebase Auth. Switch to "Sign In" with your password or click "Forgot password?" to reset it.',
      needsConsoleEmailProvider: false,
    };
  }
  if (code === 'auth/weak-password') {
    return {
      message: 'Password must be at least 6 characters.',
      needsConsoleEmailProvider: false,
    };
  }
  if (code === 'auth/too-many-requests') {
    return {
      message: 'Too many attempts. Wait a moment or use "Forgot password?" to reset.',
      needsConsoleEmailProvider: false,
    };
  }
  return {
    message: err instanceof Error ? err.message : 'Unable to authenticate administrator session.',
    needsConsoleEmailProvider: false,
  };
}

export function resolveStorefrontUrl(
  loc?: { protocol: string; hostname: string; port?: string } | null
): string {
  if (!loc) return '/';
  if (loc.port === '3001') {
    return `${loc.protocol}//${loc.hostname}:3000/`;
  }
  return '/';
}

export function buildFirebaseStorageConsoleUrl(projectId: string | null | undefined): string {
  const clean = (projectId || '').trim();
  if (!clean) {
    return 'https://console.firebase.google.com/';
  }
  return `https://console.firebase.google.com/project/${encodeURIComponent(clean)}/storage`;
}

export interface StorageUploadErrorInfo {
  message: string;
  needsStorageActivation: boolean;
  consoleUrl?: string;
}

export function mapStorageUploadError(err: unknown, projectId?: string | null): StorageUploadErrorInfo {
  const code = (err as { code?: string } | null)?.code || '';
  const rawMessage = err instanceof Error ? err.message : String(err || '');
  const consoleUrl = buildFirebaseStorageConsoleUrl(projectId);

  if (
    code === 'storage/bucket-not-found' ||
    code === 'storage/project-not-found' ||
    code === 'storage/unknown' ||
    code === 'storage/retry-limit-exceeded' ||
    /404|not found|cors|network/i.test(rawMessage)
  ) {
    return {
      message:
        `Firebase Storage bucket is not activated or unreachable yet for "${projectId || 'this project'}". Open Firebase Console → Storage → Get Started (or paste an image URL directly below).`,
      needsStorageActivation: true,
      consoleUrl,
    };
  }
  if (code === 'storage/unauthorized' || /permission|unauthorized|403/i.test(rawMessage)) {
    return {
      message:
        `Firebase Storage rejected the upload (permissions). Publish your storage.rules in Firebase Console → Storage → Rules (or paste an image URL directly below).`,
      needsStorageActivation: true,
      consoleUrl,
    };
  }
  return {
    message: rawMessage || 'Image upload failed.',
    needsStorageActivation: false,
  };
}

export function sortAdminRackProducts(products: Product[]): Product[] {
  return products
    .filter((p) => p.status === 'published' && p.showOnRack !== false)
    .slice()
    .sort((a, b) => {
      const aHasOrder = typeof a.rackOrder === 'number' && Number.isFinite(a.rackOrder);
      const bHasOrder = typeof b.rackOrder === 'number' && Number.isFinite(b.rackOrder);
      if (aHasOrder && bHasOrder && a.rackOrder !== b.rackOrder) {
        return (a.rackOrder as number) - (b.rackOrder as number);
      }
      if (aHasOrder !== bHasOrder) return aHasOrder ? -1 : 1;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return timestampToMs(b.createdAt) - timestampToMs(a.createdAt);
    })
    .slice(0, 12);
}

export function formatPKR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `PKR ${safe.toLocaleString('en-PK')}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'hoodie';
}

export function ensureUniqueSlug(baseName: string, existingSlugs: string[], currentSlug?: string): string {
  const base = slugify(baseName);
  const taken = new Set(existingSlugs.filter((s) => s !== currentSlug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) {
    n += 1;
  }
  return `${base}-${n}`;
}

export function timestampToMs(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof val === 'object' && val !== null) {
    const rec = val as { toMillis?: () => number; seconds?: number };
    if (typeof rec.toMillis === 'function') return rec.toMillis();
    if (typeof rec.seconds === 'number') return rec.seconds * 1000;
  }
  return 0;
}

export function computeOverviewMetrics(
  orders: Order[],
  products: Product[],
  days: 7 | 30,
  nowMs: number = Date.now()
): {
  totalRevenue: number;
  activeOrdersCount: number;
  lowStockCount: number;
  totalUnits: number;
  chartData: { label: string; revenue: number; orders: number }[];
} {
  const nonCancelled = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = nonCancelled.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'new' || o.status === 'confirmed' || o.status === 'shipped'
  ).length;

  let lowStockCount = 0;
  let totalUnits = 0;
  for (const p of products) {
    for (const s of p.sizes) {
      totalUnits += Math.max(0, s.stock);
      if (s.stock <= 5) lowStockCount += 1;
    }
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const buckets: { key: string; label: string; revenue: number; orders: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(nowMs - i * dayMs);
    const key = d.toISOString().slice(0, 10);
    const label =
      days === 7
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : `${d.getMonth() + 1}/${d.getDate()}`;
    buckets.push({ key, label, revenue: 0, orders: 0 });
  }

  const bucketMap = new Map(buckets.map((b) => [b.key, b]));
  for (const o of nonCancelled) {
    const ms = timestampToMs(o.createdAt);
    if (ms <= 0) continue;
    const key = new Date(ms).toISOString().slice(0, 10);
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.revenue += o.total || 0;
      bucket.orders += 1;
    }
  }

  return {
    totalRevenue,
    activeOrdersCount,
    lowStockCount,
    totalUnits,
    chartData: buckets.map(({ label, revenue, orders: count }) => ({ label, revenue, orders: count })),
  };
}

export function recomputeOrderComparison(
  order: Order,
  products: Product[]
): {
  currentSubtotal: number;
  storedSubtotal: number;
  hasMismatch: boolean;
  details: string[];
} {
  const byId = new Map(products.map((p) => [p.id, p]));
  const details: string[] = [];
  let currentSubtotal = 0;

  for (const item of order.items) {
    const prod = byId.get(item.productId);
    if (!prod) {
      currentSubtotal += item.price * item.qty;
    } else {
      currentSubtotal += prod.price * item.qty;
      if (prod.price !== item.price) {
        details.push(
          `${item.name}: ordered at ${formatPKR(item.price)}, current price is ${formatPKR(prod.price)}.`
        );
      }
    }
  }

  const hasMismatch = currentSubtotal !== order.subtotal || details.length > 0;
  return {
    currentSubtotal,
    storedSubtotal: order.subtotal,
    hasMismatch,
    details,
  };
}

export function planOrderConfirmationStock(
  order: Order,
  productsById: Map<string, Product>
):
  | { ok: true; updatedSizesByProductId: Map<string, ProductSizeStock[]>; skippedItems: string[] }
  | { ok: false; reason: string } {
  const updated = new Map<string, ProductSizeStock[]>();
  const skippedItems: string[] = [];

  for (const item of order.items) {
    const product = productsById.get(item.productId);
    if (!product) {
      skippedItems.push(item.name);
      continue;
    }

    const sizesCopy = (updated.get(item.productId) || product.sizes).map((s) => ({ ...s }));
    const idx = sizesCopy.findIndex((s) => s.label === item.size);
    if (idx < 0) {
      return { ok: false, reason: `Size "${item.size}" missing on "${product.name}".` };
    }
    if (sizesCopy[idx].stock < item.qty) {
      return {
        ok: false,
        reason: `Insufficient stock for "${product.name}" size ${item.size} (requested ${item.qty}, available ${sizesCopy[idx].stock}).`,
      };
    }
    sizesCopy[idx].stock -= item.qty;
    updated.set(item.productId, sizesCopy);
  }

  return { ok: true, updatedSizesByProductId: updated, skippedItems };
}

export interface CustomerSummary {
  key: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAtMs: number;
  subscribed: boolean;
}

export function deriveCustomerDirectory(orders: Order[], subscribers: Subscriber[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();

  for (const o of orders) {
    const email = (o.customer.email || '').trim().toLowerCase();
    const phone = (o.customer.phone || '').trim();
    const key = email || phone || o.customer.name.trim().toLowerCase();
    if (!key) continue;

    const existing = map.get(key);
    const ms = timestampToMs(o.createdAt);
    const revenueAdd = o.status === 'cancelled' ? 0 : o.total || 0;

    if (!existing) {
      map.set(key, {
        key,
        name: o.customer.name || 'Customer',
        email,
        phone,
        city: o.customer.city || '',
        ordersCount: 1,
        totalSpent: revenueAdd,
        lastOrderAtMs: ms,
        subscribed: false,
      });
    } else {
      existing.ordersCount += 1;
      existing.totalSpent += revenueAdd;
      if (ms > existing.lastOrderAtMs) {
        existing.lastOrderAtMs = ms;
        if (o.customer.name) existing.name = o.customer.name;
        if (o.customer.city) existing.city = o.customer.city;
        if (phone) existing.phone = phone;
      }
    }
  }

  for (const sub of subscribers) {
    const email = (sub.email || '').trim().toLowerCase();
    if (!email) continue;
    const existing = map.get(email);
    const ms = timestampToMs(sub.createdAt);
    if (existing) {
      existing.subscribed = true;
    } else {
      map.set(email, {
        key: email,
        name: email.split('@')[0] || 'Subscriber',
        email,
        phone: '',
        city: 'Subscriber',
        ordersCount: 0,
        totalSpent: 0,
        lastOrderAtMs: ms,
        subscribed: true,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.totalSpent - a.totalSpent || b.lastOrderAtMs - a.lastOrderAtMs
  );
}

export function formatWhatsAppOutreachUrl(rawPhone: string, prefillMessage: string): string {
  const digits = rawPhone.replace(/[^\d]/g, '');
  let normalized = digits;
  if (normalized.startsWith('03') && normalized.length === 11) {
    normalized = `92${normalized.slice(1)}`;
  } else if (normalized.startsWith('00')) {
    normalized = normalized.slice(2);
  }
  const encoded = encodeURIComponent(prefillMessage.trim());
  return normalized.length >= 10
    ? `https://wa.me/${normalized}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

function csvCell(val: unknown): string {
  const str = String(val ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

export function ordersToCsv(orders: Order[]): string {
  const header = [
    'OrderNo',
    'Date',
    'Customer',
    'Email',
    'Phone',
    'City',
    'Address',
    'Items',
    'Subtotal',
    'Shipping',
    'Discount',
    'TotalPKR',
    'PaymentMethod',
    'TransactionId',
    'PaymentStatus',
    'OrderStatus',
    'Courier',
    'TrackingNo',
  ];
  const rows = orders.map((o) => {
    const ms = timestampToMs(o.createdAt);
    const dateStr = ms ? new Date(ms).toISOString() : '';
    const itemsStr = o.items.map((i) => `${i.name} (${i.colour}/${i.size}) x${i.qty}`).join('; ');
    return [
      o.orderNo,
      dateStr,
      o.customer.name,
      o.customer.email,
      o.customer.phone,
      o.customer.city,
      o.customer.address,
      itemsStr,
      o.subtotal,
      o.shipping,
      o.discount,
      o.total,
      o.paymentMethod,
      o.transactionId,
      o.paymentStatus,
      o.status,
      o.courier,
      o.trackingNo,
    ]
      .map(csvCell)
      .join(',');
  });
  return [header.join(','), ...rows].join('\n');
}

export function subscribersToCsv(subs: Subscriber[]): string {
  const header = ['Email', 'SubscribedAt'];
  const rows = subs.map((s) => {
    const ms = timestampToMs(s.createdAt);
    return [s.email, ms ? new Date(ms).toISOString() : ''].map(csvCell).join(',');
  });
  return [header.join(','), ...rows].join('\n');
}

export function customersToCsv(customers: CustomerSummary[]): string {
  const header = ['Name', 'Email', 'Phone', 'City', 'Orders', 'TotalSpentPKR', 'Newsletter'];
  const rows = customers.map((c) =>
    [c.name, c.email, c.phone, c.city, c.ordersCount, c.totalSpent, c.subscribed ? 'Yes' : 'No']
      .map(csvCell)
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

export async function resizeImageToWebP(file: File, maxDimension = 1920): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Invalid image file.'));
    image.src = dataUrl;
  });

  const ratio = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * ratio));
  const height = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');
  ctx.drawImage(img, 0, 0, width, height);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Failed to encode WebP image.'));
        else resolve(blob);
      },
      'image/webp',
      0.86
    );
  });
}

export function buildSampleHoodieSvgDataUrl(bgHex: string, hoodieHex: string, title: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <defs>
      <radialGradient id="g" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>
      </radialGradient>
    </defs>
    <rect width="800" height="1000" fill="${bgHex}"/>
    <rect width="800" height="1000" fill="url(#g)"/>
    <ellipse cx="400" cy="835" rx="180" ry="26" fill="#000000" opacity="0.45"/>
    <path d="M310 210 C310 155, 490 155, 490 210 L555 260 L645 470 L565 505 L535 375 L535 760 L265 760 L265 375 L235 505 L155 470 L245 260 Z" fill="${hoodieHex}" stroke="#ffffff" stroke-opacity="0.18" stroke-width="3"/>
    <path d="M335 215 Q400 265 465 215" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="4"/>
    <rect x="310" y="545" width="180" height="115" rx="18" fill="#000000" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.14"/>
    <text x="400" y="925" text-anchor="middle" fill="#E4E2E1" font-family="sans-serif" font-size="22" letter-spacing="3">${title.replace(/[<>&"]/g, '')}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
