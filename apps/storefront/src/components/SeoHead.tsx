import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  clampSeoText,
  formatSeoTitle,
  resolveAbsoluteImageUrl,
  resolveCanonicalUrl,
} from '../utils/seo';

interface ProductSeoMeta {
  priceAmount: number;
  currency?: string;
  availability?: 'instock' | 'outofstock';
  brand?: string;
}

interface SeoHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  imageUrl?: string;
  ogType?: 'website' | 'product';
  noIndex?: boolean;
  productMeta?: ProductSeoMeta | null;
  jsonLd?: Record<string, unknown> | null;
}

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(selector: string) {
  const el = document.head.querySelector(selector);
  if (el) el.remove();
}

export function SeoHead({
  title,
  description,
  canonicalPath,
  imageUrl,
  ogType = 'website',
  noIndex = false,
  productMeta = null,
  jsonLd = null,
}: SeoHeadProps) {
  const { settings } = useStore();
  const location = useLocation();

  const brand = settings.brandName.trim() || 'Zorvique';
  const fullTitle = formatSeoTitle(title, brand, settings.seo.title);
  const metaDesc = clampSeoText(description || settings.seo.description, 160);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = resolveCanonicalUrl(origin, location.pathname, canonicalPath);
  const resolvedImage =
    resolveAbsoluteImageUrl(origin, imageUrl) ||
    resolveAbsoluteImageUrl(origin, settings.seo.ogImage);

  useEffect(() => {
    document.title = fullTitle;

    let canonicalLink = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    upsertMeta('meta[name="robots"]', 'name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('meta[name="description"]', 'name', 'description', metaDesc);

    upsertMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', brand);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', metaDesc);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);

    upsertMeta(
      'meta[name="twitter:card"]',
      'name',
      'twitter:card',
      resolvedImage ? 'summary_large_image' : 'summary'
    );
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', metaDesc);

    if (resolvedImage) {
      upsertMeta('meta[property="og:image"]', 'property', 'og:image', resolvedImage);
      upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', resolvedImage);
    } else {
      removeMeta('meta[property="og:image"]');
      removeMeta('meta[name="twitter:image"]');
    }

    if (ogType === 'product' && productMeta) {
      upsertMeta(
        'meta[property="product:price:amount"]',
        'property',
        'product:price:amount',
        String(productMeta.priceAmount)
      );
      upsertMeta(
        'meta[property="product:price:currency"]',
        'property',
        'product:price:currency',
        productMeta.currency || 'PKR'
      );
      if (productMeta.availability) {
        upsertMeta(
          'meta[property="product:availability"]',
          'property',
          'product:availability',
          productMeta.availability
        );
      }
      upsertMeta(
        'meta[property="product:brand"]',
        'property',
        'product:brand',
        productMeta.brand || brand
      );
    } else {
      removeMeta('meta[property="product:price:amount"]');
      removeMeta('meta[property="product:price:currency"]');
      removeMeta('meta[property="product:availability"]');
      removeMeta('meta[property="product:brand"]');
    }
  }, [brand, canonicalUrl, fullTitle, metaDesc, noIndex, ogType, productMeta, resolvedImage]);

  useEffect(() => {
    const scriptId = 'zorvique-jsonld';
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();
    if (!jsonLd) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [jsonLd]);

  return null;
}
