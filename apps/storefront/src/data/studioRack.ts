import type { HeroSlide, Product } from './types';
import {
  normalizeProductImages,
  resolveStudioProductImage as resolveRackImageWithMap,
  selectAndBuildRackItems,
  type RackPiece,
} from '../utils/rack';

export type { RackPiece };

export const STUDIO_PHOTO_MAP: Record<string, string> = {
  'studio-obsidian-arch': '/assets/rack/rack_obsidian.jpg',
  'studio-burnt-amber': '/assets/rack/rack_amber.jpg',
  'studio-crimson-varsity': '/assets/rack/rack_crimson.jpg',
  'studio-chalk-ivory': '/assets/rack/rack_ivory.jpg',
  'studio-acid-charcoal': '/assets/rack/rack_charcoal.jpg',
  'studio-espresso-heavy': '/assets/rack/rack_espresso.jpg',
};

export function resolveStudioProductImage(productId: string, rawUrl?: string | null): string {
  return resolveRackImageWithMap(productId, rawUrl, STUDIO_PHOTO_MAP);
}

export function normalizeStudioProduct(product: Product): Product {
  return normalizeProductImages(product, STUDIO_PHOTO_MAP);
}

export function buildRackItems(
  publishedProducts: Product[],
  heroSlides: HeroSlide[] = []
): RackPiece[] {
  return selectAndBuildRackItems(publishedProducts, heroSlides, STUDIO_PHOTO_MAP, 12);
}
