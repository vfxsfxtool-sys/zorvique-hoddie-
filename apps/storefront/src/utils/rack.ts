import type { HeroSlide, Product } from '../data/types';
import { parseProductTimestampMs } from './commerce';

export interface RackPiece {
  id: string;
  pieceNumber: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number | null;
  colourName: string;
  colourHex: string;
  imageUrl: string;
  fabric: string;
  description: string;
  sizes: { label: string; stock: number }[];
}

export function resolveStudioProductImage(
  productId: string,
  rawUrl: string | undefined | null,
  studioPhotoMap: Record<string, string>
): string {
  const clean = (rawUrl || '').trim();
  const isSvgPlaceholder = clean.startsWith('data:image/svg+xml');
  if (clean && !isSvgPlaceholder) {
    return clean;
  }
  if (productId && studioPhotoMap[productId]) {
    return studioPhotoMap[productId];
  }
  return clean;
}

export function normalizeProductImages(
  product: Product,
  studioPhotoMap: Record<string, string>
): Product {
  const fallbackPhoto = studioPhotoMap[product.id];
  if (!fallbackPhoto) return product;

  let changed = false;
  const colourways = product.colourways.map((cw) => {
    const first = cw.images?.[0];
    const resolvedFirst = resolveStudioProductImage(product.id, first, studioPhotoMap);
    if (resolvedFirst !== (first || '')) {
      changed = true;
      const nextImages = cw.images.length > 0 ? [resolvedFirst, ...cw.images.slice(1)] : [resolvedFirst];
      return { ...cw, images: nextImages };
    }
    return cw;
  });

  return changed ? { ...product, colourways } : product;
}

export function selectAndBuildRackItems(
  publishedProducts: Product[],
  heroSlides: HeroSlide[],
  studioPhotoMap: Record<string, string>,
  maxItems = 12
): RackPiece[] {
  const activeSlidesByProduct = new Map<string, HeroSlide>();
  for (const slide of heroSlides) {
    if (slide.active && slide.productId && !activeSlidesByProduct.has(slide.productId)) {
      activeSlidesByProduct.set(slide.productId, slide);
    }
  }

  const eligibleLive = publishedProducts.filter(
    (p) => p.status === 'published' && p.showOnRack !== false
  );
  if (eligibleLive.length === 0) {
    return [];
  }

  const source = [...eligibleLive]
    .sort((a, b) => {
      const aHasOrder = typeof a.rackOrder === 'number' && Number.isFinite(a.rackOrder);
      const bHasOrder = typeof b.rackOrder === 'number' && Number.isFinite(b.rackOrder);
      if (aHasOrder && bHasOrder && a.rackOrder !== b.rackOrder) {
        return (a.rackOrder as number) - (b.rackOrder as number);
      }
      if (aHasOrder !== bHasOrder) return aHasOrder ? -1 : 1;

      const aSlide = activeSlidesByProduct.get(a.id);
      const bSlide = activeSlidesByProduct.get(b.id);
      if (aSlide && bSlide && aSlide.order !== bSlide.order) {
        return aSlide.order - bSlide.order;
      }
      if (Boolean(aSlide) !== Boolean(bSlide)) return aSlide ? -1 : 1;

      if (a.featured !== b.featured) return a.featured ? -1 : 1;

      const timeDiff =
        parseProductTimestampMs(b.createdAt) - parseProductTimestampMs(a.createdAt);
      if (timeDiff !== 0) return timeDiff;

      return a.name.localeCompare(b.name);
    })
    .slice(0, maxItems);

  return source.map((product, idx) => {
    const slide = activeSlidesByProduct.get(product.id);
    const firstColour = product.colourways[0];
    const imageUrl = resolveStudioProductImage(
      product.id,
      slide?.imageUrl || firstColour?.images?.[0] || '',
      studioPhotoMap
    );
    const num = String(idx + 1).padStart(2, '0');

    return {
      id: product.id,
      pieceNumber: `No. ${num}`,
      slug: product.slug,
      name: product.name,
      category: product.badges[0] || 'Hoodie',
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      colourName: slide?.colourName || firstColour?.name || 'Studio Wash',
      colourHex: slide?.bgColor || firstColour?.hex || '#18181B',
      imageUrl,
      fabric: product.fabric,
      description: product.description,
      sizes: product.sizes,
    };
  });
}
