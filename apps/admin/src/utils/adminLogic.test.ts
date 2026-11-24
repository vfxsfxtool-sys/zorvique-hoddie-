import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFirebaseAuthProvidersUrl,
  buildFirebaseAuthUsersUrl,
  buildFirebaseStorageConsoleUrl,
  computeOverviewMetrics,
  deriveCustomerDirectory,
  ensureUniqueSlug,
  formatWhatsAppOutreachUrl,
  isOwnerEmail,
  mapAdminAuthError,
  mapStorageUploadError,
  ordersToCsv,
  planOrderConfirmationStock,
  recomputeOrderComparison,
  resolveAdminRole,
  resolveStorefrontUrl,
  sortAdminRackProducts,
  validateNewMemberEmail,
} from './adminLogic';
import type { Order, Product, Subscriber } from '../data/types';

test('isOwnerEmail authorizes both verified owner emails case-insensitively', () => {
  assert.equal(isOwnerEmail('lessuse611@gmail.com'), true);
  assert.equal(isOwnerEmail('uselesss611@gmail.com'), true);
  assert.equal(isOwnerEmail('USELESSS611@gmail.com'), true);
  assert.equal(isOwnerEmail('random@example.com'), false);
  assert.equal(isOwnerEmail(null), false);
});

test('resolveAdminRole classifies owner vs member and blocks unauthorized emails', () => {
  assert.equal(resolveAdminRole('lessuse611@gmail.com', null), 'owner');
  assert.equal(resolveAdminRole('lessuse611@gmail.com', 'owner'), 'owner');
  assert.equal(resolveAdminRole('staff@zorvique.pk', 'member'), 'member');
  assert.equal(resolveAdminRole('staff@zorvique.pk', 'admin'), 'member');
  assert.equal(resolveAdminRole('stranger@gmail.com', null), null);
  assert.equal(resolveAdminRole('stranger@gmail.com', undefined), null);
});

test('validateNewMemberEmail accepts valid non-owner teammate emails and blocks owner/invalid emails', () => {
  assert.deepEqual(validateNewMemberEmail('  Staff@Zorvique.PK '), {
    ok: true,
    email: 'staff@zorvique.pk',
  });
  assert.equal(validateNewMemberEmail('lessuse611@gmail.com').ok, false);
  assert.equal(validateNewMemberEmail('not-an-email').ok, false);
  assert.equal(
    buildFirebaseAuthUsersUrl('zorvique-hoddies'),
    'https://console.firebase.google.com/project/zorvique-hoddies/authentication/users'
  );
});

test('mapAdminAuthError maps operation-not-allowed to actionable console link without Google references', () => {
  const url = buildFirebaseAuthProvidersUrl('gen-lang-client-0110024230');
  assert.equal(
    url,
    'https://console.firebase.google.com/project/gen-lang-client-0110024230/authentication/providers'
  );
  const info = mapAdminAuthError({ code: 'auth/operation-not-allowed' }, 'gen-lang-client-0110024230');
  assert.equal(info.needsConsoleEmailProvider, true);
  assert.equal(info.consoleUrl, url);
  assert.equal(/google sign-in|continue with google/i.test(info.message), false);

  const credInfo = mapAdminAuthError({ code: 'auth/invalid-credential' }, 'gen-lang-client-0110024230');
  assert.equal(credInfo.needsConsoleEmailProvider, false);
  assert.equal(/google/i.test(credInfo.message), false);
});

test('resolveStorefrontUrl routes cleanly across proxy (:3000) and standalone admin dev (:3001)', () => {
  assert.equal(resolveStorefrontUrl({ protocol: 'http:', hostname: 'localhost', port: '3001' }), 'http://localhost:3000/');
  assert.equal(resolveStorefrontUrl({ protocol: 'http:', hostname: 'localhost', port: '3000' }), '/');
  assert.equal(resolveStorefrontUrl({ protocol: 'https:', hostname: 'zorvique.pk', port: '' }), '/');
  assert.equal(resolveStorefrontUrl(null), '/');
});

test('mapStorageUploadError guides user to Firebase Console Storage activation when bucket is missing or unauthorized', () => {
  assert.equal(
    buildFirebaseStorageConsoleUrl('zorvique-hoddies'),
    'https://console.firebase.google.com/project/zorvique-hoddies/storage'
  );
  const notFound = mapStorageUploadError({ code: 'storage/unknown', message: '404 Not Found' }, 'zorvique-hoddies');
  assert.equal(notFound.needsStorageActivation, true);
  assert.ok(notFound.consoleUrl?.includes('zorvique-hoddies/storage'));

  const unauth = mapStorageUploadError({ code: 'storage/unauthorized', message: 'User does not have permission' }, 'zorvique-hoddies');
  assert.equal(unauth.needsStorageActivation, true);
});

test('sortAdminRackProducts excludes draft/hidden products and orders by explicit rackOrder then featured', () => {
  const makeProd = (id: string, overrides: Partial<Product>): Product => ({
    id,
    name: id,
    slug: id,
    sku: id,
    description: '',
    fabric: '',
    price: 12000,
    badges: [],
    collectionId: 'drop-01',
    colourways: [],
    sizes: [{ label: 'M', stock: 5 }],
    status: 'published',
    featured: false,
    seoTitle: '',
    seoDescription: '',
    ...overrides,
  });

  const sorted = sortAdminRackProducts([
    makeProd('p-draft', { status: 'draft', rackOrder: 0 }),
    makeProd('p-hidden', { status: 'published', showOnRack: false, rackOrder: 0 }),
    makeProd('p-second', { rackOrder: 2 }),
    makeProd('p-first', { rackOrder: 1 }),
    makeProd('p-featured', { featured: true }),
  ]);

  assert.deepEqual(
    sorted.map((p) => p.id),
    ['p-first', 'p-second', 'p-featured']
  );
});

test('ensureUniqueSlug generates unique slugs without collisions', () => {
  assert.equal(ensureUniqueSlug('Amber Frost Oversized', []), 'amber-frost-oversized');
  assert.equal(
    ensureUniqueSlug('Amber Frost Oversized', ['amber-frost-oversized', 'amber-frost-oversized-2']),
    'amber-frost-oversized-3'
  );
});

test('planOrderConfirmationStock deducts stock, rejects insufficient inventory, and skips unseeded items gracefully', () => {
  const products = new Map<string, Product>([
    [
      'p1',
      {
        id: 'p1',
        name: 'Amber Frost',
        slug: 'amber-frost',
        sku: 'Z-1',
        description: '',
        fabric: '450 GSM',
        price: 12500,
        badges: [],
        collectionId: 'c1',
        colourways: [],
        sizes: [
          { label: 'S', stock: 2 },
          { label: 'M', stock: 5 },
        ],
        status: 'published',
        featured: true,
        seoTitle: '',
        seoDescription: '',
      },
    ],
  ]);

  const okOrder: Order = {
    id: 'o1',
    orderNo: 'ZRV-1001',
    customer: { name: 'A', email: 'a@b.com', phone: '+923001234567', city: 'Lahore', address: 'DHA', postalCode: '' },
    items: [{ productId: 'p1', name: 'Amber Frost', size: 'M', colour: 'Amber', price: 12500, qty: 2 }],
    subtotal: 25000,
    shipping: 0,
    discount: 0,
    total: 25000,
    paymentMethod: 'cod',
    transactionId: '',
    paymentStatus: 'pending',
    status: 'new',
    courier: '',
    trackingNo: '',
  };

  const resOk = planOrderConfirmationStock(okOrder, products);
  assert.equal(resOk.ok, true);
  if (resOk.ok) {
    const mStock = resOk.updatedSizesByProductId.get('p1')?.find((s) => s.label === 'M')?.stock;
    assert.equal(mStock, 3);
  }

  const starterOrder: Order = {
    ...okOrder,
    items: [{ productId: 'studio-obsidian-arch', name: 'Obsidian Arch Hoodie', size: 'M', colour: 'Obsidian', price: 12500, qty: 1 }],
  };
  const resStarter = planOrderConfirmationStock(starterOrder, products);
  assert.equal(resStarter.ok, true);
  if (resStarter.ok) {
    assert.deepEqual(resStarter.skippedItems, ['Obsidian Arch Hoodie']);
  }

  const badOrder: Order = {
    ...okOrder,
    items: [{ productId: 'p1', name: 'Amber Frost', size: 'S', colour: 'Amber', price: 12500, qty: 3 }],
  };
  const resFail = planOrderConfirmationStock(badOrder, products);
  assert.equal(resFail.ok, false);
});

test('recomputeOrderComparison flags price mismatch against live product catalog', () => {
  const products: Product[] = [
    {
      id: 'p1',
      name: 'Amber Frost',
      slug: 'amber-frost',
      sku: 'Z-1',
      description: '',
      fabric: '450 GSM',
      price: 14000,
      badges: [],
      collectionId: 'c1',
      colourways: [],
      sizes: [{ label: 'M', stock: 5 }],
      status: 'published',
      featured: true,
      seoTitle: '',
      seoDescription: '',
    },
  ];
  const order: Order = {
    id: 'o1',
    orderNo: 'ZRV-1001',
    customer: { name: 'A', email: 'a@b.com', phone: '+923001234567', city: 'Lahore', address: 'DHA', postalCode: '' },
    items: [{ productId: 'p1', name: 'Amber Frost', size: 'M', colour: 'Amber', price: 12500, qty: 1 }],
    subtotal: 12500,
    shipping: 0,
    discount: 0,
    total: 12500,
    paymentMethod: 'cod',
    transactionId: '',
    paymentStatus: 'pending',
    status: 'new',
    courier: '',
    trackingNo: '',
  };
  const check = recomputeOrderComparison(order, products);
  assert.equal(check.hasMismatch, true);
  assert.equal(check.currentSubtotal, 14000);
});

test('computeOverviewMetrics computes revenue, active orders, low-stock count, and CSV export', () => {
  const now = Date.UTC(2026, 10, 17, 12, 0, 0);
  const orders: Order[] = [
    {
      id: 'o1',
      orderNo: 'ZRV-1001',
      customer: { name: 'Hira', email: 'h@b.com', phone: '+923001234567', city: 'Lahore', address: 'DHA', postalCode: '' },
      items: [{ productId: 'p1', name: 'Amber', size: 'M', colour: 'Amber', price: 12500, qty: 1 }],
      subtotal: 12500,
      shipping: 0,
      discount: 0,
      total: 12500,
      paymentMethod: 'cod',
      transactionId: '',
      paymentStatus: 'pending',
      status: 'confirmed',
      courier: 'TCS',
      trackingNo: '123',
      createdAt: now,
    },
    {
      id: 'o2',
      orderNo: 'ZRV-1002',
      customer: { name: 'Zara', email: 'z@b.com', phone: '+923001234567', city: 'Karachi', address: 'Clifton', postalCode: '' },
      items: [{ productId: 'p1', name: 'Amber', size: 'S', colour: 'Amber', price: 12500, qty: 1 }],
      subtotal: 12500,
      shipping: 0,
      discount: 0,
      total: 12500,
      paymentMethod: 'cod',
      transactionId: '',
      paymentStatus: 'pending',
      status: 'cancelled',
      courier: '',
      trackingNo: '',
      createdAt: now,
    },
  ];
  const products: Product[] = [
    {
      id: 'p1',
      name: 'Amber',
      slug: 'amber',
      sku: 'Z-1',
      description: '',
      fabric: '',
      price: 12500,
      badges: [],
      collectionId: 'c1',
      colourways: [],
      sizes: [
        { label: 'S', stock: 3 },
        { label: 'M', stock: 10 },
      ],
      status: 'published',
      featured: true,
      seoTitle: '',
      seoDescription: '',
    },
  ];

  const metrics = computeOverviewMetrics(orders, products, 7, now);
  assert.equal(metrics.totalRevenue, 12500);
  assert.equal(metrics.activeOrdersCount, 1);
  assert.equal(metrics.lowStockCount, 1);
  assert.equal(metrics.totalUnits, 13);
  assert.equal(metrics.chartData.length, 7);
  assert.ok(ordersToCsv(orders).includes('ZRV-1001'));
});

test('deriveCustomerDirectory and formatWhatsAppOutreachUrl aggregate buyers, subscribers, and normalized links', () => {
  const orders: Order[] = [
    {
      id: 'o1',
      orderNo: 'ZRV-1001',
      customer: { name: 'Ayesha', email: 'ayesha@gmail.com', phone: '03001234567', city: 'Lahore', address: 'DHA', postalCode: '' },
      items: [{ productId: 'p1', name: 'Amber', size: 'M', colour: 'Amber', price: 12500, qty: 1 }],
      subtotal: 12500,
      shipping: 0,
      discount: 0,
      total: 12500,
      paymentMethod: 'cod',
      transactionId: '',
      paymentStatus: 'pending',
      status: 'confirmed',
      courier: '',
      trackingNo: '',
      createdAt: 1000,
    },
  ];
  const subs: Subscriber[] = [
    { id: 's1', email: 'ayesha@gmail.com', createdAt: 1000 },
    { id: 's2', email: 'sana@gmail.com', createdAt: 2000 },
  ];
  const customers = deriveCustomerDirectory(orders, subs);
  assert.equal(customers.length, 2);
  assert.equal(customers[0].email, 'ayesha@gmail.com');
  assert.equal(customers[0].subscribed, true);
  assert.equal(customers[0].totalSpent, 12500);
  assert.equal(
    formatWhatsAppOutreachUrl('03001234567', 'Hi Ayesha'),
    'https://wa.me/923001234567?text=Hi%20Ayesha'
  );
});
