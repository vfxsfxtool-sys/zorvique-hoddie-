export interface RectSnapshot {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function sanitizeRect(rect: DOMRect | RectSnapshot): RectSnapshot {
  return {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    width: Math.max(40, Math.round(rect.width)),
    height: Math.max(40, Math.round(rect.height)),
  };
}

export function computeFallbackTargetRect(
  viewportWidth: number,
  viewportHeight: number
): RectSnapshot {
  const isDesktop = viewportWidth >= 1024;
  if (isDesktop) {
    const containerWidth = Math.min(1152, viewportWidth - 80);
    const leftOffset = (viewportWidth - containerWidth) / 2 + 40;
    const width = Math.round(containerWidth * 0.44);
    const height = Math.round(width * 1.25);
    const top = Math.max(96, Math.round((viewportHeight - height) / 2));
    return {
      left: Math.round(leftOffset),
      top,
      width,
      height,
    };
  }

  const width = Math.max(220, Math.round(viewportWidth - 48));
  const height = Math.round(width * 1.25);
  return {
    left: 24,
    top: 108,
    width,
    height,
  };
}

export function normalizeSlideDirection(
  nextIndex: number,
  prevIndex: number,
  total: number
): 1 | -1 {
  if (total <= 1 || nextIndex === prevIndex) return 1;
  const forwardDiff = (nextIndex - prevIndex + total) % total;
  const backwardDiff = (prevIndex - nextIndex + total) % total;
  return forwardDiff <= backwardDiff ? 1 : -1;
}
