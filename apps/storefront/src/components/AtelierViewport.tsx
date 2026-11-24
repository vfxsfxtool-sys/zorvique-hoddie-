import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Layers, RotateCw, Sun } from 'lucide-react';
import type { RackPiece } from '../data/studioRack';
import { AtelierSceneEngine } from '../three/AtelierSceneEngine';
import type { CameraPresetId, LightingMoodId } from '../three/atelierMath';
import { formatPKR } from '../utils/commerce';

interface AtelierViewportProps {
  pieces: RackPiece[];
  initialSlug?: string;
}

export function AtelierViewport({ pieces, initialSlug }: AtelierViewportProps) {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<AtelierSceneEngine | null>(null);

  const initialIdx = Math.max(
    0,
    initialSlug ? pieces.findIndex((p) => p.slug === initialSlug) : 0
  );

  const [activeIndex, setActiveIndex] = useState(initialIdx);
  const [exploded, setExploded] = useState(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('fit');
  const [lightingMood, setLightingMood] = useState<LightingMoodId>('atelier');
  const [autoSpin, setAutoSpin] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const currentPiece = pieces[activeIndex] || pieces[0];

  // Mount WebGL canvas once inside isolated ref container
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount || pieces.length === 0) return;

    const engine = new AtelierSceneEngine(mount, pieces, initialIdx, {
      onSelectIndex: (idx) => {
        setActiveIndex(idx);
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [pieces, initialIdx]);

  // Keyboard shortcut 'H' to toggle Cinema / Zen mode HUD
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelectPiece = (idx: number) => {
    setActiveIndex(idx);
    engineRef.current?.setActiveIndex(idx);
  };

  const handleExplodedChange = (val: number) => {
    setExploded(val);
    engineRef.current?.setExplodedAmount(val);
  };

  const handleCameraPreset = (preset: CameraPresetId) => {
    setCameraPreset(preset);
    engineRef.current?.setCameraPreset(preset);
  };

  const handleLightingMood = (mood: LightingMoodId) => {
    setLightingMood(mood);
    engineRef.current?.setLightingMood(mood);
  };

  const handleToggleSpin = () => {
    setAutoSpin((prev) => {
      const next = !prev;
      engineRef.current?.setAutoRotate(next);
      return next;
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B0B0C] select-none">
      {/* Dedicated WebGL Mount Container (never touched by React HUD diffs) */}
      <div
        ref={canvasMountRef}
        aria-label="Interactive 3D Hoodie Atelier Viewport"
        className="absolute inset-0 w-full h-full"
      />

      {/* Minimal Top Floating Header (solid rgba surface, zero backdrop-blur over WebGL) */}
      <header className="pointer-events-none absolute top-0 inset-x-0 z-20 px-4 sm:px-8 pt-4 sm:pt-6 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-4">
        <Link
          to="/"
          className="pointer-events-auto min-h-[40px] sm:min-h-[42px] px-4 py-2 rounded-full bg-[rgba(14,14,16,0.92)] border border-white/15 hover:border-white text-white text-[11px] font-medium uppercase tracking-[0.2em] inline-flex items-center gap-2 transition-colors shrink-0 order-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Rack</span>
        </Link>

        {currentPiece && (
          <div className="pointer-events-auto order-3 sm:order-2 w-full sm:w-auto max-w-full px-4 sm:px-5 py-2 rounded-full bg-[rgba(14,14,16,0.92)] border border-white/12 flex items-center justify-center gap-2.5 text-center">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#E8D5CE]/75 hidden md:inline shrink-0">
              {currentPiece.pieceNumber}
            </span>
            <h1 className="font-editorial italic text-base sm:text-xl text-white leading-none truncate">
              {currentPiece.name}
            </h1>
            <span className="text-xs font-medium text-white/80 tabular-nums shrink-0">
              {formatPKR(currentPiece.price)}
            </span>
          </div>
        )}

        {currentPiece ? (
          <Link
            to={`/product/${currentPiece.slug}`}
            className="pointer-events-auto order-2 sm:order-3 min-h-[40px] sm:min-h-[42px] px-4 sm:px-5 py-2 rounded-full bg-[#9E0B14] hover:bg-[#7A0810] text-white text-[11px] font-semibold uppercase tracking-[0.18em] inline-flex items-center whitespace-nowrap shrink-0 transition-colors"
          >
            <span className="sm:hidden">Availability</span>
            <span className="hidden sm:inline">See Availability</span>
          </Link>
        ) : (
          <div className="order-2 sm:order-3" />
        )}
      </header>

      {/* Collapsible Unified Bottom Control Dock (<= 15% viewport height, no backdrop-filter) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(920px,94vw)] flex flex-col items-center">
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            aria-expanded={!dockCollapsed}
            className="px-4 py-1.5 rounded-full bg-[rgba(16,16,20,0.94)] border border-white/15 text-[10px] font-medium uppercase tracking-[0.2em] text-[#E8D5CE] hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>Show Studio Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>Hide Controls (H)</span>
              </>
            )}
          </button>
        </div>

        <div
          className={`w-full grid transition-[grid-template-rows,opacity] duration-250 ease-out ${
            dockCollapsed
              ? 'grid-rows-[0fr] opacity-0 pointer-events-none'
              : 'grid-rows-[1fr] opacity-100'
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-[20px] bg-[rgba(14,14,17,0.94)] border border-white/12 px-4 sm:px-5 py-3 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Colourway / Hoodie Swatch Switcher */}
            <div className="flex items-center gap-2" role="group" aria-label="Select hoodie piece">
              {pieces.map((p, idx) => {
                const selected = idx === activeIndex;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPiece(idx)}
                    aria-label={p.name}
                    aria-pressed={selected}
                    title={`${p.name} · ${formatPKR(p.price)}`}
                    className={`w-6 h-6 rounded-full transition-all cursor-pointer shrink-0 ${
                      selected
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0E0E11] scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: p.colourHex }}
                  />
                );
              })}
            </div>

            {/* Exploded Construction Layer Slider */}
            <label className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.18em] text-[#E8D5CE]/85">
              <Layers className="w-3.5 h-3.5 text-[#E8D5CE]" />
              <span className="hidden sm:inline">Deconstruct</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(exploded * 100)}
                onChange={(e) => handleExplodedChange(Number(e.target.value) / 100)}
                aria-label="Deconstruct garment layers"
                className="w-24 sm:w-28 accent-[#9E0B14] cursor-pointer"
              />
            </label>

            {/* Camera Views + Turntable */}
            <div className="flex items-center gap-1" role="group" aria-label="Camera presets">
              {(
                [
                  { id: 'rack', label: 'Rack' },
                  { id: 'fit', label: 'Fit' },
                  { id: 'hood', label: 'Hood' },
                ] as const
              ).map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => handleCameraPreset(cam.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] transition-colors cursor-pointer ${
                    cameraPreset === cam.id
                      ? 'bg-white text-[#0B0B0C] font-semibold'
                      : 'bg-white/5 text-white/75 hover:text-white'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleToggleSpin}
                aria-pressed={autoSpin}
                className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] inline-flex items-center gap-1 transition-colors cursor-pointer ${
                  autoSpin
                    ? 'bg-[#9E0B14] text-white font-semibold'
                    : 'bg-white/5 text-white/75 hover:text-white'
                }`}
              >
                <RotateCw className="w-3 h-3" />
                <span>Spin</span>
              </button>
            </div>

            {/* Studio Lighting Moods */}
            <div className="hidden md:flex items-center gap-1" role="group" aria-label="Lighting mood">
              <Sun className="w-3.5 h-3.5 text-[#E8D5CE]/70 mr-1" />
              {(
                [
                  { id: 'atelier', label: 'Atelier' },
                  { id: 'crimson', label: 'Crimson' },
                  { id: 'loom', label: 'Loom' },
                ] as const
              ).map((mood) => (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => handleLightingMood(mood.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] transition-colors cursor-pointer ${
                    lightingMood === mood.id
                      ? 'bg-[#E8D5CE] text-[#0B0B0C] font-semibold'
                      : 'bg-white/5 text-white/70 hover:text-white'
                  }`}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
