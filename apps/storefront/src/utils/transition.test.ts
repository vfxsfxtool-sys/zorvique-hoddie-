import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFallbackTargetRect,
  normalizeSlideDirection,
  sanitizeRect,
} from './transition';

test('sanitizeRect rounds geometry and clamps minimum dimensions', () => {
  const rect = sanitizeRect({ left: 100.4, top: 210.7, width: 12, height: 320.2 });
  assert.deepEqual(rect, { left: 100, top: 211, width: 40, height: 320 });
});

test('computeFallbackTargetRect anchors desktop PDP image inside left studio column', () => {
  const desktop = computeFallbackTargetRect(1440, 900);
  assert.ok(desktop.width > 400);
  assert.ok(desktop.height > desktop.width);
  assert.ok(desktop.left < 400);

  const mobile = computeFallbackTargetRect(390, 844);
  assert.equal(mobile.left, 24);
  assert.equal(mobile.width, 342);
});

test('normalizeSlideDirection chooses shortest circular direction across rack items', () => {
  assert.equal(normalizeSlideDirection(1, 0, 6), 1);
  assert.equal(normalizeSlideDirection(0, 5, 6), 1);
  assert.equal(normalizeSlideDirection(5, 0, 6), -1);
  assert.equal(normalizeSlideDirection(2, 3, 6), -1);
});
