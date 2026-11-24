import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { buildRackItems } from '../data/studioRack';
import { SeoHead } from '../components/SeoHead';
import { Navbar } from '../components/Navbar';
import { AtelierViewport } from '../components/AtelierViewport';

export function Studio3DPage() {
  const { loading, error, reloadCatalog, products, heroSlides } = useStore();
  const [searchParams] = useSearchParams();
  const initialSlug = searchParams.get('piece') || undefined;

  const rackPieces = useMemo(
    () => buildRackItems(products, heroSlides),
    [products, heroSlides]
  );

  return (
    <>
      <SeoHead
        title="3D Atelier Studio"
        description="Inspect Zorvique women's heavyweight hoodies on an interactive Three.js 3D garment rack with exploded construction layers."
      />
      <main className="min-h-screen bg-[#0B0B0C] text-white">
        {loading && rackPieces.length === 0 ? (
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
              <div className="w-64 h-80 rounded-2xl bg-[#131316] border border-white/10 animate-pulse" />
              <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                Loading 3D Atelier from Firestore...
              </p>
            </div>
          </div>
        ) : rackPieces.length === 0 ? (
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md w-full rounded-[20px] bg-[#131316] border border-white/10 p-8 text-center space-y-4">
                <h1 className="font-editorial italic text-3xl text-white">
                  {error ? 'Unable to Load 3D Atelier' : 'No Published Pieces on Rack'}
                </h1>
                <p className="text-sm text-white/65">
                  {error
                    ? error
                    : 'Publish at least one hoodie in your Zorvique catalog to inspect it in the 3D Atelier.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {error ? (
                    <button
                      type="button"
                      onClick={() => void reloadCatalog()}
                      className="px-6 py-2.5 rounded-full bg-white text-[#0B0B0C] text-xs uppercase tracking-[0.18em] font-semibold cursor-pointer"
                    >
                      Retry
                    </button>
                  ) : (
                    <Link
                      to="/shop"
                      className="px-6 py-2.5 rounded-full border border-white/25 hover:border-white text-xs uppercase tracking-[0.18em] text-white"
                    >
                      Explore Shop
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AtelierViewport pieces={rackPieces} initialSlug={initialSlug} />
        )}
      </main>
    </>
  );
}
