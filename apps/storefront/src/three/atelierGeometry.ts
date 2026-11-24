import * as THREE from 'three';
import type { RackPiece } from '../data/studioRack';
import type { LayerRole } from './atelierMath';
import {
  createNeckLabelTexture,
  type ProceduralAtelierTextures,
} from './proceduralTextures';

export interface HoodieLayerEntry {
  role: LayerRole;
  object: THREE.Object3D;
  basePos: THREE.Vector3;
}

export interface HoodieSculptureInstance {
  piece: RackPiece;
  root: THREE.Group;
  hangerAssembly: THREE.Group;
  hitMesh: THREE.Mesh;
  layers: HoodieLayerEntry[];
  slotIndex: number;
  restX: number;
  dispose: () => void;
}

export interface BoutiqueStageResult {
  group: THREE.Group;
  railY: number;
  dispose: () => void;
}

/**
 * Builds a tailored women's boxy drop-shoulder torso shell with natural fleece fold
 * drape and smooth radial normals (no harsh box corners).
 */
function createTailoredBodiceGeometry(): THREE.BufferGeometry {
  const radialSegs = 40;
  const heightSegs = 22;
  const height = 0.64; // from hem bottom (0) to shoulder yoke top (0.64)

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= heightSegs; iy++) {
    const v = iy / heightSegs; // 0 bottom -> 1 neck/shoulders
    const y = v * height;

    // Gentle feminine tailored taper: cinched lightly near waist, relaxed chest/shoulder
    const widthProfile =
      v < 0.14
        ? 0.215 + v * 0.12
        : v < 0.72
          ? 0.232 + Math.sin(((v - 0.14) / 0.58) * Math.PI * 0.65) * 0.036
          : 0.262 - ((v - 0.72) / 0.28) * 0.045;

    const depthProfile =
      v < 0.2
        ? 0.088 + v * 0.06
        : v < 0.8
          ? 0.1 + Math.sin(((v - 0.2) / 0.6) * Math.PI * 0.7) * 0.025
          : 0.112 - ((v - 0.8) / 0.2) * 0.04;

    for (let ix = 0; ix <= radialSegs; ix++) {
      const u = ix / radialSegs;
      const theta = u * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Squircle cross-section + soft fabric drape ripple at lower front/back
      const sqCos = Math.sign(cosT) * Math.pow(Math.abs(cosT), 0.72);
      const sqSin = Math.sign(sinT) * Math.pow(Math.abs(sinT), 0.86);

      const drapeRipple =
        Math.sin(theta * 3 + v * 2.1) * 0.0055 * (1 - v * 0.5) +
        Math.cos(theta * 5) * 0.0028 * (1 - v);

      const x = sqCos * (widthProfile + drapeRipple);
      const z = sqSin * (depthProfile + drapeRipple * 0.7);

      // Gentle collar scoop dip in front (+Z) at top
      const collarDip = v > 0.88 && sinT > 0 ? Math.pow((v - 0.88) / 0.12, 1.5) * sinT * 0.048 : 0;

      positions.push(x, y - collarDip, z);
      uvs.push(u, v);
    }
  }

  const row = radialSegs + 1;
  for (let iy = 0; iy < heightSegs; iy++) {
    for (let ix = 0; ix < radialSegs; ix++) {
      const a = iy * row + ix;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds the freestanding obsidian boutique plinth, curved stainless-steel garment rail,
 * knurled brass collars, radial contact shadows, and curved studio backdrop cove.
 */
export function buildBoutiqueRackStage(
  textures: ProceduralAtelierTextures
): BoutiqueStageResult {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(res: T): T => {
    disposables.push(res);
    return res;
  };

  const railY = 2.46;
  const railSpanHalf = 2.65;

  // Materials with clear PBR contrast
  const floorMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.floorAlbedo,
      roughness: 0.88,
      metalness: 0.06,
      envMapIntensity: 0.45,
    })
  );

  const brushedSteelMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x7c8089,
      metalness: 0.9,
      roughness: 0.28,
      anisotropy: 0.75,
      clearcoat: 0.2,
    })
  );

  const darkPlinthMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x16161a,
      roughness: 0.68,
      metalness: 0.22,
    })
  );

  const brassMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xd4a36a,
      metalness: 0.96,
      roughness: 0.16,
      anisotropy: 0.6,
    })
  );

  const crimsonRingMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x9e0b14,
      roughness: 0.38,
      metalness: 0.3,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );

  const shadowMat = track(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    })
  );

  // 1. Terrazzo Studio Floor (y = 0)
  const floorGeom = track(new THREE.CircleGeometry(18, 64));
  floorGeom.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.receiveShadow = true;
  group.add(floor);

  // 2. Center Stage Spotlight Inlay Disc & Brass Trim Ring
  const plinthGeom = track(new THREE.CylinderGeometry(1.15, 1.24, 0.04, 56));
  const plinth = new THREE.Mesh(plinthGeom, darkPlinthMat);
  plinth.position.set(0, 0.02, 1.05);
  plinth.receiveShadow = true;
  group.add(plinth);

  const inlayRingGeom = track(new THREE.RingGeometry(1.02, 1.055, 64));
  inlayRingGeom.rotateX(-Math.PI / 2);
  const inlayRing = new THREE.Mesh(inlayRingGeom, crimsonRingMat);
  inlayRing.position.set(0, 0.042, 1.05);
  group.add(inlayRing);

  const brassBaseTrimGeom = track(new THREE.TorusGeometry(1.24, 0.012, 14, 64));
  brassBaseTrimGeom.rotateX(Math.PI / 2);
  const brassBaseTrim = new THREE.Mesh(brassBaseTrimGeom, brassMat);
  brassBaseTrim.position.set(0, 0.012, 1.05);
  group.add(brassBaseTrim);

  // 3. Soft radial contact shadows beneath stanchion feet & center podium
  const stageShadowGeom = track(new THREE.PlaneGeometry(3.2, 3.2));
  stageShadowGeom.rotateX(-Math.PI / 2);
  const centerShadow = new THREE.Mesh(stageShadowGeom, shadowMat);
  centerShadow.position.set(0, 0.008, 1.05);
  group.add(centerShadow);

  // 4. Composite Brushed Steel Freestanding Boutique Rack (Left/Right Stanchions + Crossbar + Collars)
  const collarPoints = [
    new THREE.Vector2(0.036, 0),
    new THREE.Vector2(0.052, 0.01),
    new THREE.Vector2(0.052, 0.045),
    new THREE.Vector2(0.042, 0.065),
    new THREE.Vector2(0.036, 0.065),
  ];
  const collarGeom = track(new THREE.LatheGeometry(collarPoints, 24));
  const footPlateGeom = track(new THREE.CylinderGeometry(0.22, 0.25, 0.035, 32));
  const footShadowGeom = track(new THREE.PlaneGeometry(0.95, 0.95));
  footShadowGeom.rotateX(-Math.PI / 2);

  for (const side of [-1, 1] as const) {
    const sx = side * railSpanHalf;

    // Weighted foot plate flush at y = 0
    const plate = new THREE.Mesh(footPlateGeom, darkPlinthMat);
    plate.position.set(sx, 0.0175, 0);
    plate.castShadow = true;
    plate.receiveShadow = true;
    group.add(plate);

    const fShadow = new THREE.Mesh(footShadowGeom, shadowMat);
    fShadow.position.set(sx, 0.008, 0);
    group.add(fShadow);

    // Brass lower collar
    const collar = new THREE.Mesh(collarGeom, brassMat);
    collar.position.set(sx, 0.035, 0);
    collar.castShadow = true;
    group.add(collar);

    // Sweeping tubular upright stanchion curving cleanly into crossbar
    const stanchionCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, 0.04, 0),
      new THREE.Vector3(sx, 1.45, 0),
      new THREE.Vector3(sx, railY - 0.14, 0),
      new THREE.Vector3(sx - side * 0.12, railY, 0),
    ]);
    const stanchionGeom = track(new THREE.TubeGeometry(stanchionCurve, 28, 0.024, 14, false));
    const stanchion = new THREE.Mesh(stanchionGeom, brushedSteelMat);
    stanchion.castShadow = true;
    group.add(stanchion);

    // Top brushed end-cap sphere
    const capGeom = track(new THREE.CylinderGeometry(0.034, 0.034, 0.05, 24));
    capGeom.rotateZ(Math.PI / 2);
    const cap = new THREE.Mesh(capGeom, brassMat);
    cap.position.set(sx + side * 0.045, railY, 0);
    group.add(cap);
  }

  // Horizontal brushed chrome crossbar
  const barGeom = track(new THREE.CylinderGeometry(0.025, 0.025, railSpanHalf * 2 + 0.08, 28));
  barGeom.rotateZ(Math.PI / 2);
  const bar = new THREE.Mesh(barGeom, brushedSteelMat);
  bar.position.set(0, railY, 0);
  bar.castShadow = true;
  group.add(bar);

  // 5. Seamless Wide Obsidian Cyclorama Wall fading smoothly into horizon fog
  const coveGeom = track(
    new THREE.CylinderGeometry(9.6, 9.6, 6.4, 64, 1, true, Math.PI * 0.25, Math.PI * 1.5)
  );
  const coveMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x0c0c0f,
      roughness: 0.96,
      metalness: 0.02,
      side: THREE.BackSide,
    })
  );
  const cove = new THREE.Mesh(coveGeom, coveMat);
  cove.position.set(0, 3.1, 0.8);
  cove.receiveShadow = true;
  group.add(cove);

  return {
    group,
    railY,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

/**
 * Builds an 11-part composite 3D Hoodie + Oak Hanger sculpture for a Zorvique Drop piece.
 * Bottom-center pivot sits cleanly so the hanger hook aligns to y = railY when suspended.
 */
export function buildTailoredHoodieGroup(
  piece: RackPiece,
  slotIndex: number,
  restX: number,
  railY: number,
  textures: ProceduralAtelierTextures,
  maxAnisotropy: number
): HoodieSculptureInstance {
  const root = new THREE.Group();
  root.position.set(restX, railY, 0);

  const hangerAssembly = new THREE.Group();
  root.add(hangerAssembly);

  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(res: T): T => {
    disposables.push(res);
    return res;
  };

  const layers: HoodieLayerEntry[] = [];
  const registerLayer = (role: LayerRole, object: THREE.Object3D) => {
    layers.push({
      role,
      object,
      basePos: object.position.clone(),
    });
  };

  const baseColor = new THREE.Color(piece.colourHex || '#18181B');
  const richDyeColor = baseColor.clone().multiplyScalar(0.76);
  const isCrimsonContrast = piece.slug.includes('crimson');
  const isFullZip = piece.slug.includes('zip');

  // Distinct PBR materials per surface class
  const fleeceMat = track(
    new THREE.MeshPhysicalMaterial({
      color: richDyeColor,
      roughness: 0.88,
      metalness: 0.02,
      bumpMap: textures.fleeceBump,
      bumpScale: 0.0085,
      roughnessMap: textures.fleeceRoughness,
      sheen: 0.35,
      sheenRoughness: 0.78,
      sheenColor: baseColor.clone().lerp(new THREE.Color('#E8D5CE'), 0.16),
    })
  );

  const ribColor = richDyeColor.clone().multiplyScalar(0.86);
  const ribMat = track(
    new THREE.MeshStandardMaterial({
      color: ribColor,
      roughness: 0.76,
      metalness: 0.04,
      bumpMap: textures.ribBump,
      bumpScale: 0.011,
    })
  );

  const interiorLiningMat = track(
    new THREE.MeshStandardMaterial({
      color: isCrimsonContrast ? 0x3b0910 : baseColor.clone().multiplyScalar(0.62),
      roughness: 0.9,
      metalness: 0.01,
      side: THREE.DoubleSide,
    })
  );

  const oakMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.oakAlbedo,
      bumpMap: textures.oakBump,
      bumpScale: 0.005,
      roughness: 0.56,
      metalness: 0.04,
    })
  );

  const hardwareMat = track(
    new THREE.MeshPhysicalMaterial({
      color: isFullZip && !isCrimsonContrast ? 0x52525b : 0xd6b078,
      metalness: 0.94,
      roughness: 0.18,
      anisotropy: 0.7,
    })
  );

  // --- PART 1 & 2 & 3: Oak Contoured Hanger + Brass Hook + Neck Label ---
  const hangerGroup = new THREE.Group();
  hangerGroup.position.set(0, -0.032, -0.008);

  // Brass curved wire hook engaging the steel rail at local y = 0
  const hookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.015, 0.02),
    new THREE.Vector3(0, 0.042, 0.02),
    new THREE.Vector3(0, 0.06, 0),
    new THREE.Vector3(0, 0.04, -0.022),
    new THREE.Vector3(0, -0.095, 0),
  ]);
  const hookGeom = track(new THREE.TubeGeometry(hookCurve, 24, 0.0065, 10, false));
  const hookMesh = new THREE.Mesh(hookGeom, hardwareMat);
  hookMesh.castShadow = true;
  hangerGroup.add(hookMesh);

  // Sculpted oak wooden hanger bar tucked cleanly inside neckline/shoulders
  const hangerShape = new THREE.Shape();
  hangerShape.moveTo(-0.122, -0.17);
  hangerShape.quadraticCurveTo(-0.055, -0.122, 0, -0.098);
  hangerShape.quadraticCurveTo(0.055, -0.122, 0.122, -0.17);
  hangerShape.lineTo(0.118, -0.192);
  hangerShape.quadraticCurveTo(0.052, -0.152, 0, -0.13);
  hangerShape.quadraticCurveTo(-0.052, -0.152, -0.118, -0.192);
  hangerShape.closePath();

  const oakBarGeom = track(
    new THREE.ExtrudeGeometry(hangerShape, {
      depth: 0.024,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.004,
      bevelSegments: 2,
    })
  );
  oakBarGeom.translate(0, 0, -0.012);
  const oakBarMesh = new THREE.Mesh(oakBarGeom, oakMat);
  oakBarMesh.castShadow = true;
  hangerGroup.add(oakBarMesh);

  // Woven studio neck tag hanging inside collar
  const neckTex = track(createNeckLabelTexture('Zorvique', piece.pieceNumber || 'ZRV', maxAnisotropy));
  const neckLabelGeom = track(new THREE.PlaneGeometry(0.068, 0.034));
  const neckLabelMat = track(
    new THREE.MeshStandardMaterial({
      map: neckTex,
      roughness: 0.65,
      metalness: 0.15,
      side: THREE.DoubleSide,
    })
  );
  const neckLabel = new THREE.Mesh(neckLabelGeom, neckLabelMat);
  neckLabel.position.set(0, -0.185, 0.042);
  hangerGroup.add(neckLabel);

  hangerAssembly.add(hangerGroup);
  registerLayer('hanger', hangerGroup);

  // --- PART 4 & 5 & 6: Tailored Torso Bodice + Dropped Sleeves + Ribbed Cuffs ---
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, -0.78, 0);

  const bodiceGeom = track(createTailoredBodiceGeometry());
  const bodiceMesh = new THREE.Mesh(bodiceGeom, fleeceMat);
  bodiceMesh.castShadow = true;
  bodiceMesh.receiveShadow = true;
  bodyGroup.add(bodiceMesh);

  const cuffProfile = [
    new THREE.Vector2(0.048, 0),
    new THREE.Vector2(0.056, 0.012),
    new THREE.Vector2(0.055, 0.065),
    new THREE.Vector2(0.046, 0.072),
  ];
  const cuffGeom = track(new THREE.LatheGeometry(cuffProfile, 24));

  for (const side of [-1, 1] as const) {
    // Drop-shoulder softly falling curved sleeve
    const sleeveCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.185, 0.54, 0.0),
      new THREE.Vector3(side * 0.255, 0.43, 0.008),
      new THREE.Vector3(side * 0.275, 0.24, 0.016),
      new THREE.Vector3(side * 0.282, 0.08, 0.022),
    ]);
    const sleeveGeom = track(new THREE.TubeGeometry(sleeveCurve, 22, 0.064, 18, false));
    const sleeveMesh = new THREE.Mesh(sleeveGeom, fleeceMat);
    sleeveMesh.castShadow = true;
    sleeveMesh.receiveShadow = true;
    bodyGroup.add(sleeveMesh);

    // Ribbed cuff seated cleanly on sleeve tip
    const cuffMesh = new THREE.Mesh(cuffGeom, ribMat);
    cuffMesh.position.set(side * 0.282, 0.018, 0.022);
    cuffMesh.rotation.z = side * 0.04;
    cuffMesh.castShadow = true;
    bodyGroup.add(cuffMesh);
  }

  hangerAssembly.add(bodyGroup);
  registerLayer('body', bodyGroup);

  // --- PART 7: Weighted Ribbed Hem Waistband ---
  const trimGroup = new THREE.Group();
  trimGroup.position.set(0, -0.78, 0);

  const hemShape = new THREE.Shape();
  hemShape.absellipse(0, 0, 0.212, 0.086, 0, Math.PI * 2, false, 0);
  const hemHole = new THREE.Path();
  hemHole.absellipse(0, 0, 0.14, 0.04, 0, Math.PI * 2, true, 0);
  hemShape.holes.push(hemHole);

  const hemGeom = track(
    new THREE.ExtrudeGeometry(hemShape, {
      depth: 0.082,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.004,
      bevelSegments: 2,
    })
  );
  hemGeom.rotateX(Math.PI / 2);
  const hemMesh = new THREE.Mesh(hemGeom, ribMat);
  hemMesh.position.set(0, 0.064, 0);
  hemMesh.castShadow = true;
  trimGroup.add(hemMesh);

  hangerAssembly.add(trimGroup);
  registerLayer('trim', trimGroup);

  // --- PART 8 & 9: Architectural Double-Lined Hood Crown + Cowl Trim ---
  const hoodGroup = new THREE.Group();
  hoodGroup.position.set(0, -0.175, -0.015);

  // Outer sculpted hood cowl using open-front curved loft sphere/lathe crown
  const hoodOuterGeom = track(
    new THREE.SphereGeometry(0.145, 28, 22, Math.PI * 0.14, Math.PI * 1.72, 0, Math.PI * 0.78)
  );
  hoodOuterGeom.scale(0.95, 1.24, 1.08);
  hoodOuterGeom.rotateY(Math.PI * 0.5);
  const hoodOuterMesh = new THREE.Mesh(hoodOuterGeom, fleeceMat);
  hoodOuterMesh.position.set(0, 0.095, -0.01);
  hoodOuterMesh.castShadow = true;
  hoodGroup.add(hoodOuterMesh);

  // Contrast/cozy double-lined inner hood cavity
  const hoodInnerGeom = track(
    new THREE.SphereGeometry(0.132, 24, 18, Math.PI * 0.14, Math.PI * 1.72, 0, Math.PI * 0.76)
  );
  hoodInnerGeom.scale(0.92, 1.2, 1.04);
  hoodInnerGeom.rotateY(Math.PI * 0.5);
  const hoodInnerMesh = new THREE.Mesh(hoodInnerGeom, interiorLiningMat);
  hoodInnerMesh.position.set(0, 0.095, -0.008);
  hoodGroup.add(hoodInnerMesh);

  // Sculpted double-layered hood collar ring
  const cowlCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.088, 0.02, 0.082),
    new THREE.Vector3(-0.115, 0.11, 0.045),
    new THREE.Vector3(0, 0.255, -0.015),
    new THREE.Vector3(0.115, 0.11, 0.045),
    new THREE.Vector3(0.088, 0.02, 0.082),
  ]);
  const cowlGeom = track(new THREE.TubeGeometry(cowlCurve, 28, 0.022, 12, false));
  const cowlMesh = new THREE.Mesh(cowlGeom, fleeceMat);
  cowlMesh.castShadow = true;
  hoodGroup.add(cowlMesh);

  hangerAssembly.add(hoodGroup);
  registerLayer('hood', hoodGroup);

  // --- PART 10 & 11: Kangaroo Pocket + Central Zip Teeth / Braided Drawcords ---
  const pocketGroup = new THREE.Group();
  pocketGroup.position.set(0, -0.66, 0.105);

  const pktShape = new THREE.Shape();
  pktShape.moveTo(-0.125, -0.04);
  pktShape.lineTo(0.125, -0.04);
  pktShape.lineTo(0.115, 0.055);
  pktShape.lineTo(0.078, 0.135);
  pktShape.lineTo(-0.078, 0.135);
  pktShape.lineTo(-0.115, 0.055);
  pktShape.closePath();

  const pktGeom = track(
    new THREE.ExtrudeGeometry(pktShape, {
      depth: 0.022,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.004,
      bevelSegments: 2,
    })
  );
  const pktMesh = new THREE.Mesh(pktGeom, fleeceMat);
  pktMesh.castShadow = true;
  pocketGroup.add(pktMesh);

  if (isFullZip) {
    // Full-Zip hardware: satin fabric placket + 32 tight interlocking metallic zip teeth + slider
    const tapeGeom = track(new THREE.BoxGeometry(0.022, 0.54, 0.006));
    const tape = new THREE.Mesh(tapeGeom, interiorLiningMat);
    tape.position.set(0, 0.21, 0.006);
    pocketGroup.add(tape);

    const toothCount = 32;
    const toothGeom = track(new THREE.BoxGeometry(0.009, 0.005, 0.007));
    const zipInstanced = new THREE.InstancedMesh(toothGeom, hardwareMat, toothCount);
    const dummy = new THREE.Object3D();
    for (let t = 0; t < toothCount; t++) {
      const ty = -0.04 + (t / (toothCount - 1)) * 0.49;
      dummy.position.set(t % 2 === 0 ? -0.0022 : 0.0022, ty, 0.011);
      dummy.updateMatrix();
      zipInstanced.setMatrixAt(t, dummy.matrix);
    }
    zipInstanced.instanceMatrix.needsUpdate = true;
    zipInstanced.computeBoundingSphere();
    pocketGroup.add(zipInstanced);

    const sliderGeom = track(new THREE.BoxGeometry(0.015, 0.032, 0.012));
    const slider = new THREE.Mesh(sliderGeom, hardwareMat);
    slider.position.set(0, 0.36, 0.014);
    pocketGroup.add(slider);
  } else {
    // Minimal braided cotton drawcords + brushed metal aglet tips
    const cordMat = track(
      new THREE.MeshStandardMaterial({
        color: isCrimsonContrast ? 0xf3eee8 : baseColor.clone().lerp(new THREE.Color('#d4c5bc'), 0.25),
        roughness: 0.78,
        metalness: 0.02,
      })
    );
    const agletGeom = track(new THREE.CylinderGeometry(0.0055, 0.005, 0.024, 12));

    for (const side of [-1, 1] as const) {
      const cordCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.036, 0.455, -0.005),
        new THREE.Vector3(side * 0.044, 0.34, 0.014),
        new THREE.Vector3(side * 0.041, 0.23, 0.018),
      ]);
      const cordGeom = track(new THREE.TubeGeometry(cordCurve, 14, 0.0042, 8, false));
      const cord = new THREE.Mesh(cordGeom, cordMat);
      pocketGroup.add(cord);

      const aglet = new THREE.Mesh(agletGeom, hardwareMat);
      aglet.position.set(side * 0.041, 0.218, 0.018);
      pocketGroup.add(aglet);
    }
  }

  hangerAssembly.add(pocketGroup);
  registerLayer('pocket', pocketGroup);

  // Invisible raycast proxy box on layer 1 for instant click/hover hit detection
  const hitGeom = track(new THREE.BoxGeometry(0.58, 0.96, 0.32));
  const hitMat = track(new THREE.MeshBasicMaterial({ visible: false }));
  const hitMesh = new THREE.Mesh(hitGeom, hitMat);
  hitMesh.position.set(0, -0.44, 0);
  hitMesh.layers.set(1);
  hitMesh.userData.slotIndex = slotIndex;
  hangerAssembly.add(hitMesh);

  return {
    piece,
    root,
    hangerAssembly,
    hitMesh,
    layers,
    slotIndex,
    restX,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
