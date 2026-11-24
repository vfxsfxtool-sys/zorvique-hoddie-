import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeExplodedLayerOffset,
  computeRackSlotX,
  getCameraPresetPose,
} from './atelierMath.ts';

test('computeRackSlotX centers multi-garment racks symmetrically around x = 0', () => {
  const count = 6;
  const xs = Array.from({ length: count }, (_, i) => computeRackSlotX(i, count, 0.72));
  assert.ok(Math.abs(xs[0] + xs[count - 1]) < 1e-9);
  assert.ok(Math.abs(xs[1] + xs[4]) < 1e-9);
  assert.equal(computeRackSlotX(0, 1), 0);
});

test('computeExplodedLayerOffset clamps invalid ranges and separates garment layers cleanly', () => {
  assert.deepEqual(computeExplodedLayerOffset('hanger', 0), [0, 0, 0]);
  const hoodMax = computeExplodedLayerOffset('hood', 1.5);
  assert.ok(hoodMax[1] > 0.25 && hoodMax[1] <= 0.31);
  const pocketMax = computeExplodedLayerOffset('pocket', 1);
  assert.ok(pocketMax[2] > 0.35);
  const body = computeExplodedLayerOffset('body', 1);
  assert.deepEqual(body, [0, 0, 0]);
});

test('getCameraPresetPose returns finite coordinates tailored per view preset', () => {
  const rack = getCameraPresetPose('rack');
  const fit = getCameraPresetPose('fit');
  const hood = getCameraPresetPose('hood');

  for (const pose of [rack, fit, hood]) {
    for (const val of [...pose.position, ...pose.target]) {
      assert.ok(Number.isFinite(val));
    }
  }
  assert.ok(rack.position[2] > fit.position[2]);
  assert.ok(hood.position[1] > fit.position[1]);
});
