import type { Product } from '../data/types';
import { formatPKR } from './commerce';

export function clampSeoText(raw: string | undefined | null, maxLength = 160): string {
  const clean = (raw || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= maxLength) return clean;
  const slice = clean.slice(0, Math.max(1, maxLength - 1));
  const lastSpace = slice.lastIndexOf(' ');
  const trimmed = lastSpace > Math.floor(maxLength * 0.55) ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.replace(/[.,;:!?-]+$/, '')}…`;
}

export function formatSeoTitle(
  rawTitle: string | undefined | null,
  brandName: string,
  fallbackTitle: string
): string {
  const brand = brandName.trim() || 'Zorvique';
  const base = (rawTitle || '').replace(/\s+/g, ' ').trim() || fallbackTitle.trim() || brand;
  if (base.toLowerCase().includes(brand.toLowerCase())) {
    return base;
  }
  return `${base} — ${brand}`;
}

export function resolveCanonicalUrl(
  origin: string | undefined | null,
  pathname: string | undefined | null,
  canonicalPath?: string | null
): string {
  const rawPath = (canonicalPath || pathname || '/').split('?')[0].split('#')[0].trim() || '/';
  const collapsed = rawPath.replace(/\/{2,}/g, '/');
  const withLeadingSlash = collapsed.startsWith('/') ? collapsed : `/${collapsed}`;
  const normalizedPath =
    withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')
      ? withLeadingSlash.slice(0, -1)
      : withLeadingSlash;

  const cleanOrigin = (origin || '').trim().replace(/\/+$/, '');
  if (!cleanOrigin) {
    return normalizedPath;
  }
  return `${cleanOrigin}${normalizedPath}`;
}

export function resolveAbsoluteImageUrl(
  origin: string | undefined | null,
  rawImage?: string | null
): string {
  const clean = (rawImage || '').trim();
  if (!clean || clean.startsWith('data:')) {
    return '';
  }
  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }
  const cleanOrigin = (origin || '').trim().replace(/\/+$/, '');
  if (!cleanOrigin) {
    return clean;
  }
  const path = clean.startsWith('/') ? clean : `/${clean}`;
  return `${cleanOrigin}${path}`;
}

export interface ProductSeoInput {
  product: Product;
  brandName: string;
  heroImage?: string | null;
  fallbackOgImage?: string | null;
  siteOrigin?: string | null;
  reviewCount?: number;
  averageRatingLabel?: string;
}

export interface ProductSeoOutput {
  title: string;
  description: string;
  canonicalPath: string;
  canonicalUrl: string;
  imageUrl: string;
  availability: 'instock' | 'outofstock';
  jsonLd: Record<string, unknown>;
}

export function buildProductSeoMetadata({
  product,
  brandName,
  heroImage,
  fallbackOgImage,
  siteOrigin = '',
  reviewCount = 0,
  averageRatingLabel,
}: ProductSeoInput): ProductSeoOutput {
  const brand = brandName.trim() || 'Zorvique';
  const customTitle = product.seoTitle?.trim();
  const baseTitle = customTitle
    ? customTitle
    : product.name.toLowerCase().includes('hoodie')
      ? product.name
      : `${product.name} Hoodie`;

  const title = formatSeoTitle(baseTitle, brand, product.name);

  const customDesc = product.seoDescription?.trim();
  const fallbackDesc = [
    product.description?.trim(),
    product.fabric ? `${product.fabric}.` : '',
    `Shop ${product.name} for ${formatPKR(product.price)} with fast dispatch across Pakistan.`,
  ]
    .filter(Boolean)
    .join(' ');
  const description = clampSeoText(customDesc || fallbackDesc, 160);

  const canonicalPath = `/product/${product.slug}`;
  const canonicalUrl = resolveCanonicalUrl(siteOrigin, canonicalPath, canonicalPath);
  const imageUrl =
    resolveAbsoluteImageUrl(siteOrigin, heroImage) ||
    resolveAbsoluteImageUrl(siteOrigin, fallbackOgImage);

  const totalStock = product.sizes.reduce((sum, s) => sum + Math.max(0, s.stock), 0);
  const availability: 'instock' | 'outofstock' = totalStock > 0 ? 'instock' : 'outofstock';

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description,
    url: canonicalUrl,
    ...(imageUrl ? { image: imageUrl } : {}),
    brand: { '@type': 'Brand', name: brand },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'PKR',
      price: product.price,
      availability:
        totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(reviewCount > 0 && averageRatingLabel
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: averageRatingLabel,
            reviewCount,
          },
        }
      : {}),
  };

  return {
    title,
    description,
    canonicalPath,
    canonicalUrl,
    imageUrl,
    availability,
    jsonLd,
  };
}
