import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Payload-First Security TDD (Phase 0)
 * Verifies the Dirty Dozen security invariants against the Zorvique Firestore schema rules.
 */

const VALID_ID_RE = /^[a-zA-Z0-9_-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function simulateNewOrderRule(id: string, data: Record<string, unknown>, serverNowMs: number): boolean {
  if (!VALID_ID_RE.test(id) || id.length > 128) return false;
  const required = ['orderNo', 'customer', 'items', 'subtotal', 'shipping', 'discount', 'total', 'paymentMethod', 'transactionId', 'paymentStatus', 'status', 'courier', 'trackingNo', 'createdAt'];
  const allowed = new Set([...required, 'discountCode']);
  for (const key of required) {
    if (!(key in data)) return false;
  }
  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) return false;
  }
  if (data.status !== 'new') return false;
  if (!['pending', 'verification'].includes(String(data.paymentStatus))) return false;
  if (data.courier !== '' || data.trackingNo !== '') return false;
  if (data.createdAt !== serverNowMs) return false;
  const items = data.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > 30) return false;
  return true;
}

function simulateSubscriberRule(id: string, data: Record<string, unknown>, serverNowMs: number): boolean {
  if (!VALID_ID_RE.test(id) || id.length > 128) return false;
  const keys = Object.keys(data);
  if (keys.length !== 2 || !keys.includes('email') || !keys.includes('createdAt')) return false;
  if (typeof data.email !== 'string' || data.email.length < 3 || data.email.length > 254 || !EMAIL_RE.test(data.email)) return false;
  if (data.createdAt !== serverNowMs) return false;
  return true;
}

function simulateProductReadRule(status: string, auth: { email?: string; email_verified?: boolean; isAdminDoc?: boolean } | null): boolean {
  if (status === 'published') return true;
  if (!auth || !auth.email_verified) return false;
  return auth.email === 'lessuse611@gmail.com' || auth.email === 'uselesss611@gmail.com' || Boolean(auth.isAdminDoc);
}

test('Dirty Dozen: rejects draft product read by unauthenticated user or unverified spoof', () => {
  assert.equal(simulateProductReadRule('draft', null), false);
  assert.equal(simulateProductReadRule('draft', { email: 'lessuse611@gmail.com', email_verified: false }), false);
  assert.equal(simulateProductReadRule('draft', { email: 'uselesss611@gmail.com', email_verified: false }), false);
  assert.equal(simulateProductReadRule('draft', { email: 'lessuse611@gmail.com', email_verified: true }), true);
  assert.equal(simulateProductReadRule('draft', { email: 'uselesss611@gmail.com', email_verified: true }), true);
  assert.equal(simulateProductReadRule('published', null), true);
});

test('Dirty Dozen: rejects order status spoofing, shadow fields, forged timestamps, and bad IDs', () => {
  const now = 1700000000000;
  const validBase = {
    orderNo: 'ZRV-1001',
    customer: { name: 'Ayesha', email: 'a@test.pk', phone: '+923001234567', city: 'Lahore', address: 'DHA Phase 5', postalCode: '54000' },
    items: [{ productId: 'p1', name: 'Hoodie', size: 'M', colour: 'Amber', price: 12500, qty: 1 }],
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
    createdAt: now,
  };

  assert.equal(simulateNewOrderRule('ord_1001', validBase, now), true);
  assert.equal(simulateNewOrderRule('ord_1001', { ...validBase, status: 'confirmed' }, now), false);
  assert.equal(simulateNewOrderRule('ord_1001', { ...validBase, paymentStatus: 'paid' }, now), false);
  assert.equal(simulateNewOrderRule('ord_1001', { ...validBase, isVerified: true }, now), false);
  assert.equal(simulateNewOrderRule('ord_1001', { ...validBase, createdAt: now - 5000 }, now), false);
  assert.equal(simulateNewOrderRule('bad$id', validBase, now), false);
});

test('Dirty Dozen: rejects subscriber shadow fields and oversized emails', () => {
  const now = 1700000000000;
  assert.equal(simulateSubscriberRule('sub_1', { email: 'sana@lahore.pk', createdAt: now }, now), true);
  assert.equal(simulateSubscriberRule('sub_1', { email: 'sana@lahore.pk', role: 'admin', createdAt: now }, now), false);
  assert.equal(simulateSubscriberRule('sub_1', { email: `${'a'.repeat(300)}@test.com`, createdAt: now }, now), false);
});

function simulateOrderTrackingCreateRule(
  trackingId: string,
  data: Record<string, unknown>,
  serverNowMs: number,
  parentOrderExistsAfter: boolean,
  parentOrderNoAfter?: string
): boolean {
  if (!VALID_ID_RE.test(trackingId) || trackingId.length > 128) return false;
  const required = ['orderNo', 'orderId', 'city', 'itemCount', 'itemSummary', 'total', 'paymentMethod', 'paymentStatus', 'status', 'courier', 'trackingNo', 'createdAt', 'updatedAt'];
  const allowed = new Set(required);
  for (const k of required) {
    if (!(k in data)) return false;
  }
  for (const k of Object.keys(data)) {
    if (!allowed.has(k)) return false;
  }
  if (data.orderNo !== trackingId) return false;
  if (data.status !== 'new') return false;
  if (!['pending', 'verification'].includes(String(data.paymentStatus))) return false;
  if (data.courier !== '' || data.trackingNo !== '') return false;
  if (data.createdAt !== serverNowMs || data.updatedAt !== serverNowMs) return false;
  if (!parentOrderExistsAfter || parentOrderNoAfter !== trackingId) return false;
  return true;
}

test('Dirty Dozen: orderTracking enforces PII isolation, no status spoofing, and atomic order pairing', () => {
  const now = 1700000000000;
  const validTracking = {
    orderNo: 'ZRV-1001',
    orderId: 'ord_1001',
    city: 'Lahore',
    itemCount: 1,
    itemSummary: [{ name: 'Obsidian Arch Hoodie', size: 'M', colour: 'Obsidian Black', qty: 1 }],
    total: 12500,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'new',
    courier: '',
    trackingNo: '',
    createdAt: now,
    updatedAt: now,
  };

  assert.equal(simulateOrderTrackingCreateRule('ZRV-1001', validTracking, now, true, 'ZRV-1001'), true);
  assert.equal(simulateOrderTrackingCreateRule('ZRV-1001', { ...validTracking, email: 'leak@test.com' }, now, true, 'ZRV-1001'), false);
  assert.equal(simulateOrderTrackingCreateRule('ZRV-1001', { ...validTracking, status: 'delivered' }, now, true, 'ZRV-1001'), false);
  assert.equal(simulateOrderTrackingCreateRule('ZRV-1001', validTracking, now, false, undefined), false);
  assert.equal(simulateOrderTrackingCreateRule('ZRV-9999', validTracking, now, true, 'ZRV-9999'), false);
});

function simulateProductReviewCreateRule(
  reviewId: string,
  data: Record<string, unknown>,
  auth: { uid: string; email_verified: boolean } | null,
  serverNowMs: number,
  productStatusInDb?: 'published' | 'draft' | null
): boolean {
  if (!auth || !auth.email_verified) return false;
  if (!VALID_ID_RE.test(reviewId) || reviewId.length > 128) return false;
  const required = ['productId', 'productSlug', 'authorUid', 'authorName', 'city', 'rating', 'title', 'comment', 'fitFeedback', 'createdAt', 'updatedAt'];
  const allowed = new Set(required);
  for (const k of required) {
    if (!(k in data)) return false;
  }
  for (const k of Object.keys(data)) {
    if (!allowed.has(k)) return false;
  }
  if (typeof data.productId !== 'string' || !VALID_ID_RE.test(data.productId)) return false;
  if (reviewId !== `${data.productId}_${auth.uid}`) return false;
  if (data.authorUid !== auth.uid) return false;
  if (typeof data.authorName !== 'string' || data.authorName.length < 1 || data.authorName.length > 80) return false;
  if (typeof data.city !== 'string' || data.city.length > 80) return false;
  if (typeof data.rating !== 'number' || !Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) return false;
  if (typeof data.title !== 'string' || data.title.length < 1 || data.title.length > 120) return false;
  if (typeof data.comment !== 'string' || data.comment.length < 10 || data.comment.length > 1500) return false;
  if (!['', 'runs-small', 'true-to-size', 'oversized-drape'].includes(String(data.fitFeedback))) return false;
  if (data.createdAt !== serverNowMs || data.updatedAt !== serverNowMs) return false;
  if (productStatusInDb === 'draft') return false;
  return true;
}

test('Dirty Dozen: productReviews enforces verified auth, authorUid match, integer rating 1..5, and no shadow/PII fields', () => {
  const now = 1700000000000;
  const auth = { uid: 'user123', email_verified: true };
  const validReview = {
    productId: 'obsidian-arch-hoodie',
    productSlug: 'obsidian-arch-hoodie',
    authorUid: 'user123',
    authorName: 'Hira K.',
    city: 'Lahore',
    rating: 5,
    title: 'Heavy drape worth every rupee',
    comment: 'The 500 gsm fleece holds its boxy structure cleanly after wash.',
    fitFeedback: 'true-to-size',
    createdAt: now,
    updatedAt: now,
  };

  assert.equal(simulateProductReviewCreateRule('obsidian-arch-hoodie_user123', validReview, auth, now, 'published'), true);
  assert.equal(simulateProductReviewCreateRule('obsidian-arch-hoodie_user123', validReview, auth, now, null), true);
  assert.equal(simulateProductReviewCreateRule('obsidian-arch-hoodie_user123', validReview, auth, now, 'draft'), false);
  assert.equal(simulateProductReviewCreateRule('obsidian-arch-hoodie_user123', validReview, null, now, 'published'), false);
  assert.equal(simulateProductReviewCreateRule('obsidian-arch-hoodie_user123', validReview, { uid: 'user123', email_verified: false }, now, 'published'), false);
  assert.equal(simulateProductReviewCreateRule('obsidian-arch-hoodie_other', { ...validReview, authorUid: 'other' }, auth, now, 'published'), false);
  assert.equal(simulateProductReviewCreateRule('obsidian-arch-hoodie_user123', { ...validReview, rating: 6 }, auth, now, 'published'), false);
  assert.equal(simulateProductReviewCreateRule('obsidian-arch-hoodie_user123', { ...validReview, rating: 4.5 }, auth, now, 'published'), false);
  assert.equal(simulateProductReviewCreateRule('obsidian-arch-hoodie_user123', { ...validReview, authorEmail: 'leak@test.pk' }, auth, now, 'published'), false);
  assert.equal(simulateProductReviewCreateRule('obsidian-arch-hoodie_user123', { ...validReview, verifiedPurchase: true }, auth, now, 'published'), false);
});

function simulateProductWriteFieldsRule(data: Record<string, unknown>): boolean {
  const required = ['name', 'slug', 'sku', 'description', 'fabric', 'price', 'badges', 'collectionId', 'colourways', 'sizes', 'status', 'featured', 'seoTitle', 'seoDescription', 'createdAt', 'updatedAt'];
  const allowed = new Set([...required, 'compareAtPrice', 'showOnRack', 'rackOrder', 'isSample']);
  for (const k of required) {
    if (!(k in data)) return false;
  }
  for (const k of Object.keys(data)) {
    if (!allowed.has(k)) return false;
  }
  if ('showOnRack' in data && typeof data.showOnRack !== 'boolean') return false;
  if ('rackOrder' in data && data.rackOrder !== null && (typeof data.rackOrder !== 'number' || data.rackOrder < 0 || data.rackOrder > 999)) return false;
  return true;
}

function simulateProductWriteAuthRule(auth: { email?: string; email_verified?: boolean; isAdminDoc?: boolean } | null): boolean {
  if (!auth || !auth.email_verified) return false;
  return auth.email === 'lessuse611@gmail.com' || auth.email === 'uselesss611@gmail.com' || Boolean(auth.isAdminDoc);
}

test('Dirty Dozen: product write validates optional showOnRack and rackOrder while rejecting shadow fields', () => {
  const baseProduct = {
    name: 'Velvet Mocha Hoodie',
    slug: 'velvet-mocha-hoodie',
    sku: 'ZRV-07',
    description: 'Heavyweight 500 gsm hoodie.',
    fabric: '500 gsm cotton',
    price: 13500,
    badges: ['New Drop'],
    collectionId: 'drop-01',
    colourways: [{ name: 'Mocha', hex: '#4A3728', images: [] }],
    sizes: [{ label: 'M', stock: 8 }],
    status: 'published',
    featured: true,
    seoTitle: 'Velvet Mocha Hoodie',
    seoDescription: 'Heavyweight hoodie',
    createdAt: 1000,
    updatedAt: 1000,
  };

  assert.equal(simulateProductWriteFieldsRule(baseProduct), true);
  assert.equal(simulateProductWriteFieldsRule({ ...baseProduct, showOnRack: true, rackOrder: 0 }), true);
  assert.equal(simulateProductWriteFieldsRule({ ...baseProduct, rackOrder: null }), true);
  assert.equal(simulateProductWriteFieldsRule({ ...baseProduct, showOnRack: 'yes' }), false);
  assert.equal(simulateProductWriteFieldsRule({ ...baseProduct, rackOrder: -1 }), false);
  assert.equal(simulateProductWriteFieldsRule({ ...baseProduct, secretFlag: true }), false);

  // Only authorized admins/owners can create, update, or delete products
  assert.equal(simulateProductWriteAuthRule(null), false);
  assert.equal(simulateProductWriteAuthRule({ email: 'customer@example.com', email_verified: true, isAdminDoc: false }), false);
  assert.equal(simulateProductWriteAuthRule({ email: 'lessuse611@gmail.com', email_verified: false }), false);
  assert.equal(simulateProductWriteAuthRule({ email: 'lessuse611@gmail.com', email_verified: true }), true);
  assert.equal(simulateProductWriteAuthRule({ email: 'staff@zorvique.pk', email_verified: true, isAdminDoc: true }), true);
});

const OWNER_IDENTITY_EMAILS = new Set(['lessuse611@gmail.com', 'uselesss611@gmail.com']);

function simulateAdminCollectionWriteRule(
  action: 'create' | 'update' | 'delete',
  targetEmail: string,
  data: Record<string, unknown> | null,
  auth: { email?: string; email_verified?: boolean } | null,
  serverNowMs: number,
  existingCreatedAt?: number
): boolean {
  if (!auth || !auth.email_verified || !auth.email) return false;
  if (!OWNER_IDENTITY_EMAILS.has(auth.email)) return false;
  if (!EMAIL_RE.test(targetEmail) || targetEmail.length > 254) return false;
  if (action === 'delete') {
    return !OWNER_IDENTITY_EMAILS.has(targetEmail);
  }
  if (!data) return false;
  const keys = Object.keys(data);
  if (keys.length !== 2 || !keys.includes('role') || !keys.includes('createdAt')) return false;
  if (action === 'create' && data.createdAt !== serverNowMs) return false;
  if (action === 'update' && data.createdAt !== existingCreatedAt) return false;
  if (OWNER_IDENTITY_EMAILS.has(targetEmail)) {
    return data.role === 'owner' || data.role === 'admin';
  }
  return data.role === 'member';
}

test('Dirty Dozen: admins collection enforces owner Admin record sync, strict member-only additions, and blocks self-promotion', () => {
  const now = 1700000000000;
  const ownerAuth = { email: 'lessuse611@gmail.com', email_verified: true };
  const memberAuth = { email: 'staff@zorvique.pk', email_verified: true };
  const unverifiedOwner = { email: 'lessuse611@gmail.com', email_verified: false };

  // Owner can sync their own Admin/Owner doc
  assert.equal(
    simulateAdminCollectionWriteRule('create', 'lessuse611@gmail.com', { role: 'owner', createdAt: now }, ownerAuth, now),
    true
  );
  // Owner can add future teammate ONLY as 'member'
  assert.equal(
    simulateAdminCollectionWriteRule('create', 'staff@zorvique.pk', { role: 'member', createdAt: now }, ownerAuth, now),
    true
  );
  // Non-owner email cannot be created as 'owner' or 'admin'
  assert.equal(
    simulateAdminCollectionWriteRule('create', 'staff@zorvique.pk', { role: 'owner', createdAt: now }, ownerAuth, now),
    false
  );
  assert.equal(
    simulateAdminCollectionWriteRule('create', 'staff@zorvique.pk', { role: 'admin', createdAt: now }, ownerAuth, now),
    false
  );
  // Existing member or stranger cannot add/promote/delete anyone
  assert.equal(
    simulateAdminCollectionWriteRule('create', 'other@zorvique.pk', { role: 'member', createdAt: now }, memberAuth, now),
    false
  );
  assert.equal(
    simulateAdminCollectionWriteRule('delete', 'staff@zorvique.pk', null, memberAuth, now),
    false
  );
  // Owner can remove a member, but cannot delete owner identity
  assert.equal(
    simulateAdminCollectionWriteRule('delete', 'staff@zorvique.pk', null, ownerAuth, now),
    true
  );
  assert.equal(
    simulateAdminCollectionWriteRule('delete', 'lessuse611@gmail.com', null, ownerAuth, now),
    false
  );
  // Unverified email spoof rejected
  assert.equal(
    simulateAdminCollectionWriteRule('create', 'staff@zorvique.pk', { role: 'member', createdAt: now }, unverifiedOwner, now),
    false
  );
});


