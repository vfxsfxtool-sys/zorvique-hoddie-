import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPKR,
  validatePakistanPhone,
  validateDiscountEligibility,
  calculateShipping,
  computeOrderTotals,
  filterAndSortProducts,
  normalizeProductSort,
  parseProductTimestampMs,
  searchCatalog,
} from './commerce';
import type { DiscountCode, Product, ShippingConfig } from '../data/types';

test('formatPKR formats currency with PKR prefix and thousand separators', () => {
  assert.equal(formatPKR(12500), 'PKR 12,500');
  assert.equal(formatPKR(0), 'PKR 0');
});

test('validatePakistanPhone validates and normalizes +92 mobile formats', () => {
  assert.deepEqual(validatePakistanPhone('+92 300 1234567'), { valid: true, normalized: '+923001234567' });
  assert.deepEqual(validatePakistanPhone('0321-9876543'), { valid: true, normalized: '+923219876543' });
  assert.equal(validatePakistanPhone('12345').valid, false);
  assert.equal(validatePakistanPhone('+14155551234').valid, false);
});

test('validateDiscountEligibility checks active, usageLimit, and expiry', () => {
  const now = new Date('2026-11-17T12:00:00Z');
  const active: DiscountCode = { code: 'ZRV10', percent: 10, usageLimit: 10, usedCount: 2, expiresAt: '2026-12-31T00:00:00Z', active: true };
  assert.equal(validateDiscountEligibility(active, now).valid, true);
  assert.equal(validateDiscountEligibility({ ...active, active: false }, now).valid, false);
  assert.equal(validateDiscountEligibility({ ...active, usedCount: 10 }, now).valid, false);
  assert.equal(validateDiscountEligibility({ ...active, expiresAt: '2026-01-01T00:00:00Z' }, now).valid, false);
});

test('computeOrderTotals computes subtotal, discount, freeThreshold shipping, and grand total', () => {
  const shippingCfg: ShippingConfig = {
    flatByCity: { Lahore: 200, Karachi: 350, Other: 400 },
    freeThreshold: 12000,
  };
  const discount: DiscountCode = { code: 'SAVE10', percent: 10, usageLimit: 100, usedCount: 0, expiresAt: null, active: true };

  assert.equal(calculateShipping(8000, 'Karachi', shippingCfg), 350);
  assert.equal(calculateShipping(12500, 'Karachi', shippingCfg), 0);

  const totals = computeOrderTotals([{ price: 10000, qty: 1 }], 'Lahore', shippingCfg, discount);
  assert.deepEqual(totals, { subtotal: 10000, shipping: 200, discountAmount: 1000, total: 9200 });
});

test('filterAndSortProducts excludes drafts and applies colour, size, and price sort', () => {
  const products: Product[] = [
    {
      id: '1', name: 'Amber Frost', slug: 'amber-frost', sku: 'Z1', description: 'Heavy', fabric: '450 GSM',
      price: 12500, compareAtPrice: null, badges: [], collectionId: 'c1',
      colourways: [{ name: 'Sunset Amber', hex: '#FF7A00', images: [] }],
      sizes: [{ label: 'M', stock: 5 }], status: 'published', featured: true, seoTitle: '', seoDescription: '',
    },
    {
      id: '2', name: 'Draft Hoodie', slug: 'draft', sku: 'Z2', description: 'Draft', fabric: '450 GSM',
      price: 9000, compareAtPrice: null, badges: [], collectionId: 'c1',
      colourways: [{ name: 'Obsidian', hex: '#111', images: [] }],
      sizes: [{ label: 'M', stock: 5 }], status: 'draft', featured: false, seoTitle: '', seoDescription: '',
    },
    {
      id: '3', name: 'Pine Oversized', slug: 'pine', sku: 'Z3', description: 'Warm', fabric: '500 GSM',
      price: 11000, compareAtPrice: null, badges: [], collectionId: 'c2',
      colourways: [{ name: 'Pine', hex: '#1C4E38', images: [] }],
      sizes: [{ label: 'L', stock: 0 }], status: 'published', featured: false, seoTitle: '', seoDescription: '',
    },
  ];

  const collections = [
    { id: 'c1', name: 'Winter Capsule', slug: 'winter-capsule' },
    { id: 'c2', name: 'Atelier Essentials', slug: 'atelier-essentials' },
  ];

  assert.equal(filterAndSortProducts(products, {}).length, 2);
  assert.equal(filterAndSortProducts(products, { size: 'L' }).length, 0);
  assert.equal(filterAndSortProducts(products, { sort: 'price-asc' })[0].id, '3');
  assert.equal(filterAndSortProducts(products, { sort: 'price-desc' })[0].id, '1');
  assert.equal(filterAndSortProducts(products, { search: 'Winter Capsule' }, collections)[0].id, '1');
});

test('filterAndSortProducts newest arrival orders ISO strings and Firestore timestamps descending', () => {
  const products: Product[] = [
    {
      id: 'older', name: 'Older Piece', slug: 'older', sku: 'Z1', description: '', fabric: '',
      price: 12000, compareAtPrice: null, badges: [], collectionId: 'c1', colourways: [],
      sizes: [{ label: 'M', stock: 5 }], status: 'published', featured: true, seoTitle: '', seoDescription: '',
      createdAt: '2026-11-01T00:00:00Z',
    },
    {
      id: 'middle', name: 'Middle Piece', slug: 'middle', sku: 'Z2', description: '', fabric: '',
      price: 13000, compareAtPrice: null, badges: [], collectionId: 'c1', colourways: [],
      sizes: [{ label: 'M', stock: 5 }], status: 'published', featured: false, seoTitle: '', seoDescription: '',
      createdAt: { seconds: Math.floor(Date.parse('2026-11-04T00:00:00Z') / 1000) },
    },
    {
      id: 'newest', name: 'Newest Piece', slug: 'newest', sku: 'Z3', description: '', fabric: '',
      price: 14000, compareAtPrice: null, badges: [], collectionId: 'c1', colourways: [],
      sizes: [{ label: 'M', stock: 5 }], status: 'published', featured: false, seoTitle: '', seoDescription: '',
      createdAt: { toMillis: () => Date.parse('2026-11-06T00:00:00Z') },
    },
  ];

  const sorted = filterAndSortProducts(products, { sort: 'newest' });
  assert.deepEqual(sorted.map((p) => p.id), ['newest', 'middle', 'older']);
  assert.equal(normalizeProductSort('price-desc'), 'price-desc');
  assert.equal(normalizeProductSort('invalid'), 'featured');
  assert.equal(parseProductTimestampMs('2026-11-06T00:00:00Z'), Date.parse('2026-11-06T00:00:00Z'));
});

test('searchCatalog finds published products by product name or collection name without leaking drafts', () => {
  const products: Product[] = [
    {
      id: 'p1', name: 'Obsidian Arch Hoodie', slug: 'obsidian-arch', sku: 'Z1', description: 'Heavy', fabric: '500 GSM',
      price: 12500, compareAtPrice: null, badges: [], collectionId: 'col-winter',
      colourways: [{ name: 'Obsidian Black', hex: '#111', images: [] }],
      sizes: [{ label: 'M', stock: 5 }], status: 'published', featured: true, seoTitle: '', seoDescription: '',
    },
    {
      id: 'p2', name: 'Hidden Winter Sample', slug: 'hidden-winter', sku: 'Z2', description: 'Draft', fabric: '500 GSM',
      price: 11000, compareAtPrice: null, badges: [], collectionId: 'col-winter',
      colourways: [], sizes: [{ label: 'M', stock: 2 }], status: 'draft', featured: false, seoTitle: '', seoDescription: '',
    },
  ];
  const collections = [{ id: 'col-winter', name: 'Winter Atelier', slug: 'winter-atelier', visible: true }];

  const byProduct = searchCatalog(products, collections, 'obsidian');
  assert.equal(byProduct.products.length, 1);
  assert.equal(byProduct.products[0].product.id, 'p1');
  assert.equal(byProduct.products[0].collectionName, 'Winter Atelier');

  const byCollection = searchCatalog(products, collections, 'Winter');
  assert.equal(byCollection.collections.length, 1);
  assert.equal(byCollection.collections[0].name, 'Winter Atelier');
  assert.equal(byCollection.products.length, 1);
  assert.equal(byCollection.products[0].product.id, 'p1');
});
