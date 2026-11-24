import { supabase } from './firebase';
import type {
  AdminUser,
  CmsPage,
  Collection,
  CourierName,
  DiscountCode,
  HeroSlide,
  HomepageData,
  MediaAsset,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  SiteSettings,
  Subscriber,
  Testimonial,
} from './types';
import {
  STUDIO_ASSET_PRESETS,
} from './initialCatalogMigration';
import {
  type ResolvedAdminRole,
  ensureUniqueSlug,
  isOwnerEmail,
  resolveAdminRole,
  validateNewMemberEmail,
} from '../utils/adminLogic';

export const DEFAULT_ADMIN_SETTINGS: SiteSettings = {
  brandName: 'ZORVIQUE',
  logoUrl: '',
  colors: {
    primary: '#FF7A00',
    background: '#121212',
    surface: '#1F2020',
  },
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Shop Hoodies', href: '/shop' },
    { label: 'Shipping', href: '/page/shipping-returns' },
    { label: 'Support', href: '/page/support' },
  ],
  footerLinks: [
    { label: 'Privacy Policy', href: '/page/privacy-policy' },
    { label: 'Terms of Service', href: '/page/terms-of-service' },
    { label: 'Support', href: '/page/support' },
  ],
  social: { instagram: '', facebook: '', tiktok: '', whatsapp: '03084540977' },
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
    jazzcash: {
      enabled: true,
      account: '0300-0000000 (Zorvique Studio)',
      instructions: 'Transfer the grand total to our JazzCash wallet and enter your TID below.',
    },
    easypaisa: {
      enabled: true,
      account: '0345-0000000 (Zorvique Studio)',
      instructions: 'Send exact total via EasyPaisa app and enter the 10-digit TID.',
    },
  },
  seo: {
    title: "Zorvique — Luxury Women's Hoodies Pakistan",
    description: 'Architectural fleece hoodies crafted in Pakistan for quiet luxury warmth.',
    ogImage: '',
  },
};

export const DEFAULT_ADMIN_HOMEPAGE: HomepageData = {
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

export async function resolveAuthorizedAdminRole(email: string): Promise<ResolvedAdminRole> {
  const normalized = email.trim().toLowerCase();
  if (isOwnerEmail(normalized)) {
    return 'owner';
  }
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', normalized)
      .single();
    if (error || !data) return null;
    return resolveAdminRole(normalized, (data as Record<string, unknown>).role as string);
  } catch {
    return null;
  }
}

export async function checkIsAuthorizedAdmin(email: string): Promise<boolean> {
  const role = await resolveAuthorizedAdminRole(email);
  return role !== null;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const { data } = await supabase.from('pages').select('*').eq('slug', 'site_settings_main').single();
    if (!data || !(data as Record<string, unknown>).body) return DEFAULT_ADMIN_SETTINGS;
    const raw = JSON.parse(String((data as Record<string, unknown>).body)) as Partial<SiteSettings>;
    return {
      ...DEFAULT_ADMIN_SETTINGS,
      ...raw,
      colors: { ...DEFAULT_ADMIN_SETTINGS.colors, ...(raw.colors || {}) },
      social: {
        ...DEFAULT_ADMIN_SETTINGS.social,
        ...(raw.social || {}),
        whatsapp: raw.social?.whatsapp?.trim() || DEFAULT_ADMIN_SETTINGS.social.whatsapp,
      },
      shipping: {
        ...DEFAULT_ADMIN_SETTINGS.shipping,
        ...(raw.shipping || {}),
        flatByCity: {
          ...DEFAULT_ADMIN_SETTINGS.shipping.flatByCity,
          ...(raw.shipping?.flatByCity || {}),
        },
      },
      payments: {
        cod: { ...DEFAULT_ADMIN_SETTINGS.payments.cod, ...(raw.payments?.cod || {}) },
        jazzcash: { ...DEFAULT_ADMIN_SETTINGS.payments.jazzcash, ...(raw.payments?.jazzcash || {}) },
        easypaisa: { ...DEFAULT_ADMIN_SETTINGS.payments.easypaisa, ...(raw.payments?.easypaisa || {}) },
      },
      seo: { ...DEFAULT_ADMIN_SETTINGS.seo, ...(raw.seo || {}) },
    };
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  await supabase.from('pages').upsert({
    slug: 'site_settings_main',
    title: 'Site Settings',
    body: JSON.stringify(settings),
    visible: true,
  });
}

export async function fetchHomepage(): Promise<HomepageData> {
  try {
    const { data } = await supabase.from('pages').select('*').eq('slug', 'homepage_main').single();
    if (!data || !(data as Record<string, unknown>).body) return DEFAULT_ADMIN_HOMEPAGE;
    return { ...DEFAULT_ADMIN_HOMEPAGE, ...(JSON.parse(String((data as Record<string, unknown>).body)) as Partial<HomepageData>) };
  } catch {
    return DEFAULT_ADMIN_HOMEPAGE;
  }
}

export async function saveHomepage(homepage: HomepageData): Promise<void> {
  await supabase.from('pages').upsert({
    slug: 'homepage_main',
    title: 'Homepage Settings',
    body: JSON.stringify(homepage),
    visible: true,
  });
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*');
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((d) => ({
    id: String(d.id || ''),
    name: String(d.name || ''),
    slug: String(d.slug || ''),
    sku: String(d.sku || ''),
    description: String(d.description || ''),
    fabric: String(d.fabric || ''),
    price: Number(d.price || 0),
    compareAtPrice: d.compare_at_price ? Number(d.compare_at_price) : null,
    badges: Array.isArray(d.badges) ? (d.badges as string[]) : [],
    collectionId: String(d.collection_id || ''),
    colourways: Array.isArray(d.colourways) ? (d.colourways as Record<string, unknown>[]) : [],
    sizes: Array.isArray(d.sizes) ? (d.sizes as Record<string, unknown>[]) : [],
    status: (d.status === 'published' ? 'published' : 'draft') as 'draft' | 'published',
    featured: Boolean(d.featured),
    showOnRack: d.show_on_rack !== false,
    rackOrder: typeof d.rack_order === 'number' ? d.rack_order : undefined,
    seoTitle: String(d.seo_title || ''),
    seoDescription: String(d.seo_description || ''),
    isSample: Boolean(d.is_sample),
    createdAt: new Date(String(d.created_at || Date.now())).getTime(),
    updatedAt: new Date(String(d.updated_at || Date.now())).getTime(),
  })).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveProduct(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string,
  allProducts: Product[] = []
): Promise<string> {
  const cleanName = product.name.trim();
  const cleanSku = product.sku.trim();
  if (!cleanName || !cleanSku) {
    throw new Error('Product name and SKU are required.');
  }

  const id = existingId || `prod_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const existingSlugs = allProducts.map((p) => p.slug);
  const current = existingId ? allProducts.find((p) => p.id === existingId) : undefined;
  const uniqueSlug = ensureUniqueSlug(product.slug || cleanName, existingSlugs, current?.slug);

  const payload = {
    id,
    name: cleanName,
    slug: uniqueSlug,
    sku: cleanSku,
    description: product.description.trim(),
    fabric: product.fabric.trim(),
    price: Math.round(product.price),
    compare_at_price: product.compareAtPrice && product.compareAtPrice > 0 ? Math.round(product.compareAtPrice) : null,
    badges: product.badges.map((b) => b.trim()).filter(Boolean),
    collection_id: product.collectionId.trim(),
    colourways: product.colourways,
    sizes: product.sizes,
    status: product.status,
    featured: Boolean(product.featured),
    show_on_rack: product.showOnRack !== false,
    rack_order: typeof product.rackOrder === 'number' ? product.rackOrder : null,
    seo_title: product.seoTitle.trim(),
    seo_description: product.seoDescription.trim(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('products').upsert(payload);
  if (error) throw new Error(error.message);
  return id;
}

export async function duplicateProduct(source: Product, allProducts: Product[]): Promise<string> {
  const existingSlugs = allProducts.map((p) => p.slug);
  const copyName = `${source.name} (Copy)`;
  const uniqueSlug = ensureUniqueSlug(copyName, existingSlugs);
  const id = `prod_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

  const payload = {
    id,
    name: copyName,
    slug: uniqueSlug,
    sku: `${source.sku}-COPY`,
    description: source.description,
    fabric: source.fabric,
    price: source.price,
    compare_at_price: source.compareAtPrice ?? null,
    badges: [...source.badges],
    collection_id: source.collectionId,
    colourways: source.colourways,
    sizes: source.sizes,
    status: 'draft',
    featured: false,
    show_on_rack: source.showOnRack ?? true,
    seo_title: source.seoTitle,
    seo_description: source.seoDescription,
    updated_at: new Date().toISOString(),
  };

  await supabase.from('products').insert(payload);
  return id;
}

export async function toggleProductStatus(id: string, status: 'draft' | 'published'): Promise<void> {
  await supabase.from('products').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
}

export async function updateProductRackPlacement(
  id: string,
  patch: { showOnRack?: boolean; rackOrder?: number }
): Promise<void> {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.showOnRack !== undefined) updateData.show_on_rack = patch.showOnRack;
  if (patch.rackOrder !== undefined) updateData.rack_order = patch.rackOrder;
  await supabase.from('products').update(updateData).eq('id', id);
}

export async function reorderRackProducts(ordered: Product[]): Promise<void> {
  for (let idx = 0; idx < ordered.length; idx++) {
    await supabase.from('products').update({ rack_order: idx, show_on_rack: true }).eq('id', ordered[idx].id);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  await supabase.from('products').delete().eq('id', id);
}

export async function fetchCollections(): Promise<Collection[]> {
  const { data } = await supabase.from('collections').select('*');
  if (!data) return [];
  return (data as Record<string, unknown>[]).map((d) => ({
    id: String(d.id || ''),
    name: String(d.name || ''),
    slug: String(d.slug || ''),
    order: Number(d.order || 0),
    visible: d.visible !== false,
    isSample: Boolean(d.is_sample),
  })).sort((a, b) => a.order - b.order);
}

export async function saveCollection(item: Omit<Collection, 'id'>, existingId?: string): Promise<string> {
  const id = existingId || `col_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  await supabase.from('collections').upsert({
    id,
    name: item.name,
    slug: item.slug,
    order: item.order,
    visible: item.visible,
  });
  return id;
}

export async function deleteCollection(id: string): Promise<void> {
  await supabase.from('collections').delete().eq('id', id);
}

export async function fetchHeroSlides(): Promise<HeroSlide[]> {
  const { data } = await supabase.from('hero_slides').select('*');
  if (!data) return [];
  return (data as Record<string, unknown>[]).map((d) => ({
    id: String(d.id || ''),
    order: Number(d.order || 0),
    productId: String(d.product_id || ''),
    colourName: String(d.colour_name || ''),
    bgColor: String(d.bg_color || '#000'),
    headline: String(d.headline || ''),
    body: String(d.body || ''),
    ctaLabel: String(d.cta_label || ''),
    ctaLink: String(d.cta_link || ''),
    imageUrl: String(d.image_url || ''),
    active: d.active !== false,
    isSample: Boolean(d.is_sample),
  })).sort((a, b) => a.order - b.order);
}

export async function saveHeroSlide(slide: Omit<HeroSlide, 'id'>, existingId?: string): Promise<string> {
  const id = existingId || `slide_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  await supabase.from('hero_slides').upsert({
    id,
    order: slide.order,
    product_id: slide.productId,
    colour_name: slide.colourName,
    bg_color: slide.bgColor,
    headline: slide.headline,
    body: slide.body,
    cta_label: slide.ctaLabel,
    cta_link: slide.ctaLink,
    image_url: slide.imageUrl,
    active: slide.active,
  });
  return id;
}

export async function deleteHeroSlide(id: string): Promise<void> {
  await supabase.from('hero_slides').delete().eq('id', id);
}

export async function reorderHeroSlides(slides: HeroSlide[]): Promise<void> {
  for (let idx = 0; idx < slides.length; idx++) {
    await supabase.from('hero_slides').update({ order: idx }).eq('id', slides[idx].id);
  }
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const { data } = await supabase.from('testimonials').select('*');
  if (!data) return [];
  return (data as Record<string, unknown>[]).map((d) => ({
    id: String(d.id || ''),
    name: String(d.name || ''),
    city: String(d.city || ''),
    rating: Number(d.rating || 5),
    text: String(d.text || ''),
    visible: d.visible !== false,
    isSample: Boolean(d.is_sample),
  }));
}

export async function saveTestimonial(item: Omit<Testimonial, 'id'>, existingId?: string): Promise<string> {
  const id = existingId || `test_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  await supabase.from('testimonials').upsert({
    id,
    name: item.name,
    city: item.city,
    rating: item.rating,
    text: item.text,
    visible: item.visible,
  });
  return id;
}

export async function deleteTestimonial(id: string): Promise<void> {
  await supabase.from('testimonials').delete().eq('id', id);
}

export async function fetchPages(): Promise<CmsPage[]> {
  const { data } = await supabase.from('pages').select('*');
  if (!data) return [];
  return (data as Record<string, unknown>[]).map((d) => ({
    slug: String(d.slug || ''),
    title: String(d.title || ''),
    body: String(d.body || ''),
    visible: d.visible !== false,
  }));
}

export async function savePage(page: CmsPage): Promise<void> {
  await supabase.from('pages').upsert({
    slug: page.slug,
    title: page.title,
    body: page.body,
    visible: page.visible,
  });
}

export async function deletePage(slug: string): Promise<void> {
  await supabase.from('pages').delete().eq('slug', slug);
}

export async function fetchOrders(): Promise<Order[]> {
  const { data } = await supabase.from('orders').select('*');
  if (!data) return [];
  return (data as Record<string, unknown>[]).map((d) => ({
    id: String(d.id || ''),
    orderNo: String(d.order_no || ''),
    customer: (d.customer || {}) as Order['customer'],
    items: [],
    subtotal: Number(d.subtotal || 0),
    shipping: Number(d.shipping || 0),
    discount: Number(d.discount || 0),
    discountCode: d.discount_code ? String(d.discount_code) : undefined,
    total: Number(d.total || 0),
    paymentMethod: String(d.payment_method || 'cod') as Order['paymentMethod'],
    transactionId: String(d.transaction_id || ''),
    paymentStatus: String(d.payment_status || 'pending') as Order['paymentStatus'],
    status: String(d.status || 'new') as Order['status'],
    courier: String(d.courier || '') as Order['courier'],
    trackingNo: String(d.tracking_no || ''),
    createdAt: new Date(String(d.created_at || Date.now())).getTime(),
  })).sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateOrderAtomic(
  order: Order,
  patch: {
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    courier: CourierName;
    trackingNo: string;
    transactionId: string;
  }
): Promise<void> {
  await supabase.from('orders').update({
    status: patch.status,
    payment_status: patch.paymentStatus,
    courier: patch.courier,
    tracking_no: patch.trackingNo,
    transaction_id: patch.transactionId,
  }).eq('id', order.id);
}

export async function fetchDiscountCodes(): Promise<DiscountCode[]> {
  const { data } = await supabase.from('discount_codes').select('*');
  if (!data) return [];
  return (data as Record<string, unknown>[]).map((d) => ({
    code: String(d.code || ''),
    percent: Number(d.percent || 0),
    usageLimit: d.usage_limit ? Number(d.usage_limit) : null,
    usedCount: Number(d.used_count || 0),
    expiresAt: d.expires_at ? new Date(String(d.expires_at)).getTime() : null,
    active: d.active !== false,
  }));
}

export async function saveDiscountCode(item: DiscountCode): Promise<void> {
  const code = item.code.trim().toUpperCase();
  await supabase.from('discount_codes').upsert({
    code,
    percent: item.percent,
    usage_limit: item.usageLimit,
    used_count: item.usedCount,
    expires_at: item.expiresAt ? new Date(item.expiresAt).toISOString() : null,
    active: item.active,
  });
}

export async function deleteDiscountCode(code: string): Promise<void> {
  await supabase.from('discount_codes').delete().eq('code', code);
}

export async function fetchSubscribers(): Promise<Subscriber[]> {
  const { data } = await supabase.from('subscribers').select('*');
  if (!data) return [];
  return (data as Record<string, unknown>[]).map((d) => ({
    id: String(d.id || ''),
    email: String(d.email || ''),
    createdAt: new Date(String(d.created_at || Date.now())).getTime(),
  })).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteSubscriber(id: string): Promise<void> {
  await supabase.from('subscribers').delete().eq('id', id);
}

export async function fetchMediaAssets(): Promise<MediaAsset[]> {
  const { data } = await supabase.from('media').select('*');
  if (!data) return [];
  return (data as Record<string, unknown>[]).map((d) => ({
    id: String(d.id || ''),
    name: String(d.name || ''),
    url: String(d.url || ''),
    storagePath: String(d.storage_path || ''),
    contentType: String(d.content_type || 'image/jpeg'),
    size: Number(d.size || 0),
    createdAt: new Date(String(d.created_at || Date.now())).getTime(),
  })).sort((a, b) => b.createdAt - a.createdAt);
}

export async function registerMediaUrl(input: {
  name?: string;
  url: string;
  contentType?: string;
}): Promise<MediaAsset> {
  const url = input.url.trim();
  if (!url) {
    throw new Error('Enter a valid image or video path/URL.');
  }
  const mediaId = `med_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const record = {
    id: mediaId,
    name: input.name?.trim() || 'Studio Asset',
    url,
    storage_path: 'url-asset',
    content_type: input.contentType || 'image/jpeg',
    size: 0,
  };
  await supabase.from('media').insert(record);
  return { id: mediaId, name: record.name, url, storagePath: 'url-asset', contentType: record.content_type, size: 0, createdAt: Date.now() };
}

export async function importStudioMediaPresets(existingMedia: MediaAsset[]): Promise<number> {
  const existingUrls = new Set(existingMedia.map((m) => m.url.trim()));
  const missing = STUDIO_ASSET_PRESETS.filter((preset) => !existingUrls.has(preset.url));
  for (const preset of missing) {
    const mediaId = `med_${preset.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    await supabase.from('media').upsert({
      id: mediaId,
      name: `${preset.label} Hoodie`,
      url: preset.url,
      storage_path: 'static-asset',
      content_type: 'image/jpeg',
      size: 0,
    });
  }
  return missing.length;
}

export async function deleteMediaRecord(asset: MediaAsset): Promise<void> {
  await supabase.from('media').delete().eq('id', asset.id);
}

export async function fetchAdmins(): Promise<AdminUser[]> {
  const { data } = await supabase.from('admins').select('*');
  if (!data) return [];
  return (data as Record<string, unknown>[]).map((d) => ({
    email: String(d.email || ''),
    role: String(d.role || 'member'),
    createdAt: new Date(String(d.created_at || Date.now())).getTime(),
  }));
}

export async function addAdminEmail(email: string): Promise<void> {
  const check = validateNewMemberEmail(email);
  if (!check.ok) {
    throw new Error(check.reason);
  }
  await supabase.from('admins').upsert({
    email: check.email,
    role: 'member',
  });
}

export async function removeAdminEmail(email: string): Promise<void> {
  const clean = email.trim().toLowerCase();
  if (isOwnerEmail(clean)) {
    throw new Error('The primary Store Admin (Owner) account cannot be removed.');
  }
  await supabase.from('admins').delete().eq('email', clean);
}

export async function loadSampleData(): Promise<void> {
  await saveSiteSettings(DEFAULT_ADMIN_SETTINGS);
  await saveHomepage(DEFAULT_ADMIN_HOMEPAGE);
}

export async function deleteAllSampleData(): Promise<number> {
  return 0;
}

export async function repairPlaceholderStudioImages(): Promise<number> {
  return 0;
}

export async function importStudioCatalog(): Promise<{ createdCount: number; repairedCount: number }> {
  return { createdCount: 0, repairedCount: 0 };
}
