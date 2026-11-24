export type CameraPresetId = 'rack' | 'fit' | 'hood';
export type LightingMoodId = 'atelier' | 'crimson' | 'loom';
export type LayerRole = 'hanger' | 'hood' | 'body' | 'pocket' | 'trim';

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

/**
 * Computes evenly centered X coordinate along the horizontal boutique rail.
 */
export function computeRackSlotX(index: number, count: number, spacing = 0.72): number {
  if (count <= 1) return 0;
  const centerOffset = (count - 1) * 0.5;
  return (index - centerOffset) * spacing;
}

/**
 * Computes deterministic layer separation vector for the exploded construction view (0..1).
 * Keeps the main garment body centered while expanding hood up, pocket/zip forward,
 * and oak hanger slightly higher for clear inspection of stitchcraft.
 */
export function computeExplodedLayerOffset(
  role: LayerRole,
  amount: number
): [number, number, number] {
  const t = Math.max(0, Math.min(1, Number.isFinite(amount) ? amount : 0));
  if (t === 0) return [0, 0, 0];
  switch (role) {
    case 'hanger':
      return [0, t * 0.48, -t * 0.08];
    case 'hood':
      return [0, t * 0.3, -t * 0.14];
    case 'pocket':
      return [0, -t * 0.08, t * 0.44];
    case 'trim':
      return [0, -t * 0.16, t * 0.24];
    case 'body':
    default:
      return [0, 0, 0];
  }
}

/**
 * Returns studio camera position & look-at target centered on the active garment stage.
 */
export function getCameraPresetPose(
  preset: CameraPresetId,
  activeStageZ = 1.05
): CameraPose {
  switch (preset) {
    case 'fit':
      return {
        position: [1.18, 1.88, activeStageZ + 2.35],
        target: [0, 1.54, activeStageZ],
      };
    case 'hood':
      return {
        position: [0.62, 2.48, activeStageZ + 1.48],
        target: [0, 2.06, activeStageZ + 0.04],
      };
    case 'rack':
    default:
      return {
        position: [0.35, 2.18, 5.45],
        target: [0, 1.56, 0.28],
      };
  }
}
