import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSubscriberDocId, validateSubscriberEmail } from './newsletter';

test('validateSubscriberEmail normalizes valid emails and rejects empty, malformed, or oversized inputs', () => {
  assert.deepEqual(validateSubscriberEmail('  Ayesha.Khan@Gmail.com '), {
    valid: true,
    email: 'ayesha.khan@gmail.com',
  });

  const empty = validateSubscriberEmail('   ');
  assert.equal(empty.valid, false);
  assert.ok(empty.error);

  const malformed = validateSubscriberEmail('not-an-email');
  assert.equal(malformed.valid, false);

  const tooLong = validateSubscriberEmail(`${'a'.repeat(250)}@test.pk`);
  assert.equal(tooLong.valid, false);
});

test('buildSubscriberDocId generates valid Firestore document IDs matching ^[a-zA-Z0-9_-]+$', () => {
  const id = buildSubscriberDocId(1700000000000, 456);
  assert.equal(id, 'sub_1700000000000_556');
  assert.match(id, /^[a-zA-Z0-9_-]+$/);
  assert.ok(id.length >= 1 && id.length <= 128);
});
