import test from 'node:test';
import assert from 'node:assert/strict';
import type { HeroSlide, Product } from '../data/types';
import {
  normalizeProductImages,
  resolveStudioProductImage,
  selectAndBuildRackItems,
} from './rack';

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: 'prod-1',
    name: 'Test Hoodie',
    slug: 'test-hoodie',
    sku: 'ZRV-T1',
    description: 'Heavyweight fleece.',
    fabric: '500 gsm cotton',
    price: 12000,
    badges: ['Limited Run'],
    collectionId: 'drop-01',
    colourways: [{ name: 'Obsidian', hex: '#18181B', images: ['https://cdn.example.com/a.jpg'] }],
    sizes: [{ label: 'M', stock: 5 }],
    status: 'published',
    featured: false,
    seoTitle: '',
    seoDescription: '',
    createdAt: '2026-11-10T00:00:00Z',
    updatedAt: '2026-11-10T00:00:00Z',
    ...overrides,
  };
}

const PHOTO_MAP: Record<string, string> = {
  'studio-obsidian-arch': '/assets/rack/rack_obsidian.jpg',
  'studio-burnt-amber': '/assets/rack/rack_amber.jpg',
};

test('resolveStudioProductImage replaces SVG placeholder or empty URL for known studio products while preserving real uploaded URLs', () => {
  assert.equal(
    resolveStudioProductImage('studio-obsidian-arch', 'data:image/svg+xml;utf8,%3Csvg%3E', PHOTO_MAP),
    '/assets/rack/rack_obsidian.jpg'
  );
  assert.equal(
    resolveStudioProductImage('studio-obsidian-arch', '', PHOTO_MAP),
    '/assets/rack/rack_obsidian.jpg'
  );
  assert.equal(
    resolveStudioProductImage('studio-obsidian-arch', 'https://cdn.example.com/custom.webp', PHOTO_MAP),
    'https://cdn.example.com/custom.webp'
  );
  assert.equal(
    resolveStudioProductImage('custom-product', 'data:image/svg+xml;utf8,%3Csvg%3E', PHOTO_MAP),
    'data:image/svg+xml;utf8,%3Csvg%3E'
  );
});

test('normalizeProductImages upgrades colourway SVG placeholder to studio photo only when needed', () => {
  const studioSvg = makeProduct({
    id: 'studio-burnt-amber',
    colourways: [{ name: 'Amber', hex: '#B45309', images: ['data:image/svg+xml;utf8,abc'] }],
  });
  const normalized = normalizeProductImages(studioSvg, PHOTO_MAP);
  assert.equal(normalized.colourways[0].images[0], '/assets/rack/rack_amber.jpg');

  const uploaded = makeProduct({
    id: 'studio-burnt-amber',
    colourways: [{ name: 'Amber', hex: '#B45309', images: ['https://example.com/real.jpg'] }],
  });
  assert.equal(normalizeProductImages(uploaded, PHOTO_MAP), uploaded);
});

test('selectAndBuildRackItems filters showOnRack=false, sorts by rackOrder ascending, and supports up to 12 items', () => {
  const products: Product[] = [
    makeProduct({ id: 'p-hidden', name: 'Hidden Hoodie', showOnRack: false, rackOrder: 0 }),
    makeProduct({ id: 'p-3', name: 'Third Piece', showOnRack: true, rackOrder: 2 }),
    makeProduct({ id: 'p-1', name: 'First Piece', showOnRack: true, rackOrder: 0 }),
    makeProduct({ id: 'p-2', name: 'Second Piece', showOnRack: true, rackOrder: 1 }),
  ];

  const rack = selectAndBuildRackItems(products, [], PHOTO_MAP, 12);
  assert.deepEqual(
    rack.map((r) => [r.pieceNumber, r.id]),
    [
      ['No. 01', 'p-1'],
      ['No. 02', 'p-2'],
      ['No. 03', 'p-3'],
    ]
  );
});

test('selectAndBuildRackItems keeps up to 12 items, falls back to heroSlide order, and returns empty array when Firestore catalog is empty', () => {
  const many = Array.from({ length: 14 }, (_, i) =>
    makeProduct({
      id: `item-${i + 1}`,
      name: `Item ${i + 1}`,
      rackOrder: i,
    })
  );
  const rack = selectAndBuildRackItems(many, [], PHOTO_MAP, 12);
  assert.equal(rack.length, 12);
  assert.equal(rack[11].pieceNumber, 'No. 12');

  const slides: HeroSlide[] = [
    {
      id: 's1',
      order: 0,
      productId: 'p-b',
      colourName: 'Crimson',
      bgColor: '#9E0B14',
      headline: '',
      body: '',
      ctaLabel: '',
      ctaLink: '',
      imageUrl: 'https://cdn.example.com/b.jpg',
      active: true,
    },
  ];
  const unordered = [
    makeProduct({ id: 'p-a', name: 'Alpha', featured: true }),
    makeProduct({ id: 'p-b', name: 'Beta', featured: false }),
  ];
  const bySlide = selectAndBuildRackItems(unordered, slides, PHOTO_MAP, 12);
  assert.equal(bySlide[0].id, 'p-b');
  assert.equal(bySlide[0].colourName, 'Crimson');

  assert.deepEqual(selectAndBuildRackItems([], [], PHOTO_MAP, 12), []);
});
