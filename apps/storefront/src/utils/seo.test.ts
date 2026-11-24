import test from 'node:test';
import assert from 'node:assert/strict';
import type { Product } from '../data/types';
import {
  buildProductSeoMetadata,
  clampSeoText,
  formatSeoTitle,
  resolveAbsoluteImageUrl,
  resolveCanonicalUrl,
} from './seo';

function makeSampleProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'studio-obsidian-arch',
    name: 'Obsidian Arch Hoodie',
    slug: 'obsidian-arch-hoodie',
    sku: 'ZRV-01',
    description:
      'A heavyweight 500 gsm loopback cotton hoodie cut boxy with an architectural double-lined hood that holds its form from shoulder to crown.',
    fabric: '500 gsm organic cotton · Boxy drop-shoulder',
    price: 12500,
    badges: ['Limited Run'],
    collectionId: 'drop-01',
    colourways: [{ name: 'Obsidian Black', hex: '#18181B', images: ['/assets/obsidian.jpg'] }],
    sizes: [
      { label: 'M', stock: 8 },
      { label: 'L', stock: 4 },
    ],
    status: 'published',
    featured: true,
    seoTitle: '',
    seoDescription: '',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
    ...overrides,
  };
}

test('resolveCanonicalUrl normalizes duplicate routes and strips query strings', () => {
  assert.equal(
    resolveCanonicalUrl('https://zorvique.pk/', '/shop/obsidian-arch-hoodie?colour=black', '/product/obsidian-arch-hoodie'),
    'https://zorvique.pk/product/obsidian-arch-hoodie'
  );
  assert.equal(
    resolveCanonicalUrl('https://zorvique.pk', '/shop/?sort=price-asc'),
    'https://zorvique.pk/shop'
  );
  assert.equal(resolveCanonicalUrl('https://zorvique.pk', '/'), 'https://zorvique.pk/');
});

test('clampSeoText respects 160 character limit cleanly at word boundaries', () => {
  const longText =
    'Handcrafted heavyweight 500 gsm loopback French terry hoodie engineered in Lahore with double-lined architectural hood structure and pre-shrunk combed organic cotton fleece.';
  const clamped = clampSeoText(longText, 160);
  assert.ok(clamped.length <= 160);
  assert.ok(clamped.endsWith('…'));
  assert.equal(clampSeoText('Short note', 160), 'Short note');
});

test('formatSeoTitle appends brand once without duplicating', () => {
  assert.equal(formatSeoTitle('Obsidian Arch Hoodie', 'Zorvique', 'Fallback'), 'Obsidian Arch Hoodie — Zorvique');
  assert.equal(formatSeoTitle('Obsidian Arch Hoodie — Zorvique', 'Zorvique', 'Fallback'), 'Obsidian Arch Hoodie — Zorvique');
});

test('resolveAbsoluteImageUrl resolves root-relative assets and ignores data URIs', () => {
  assert.equal(
    resolveAbsoluteImageUrl('https://zorvique.pk', '/assets/rack_obsidian.jpg'),
    'https://zorvique.pk/assets/rack_obsidian.jpg'
  );
  assert.equal(
    resolveAbsoluteImageUrl('https://zorvique.pk', 'https://cdn.example.com/hoodie.webp'),
    'https://cdn.example.com/hoodie.webp'
  );
  assert.equal(resolveAbsoluteImageUrl('https://zorvique.pk', 'data:image/svg+xml;utf8,%3Csvg%3E'), '');
});

test('buildProductSeoMetadata generates dynamic title, clamped description, canonical URL, and Schema.org Product JSON-LD', () => {
  const product = makeSampleProduct();
  const meta = buildProductSeoMetadata({
    product,
    brandName: 'Zorvique',
    heroImage: '/assets/rack_obsidian.jpg',
    fallbackOgImage: 'https://cdn.example.com/default.jpg',
    siteOrigin: 'https://zorvique.pk',
    reviewCount: 4,
    averageRatingLabel: '4.8',
  });

  assert.equal(meta.title, 'Obsidian Arch Hoodie — Zorvique');
  assert.equal(meta.canonicalPath, '/product/obsidian-arch-hoodie');
  assert.equal(meta.canonicalUrl, 'https://zorvique.pk/product/obsidian-arch-hoodie');
  assert.equal(meta.imageUrl, 'https://zorvique.pk/assets/rack_obsidian.jpg');
  assert.ok(meta.description.length > 50 && meta.description.length <= 160);
  assert.equal(meta.availability, 'instock');

  const offers = meta.jsonLd.offers as Record<string, unknown>;
  assert.equal(offers.url, 'https://zorvique.pk/product/obsidian-arch-hoodie');
  assert.equal(offers.availability, 'https://schema.org/InStock');
  assert.equal(offers.price, 12500);
  const rating = meta.jsonLd.aggregateRating as Record<string, unknown>;
  assert.equal(rating.ratingValue, '4.8');
  assert.equal(rating.reviewCount, 4);
});

test('buildProductSeoMetadata respects custom Admin seoTitle and seoDescription and out-of-stock state', () => {
  const product = makeSampleProduct({
    seoTitle: 'Limited Crimson Edition',
    seoDescription: 'Custom SEO description crafted in Admin for winter drop shoppers.',
    sizes: [{ label: 'M', stock: 0 }],
  });

  const meta = buildProductSeoMetadata({
    product,
    brandName: 'Zorvique',
    siteOrigin: 'https://zorvique.pk',
  });

  assert.equal(meta.title, 'Limited Crimson Edition — Zorvique');
  assert.equal(meta.description, 'Custom SEO description crafted in Admin for winter drop shoppers.');
  assert.equal(meta.availability, 'outofstock');
});
