import * as THREE from 'three';

export interface ProceduralAtelierTextures {
  fleeceBump: THREE.CanvasTexture;
  fleeceRoughness: THREE.CanvasTexture;
  ribBump: THREE.CanvasTexture;
  oakAlbedo: THREE.CanvasTexture;
  oakBump: THREE.CanvasTexture;
  floorAlbedo: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

function seededNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

export function createProceduralAtelierTextures(
  maxAnisotropy: number
): ProceduralAtelierTextures {
  const aniso = Math.max(1, Math.min(8, maxAnisotropy));

  // 1. 500 GSM French Terry Knit Bump & Micro-Roughness
  const fleeceCanvas = document.createElement('canvas');
  fleeceCanvas.width = 256;
  fleeceCanvas.height = 256;
  const fCtx = fleeceCanvas.getContext('2d')!;
  const fImg = fCtx.createImageData(256, 256);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 256;
  roughCanvas.height = 256;
  const rCtx = roughCanvas.getContext('2d')!;
  const rImg = rCtx.createImageData(256, 256);

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const idx = (y * 256 + x) * 4;
      const knitWave = Math.sin(x * 0.85) * 0.5 + Math.cos(y * 1.15) * 0.5;
      const grain = seededNoise(x, y, 1) - 0.5;
      const bumpVal = Math.max(0, Math.min(255, Math.round(128 + knitWave * 28 + grain * 42)));
      fImg.data[idx] = bumpVal;
      fImg.data[idx + 1] = bumpVal;
      fImg.data[idx + 2] = bumpVal;
      fImg.data[idx + 3] = 255;

      const roughVal = Math.max(185, Math.min(248, Math.round(220 + grain * 26 - knitWave * 10)));
      rImg.data[idx] = roughVal;
      rImg.data[idx + 1] = roughVal;
      rImg.data[idx + 2] = roughVal;
      rImg.data[idx + 3] = 255;
    }
  }
  fCtx.putImageData(fImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const fleeceBump = new THREE.CanvasTexture(fleeceCanvas);
  fleeceBump.wrapS = THREE.RepeatWrapping;
  fleeceBump.wrapT = THREE.RepeatWrapping;
  fleeceBump.repeat.set(7, 7);
  fleeceBump.anisotropy = aniso;

  const fleeceRoughness = new THREE.CanvasTexture(roughCanvas);
  fleeceRoughness.wrapS = THREE.RepeatWrapping;
  fleeceRoughness.wrapT = THREE.RepeatWrapping;
  fleeceRoughness.repeat.set(7, 7);
  fleeceRoughness.anisotropy = aniso;

  // 2. Ribbed Cuffs & Hem Waistband Texture (Linear vertical knit wales)
  const ribCanvas = document.createElement('canvas');
  ribCanvas.width = 128;
  ribCanvas.height = 128;
  const ribCtx = ribCanvas.getContext('2d')!;
  for (let x = 0; x < 128; x++) {
    const shade = Math.round(128 + Math.sin((x / 128) * Math.PI * 36) * 85);
    ribCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ribCtx.fillRect(x, 0, 1, 128);
  }
  const ribBump = new THREE.CanvasTexture(ribCanvas);
  ribBump.wrapS = THREE.RepeatWrapping;
  ribBump.wrapT = THREE.RepeatWrapping;
  ribBump.repeat.set(4, 2);
  ribBump.anisotropy = aniso;

  // 3. Natural Oak Hanger Albedo (sRGB) + Wood Grain Bump
  const oakCanvas = document.createElement('canvas');
  oakCanvas.width = 256;
  oakCanvas.height = 256;
  const oCtx = oakCanvas.getContext('2d')!;
  oCtx.fillStyle = '#9b6b3f';
  oCtx.fillRect(0, 0, 256, 256);

  const oakBumpCanvas = document.createElement('canvas');
  oakBumpCanvas.width = 256;
  oakBumpCanvas.height = 256;
  const obCtx = oakBumpCanvas.getContext('2d')!;
  obCtx.fillStyle = '#808080';
  obCtx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y++) {
    const fiber = Math.sin(y * 0.24) * 0.5 + (seededNoise(y, 3, 7) - 0.5) * 0.7;
    const tone = Math.max(-25, Math.min(25, Math.round(fiber * 26)));
    oCtx.fillStyle = `rgb(${156 + tone},${107 + Math.round(tone * 0.7)},${63 + Math.round(tone * 0.45)})`;
    oCtx.fillRect(0, y, 256, 1);

    const b = Math.max(60, Math.min(200, 128 + tone * 2));
    obCtx.fillStyle = `rgb(${b},${b},${b})`;
    obCtx.fillRect(0, y, 256, 1);
  }

  const oakAlbedo = new THREE.CanvasTexture(oakCanvas);
  oakAlbedo.colorSpace = THREE.SRGBColorSpace;
  oakAlbedo.wrapS = THREE.RepeatWrapping;
  oakAlbedo.wrapT = THREE.RepeatWrapping;
  oakAlbedo.anisotropy = aniso;

  const oakBump = new THREE.CanvasTexture(oakBumpCanvas);
  oakBump.wrapS = THREE.RepeatWrapping;
  oakBump.wrapT = THREE.RepeatWrapping;

  // 4. Obsidian Terrazzo Studio Floor Albedo (sRGB)
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 512;
  floorCanvas.height = 512;
  const flCtx = floorCanvas.getContext('2d')!;
  flCtx.fillStyle = '#0e0e11';
  flCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 1600; i++) {
    const px = seededNoise(i, 1, 11) * 512;
    const py = seededNoise(i, 2, 19) * 512;
    const sz = 0.8 + seededNoise(i, 3, 23) * 1.9;
    const isBlush = i % 11 === 0;
    flCtx.fillStyle = isBlush ? 'rgba(232,213,206,0.06)' : 'rgba(255,255,255,0.035)';
    flCtx.fillRect(px, py, sz, sz);
  }
  flCtx.strokeStyle = 'rgba(255,255,255,0.025)';
  flCtx.lineWidth = 1;
  flCtx.strokeRect(0.5, 0.5, 511, 511);

  const floorAlbedo = new THREE.CanvasTexture(floorCanvas);
  floorAlbedo.colorSpace = THREE.SRGBColorSpace;
  floorAlbedo.wrapS = THREE.RepeatWrapping;
  floorAlbedo.wrapT = THREE.RepeatWrapping;
  floorAlbedo.repeat.set(14, 14);
  floorAlbedo.anisotropy = aniso;

  // 5. Soft Radial Contact Shadow Plane Alpha
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, 'rgba(0,0,0,0.72)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.32)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 256, 256);

  const contactShadow = new THREE.CanvasTexture(shadowCanvas);

  return {
    fleeceBump,
    fleeceRoughness,
    ribBump,
    oakAlbedo,
    oakBump,
    floorAlbedo,
    contactShadow,
    dispose: () => {
      fleeceBump.dispose();
      fleeceRoughness.dispose();
      ribBump.dispose();
      oakAlbedo.dispose();
      oakBump.dispose();
      floorAlbedo.dispose();
      contactShadow.dispose();
    },
  };
}

/**
 * Generates an anodized/woven neck tag canvas texture stamped with brand & SKU.
 */
export function createNeckLabelTexture(
  brandName: string,
  sku: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111114';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#9E0B14';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 244, 116);

  ctx.fillStyle = '#E8D5CE';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(brandName.toUpperCase(), 128, 52);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '600 18px sans-serif';
  ctx.fillText(`${sku} · LAHORE ATELIER`, 128, 90);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, Math.min(8, maxAnisotropy));
  return tex;
}
