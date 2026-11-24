import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOrderTrackingStepModel,
  buildTrackingRecordFromOrder,
  normalizeOrderLookupId,
} from './orderTracking';

test('normalizeOrderLookupId trims hashes, uppercases order numbers, and rejects malformed IDs', () => {
  assert.deepEqual(normalizeOrderLookupId('  #zrv-48129304 '), {
    valid: true,
    normalized: 'ZRV-48129304',
  });
  assert.deepEqual(normalizeOrderLookupId('ord_176000_1234'), {
    valid: true,
    normalized: 'ord_176000_1234',
  });
  assert.equal(normalizeOrderLookupId('').valid, false);
  assert.equal(normalizeOrderLookupId('ZRV/BAD').valid, false);
});

test('buildOrderTrackingStepModel maps statuses into 4-step progress and cancelled state', () => {
  const shipped = buildOrderTrackingStepModel('shipped', 'TCS', '77889911');
  assert.equal(shipped.isCancelled, false);
  assert.equal(shipped.statusLabel, 'In Transit');
  assert.deepEqual(
    shipped.steps.map((s) => s.state),
    ['completed', 'completed', 'current', 'upcoming']
  );
  assert.match(shipped.statusSummary, /TCS/);

  const cancelled = buildOrderTrackingStepModel('cancelled', '', '');
  assert.equal(cancelled.isCancelled, true);
  assert.equal(cancelled.statusLabel, 'Cancelled');
  assert.equal(cancelled.steps.every((s) => s.state === 'cancelled'), true);
});

test('buildTrackingRecordFromOrder strips customer PII while retaining city, items, and totals', () => {
  const record = buildTrackingRecordFromOrder({
    id: 'ord_123',
    orderNo: 'ZRV-90123456',
    customer: {
      name: 'Ayesha',
      email: 'ayesha@example.com',
      phone: '+923001234567',
      city: 'Lahore',
      address: 'Private Street 12',
      postalCode: '54000',
    },
    items: [{ productId: 'p1', name: 'Obsidian Arch Hoodie', size: 'M', colour: 'Black', price: 12500, qty: 2 }],
    total: 25000,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'new',
    courier: '',
    trackingNo: '',
  });

  assert.equal(record.orderNo, 'ZRV-90123456');
  assert.equal(record.city, 'Lahore');
  assert.equal(record.itemCount, 2);
  assert.equal('customer' in record, false);
  assert.equal('email' in record, false);
  assert.equal('phone' in record, false);
  assert.equal('address' in record, false);
});
