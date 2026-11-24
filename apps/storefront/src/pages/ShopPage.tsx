import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { NewsletterSection } from '../components/NewsletterSection';
import { Footer } from '../components/Footer';
import {
  type ProductSortOption,
  filterAndSortProducts,
  formatPKR,
  normalizeProductSort,
} from '../utils/commerce';

export function ShopPage() {
  const { loading, error, reloadCatalog, products, collections } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const urlCollection = searchParams.get('collection') || 'all';
  const urlSort = normalizeProductSort(searchParams.get('sort'));

  const [collectionId, setCollectionId] = useState(urlCollection);
  const [colour, setColour] = useState('all');
  const [size, setSize] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [search, setSearch] = useState(urlQuery);
  const [sort, setSort] = useState<ProductSortOption>(urlSort);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setCollectionId(urlCollection);
  }, [urlCollection]);

  useEffect(() => {
    setSort(urlSort);
  }, [urlSort]);

  const uniqueColours = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      p.colourways.forEach((c) => {
        if (!map.has(c.name)) map.set(c.name, c.hex);
      });
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const uniqueSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.sizes.forEach((s) => set.add(s.label)));
    return Array.from(set);
  }, [products]);

  const ceilingPrice = useMemo(
    () => products.reduce((max, p) => Math.max(max, p.price), 0),
    [products]
  );

  const filtered = useMemo(
    () =>
      filterAndSortProducts(
        products,
        {
          collectionId,
          colour,
          size,
          maxPrice: maxPrice > 0 ? maxPrice : undefined,
          search,
          sort,
        },
        collections
      ),
    [products, collectionId, colour, size, maxPrice, search, sort, collections]
  );

  const handleSortChange = (nextSort: ProductSortOption) => {
    setSort(nextSort);
    const nextParams = new URLSearchParams(searchParams);
    if (nextSort === 'featured') {
      nextParams.delete('sort');
    } else {
      nextParams.set('sort', nextSort);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const resetFilters = () => {
    setCollectionId('all');
    setColour('all');
    setSize('all');
    setMaxPrice(0);
    setSearch('');
    setSort('featured');
    setSearchParams({});
  };

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <label htmlFor="shop-search" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55 mb-2">
          Search
        </label>
        <input
          id="shop-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pieces..."
          className="w-full px-4 py-2.5 rounded-full bg-[#0B0B0C] border border-white/10 text-sm text-white placeholder:text-white/35 focus:border-white outline-none"
        />
      </div>

      {collections.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">Collection</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCollectionId('all')}
              className={`px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer ${
                collectionId === 'all'
                  ? 'bg-white text-[#0B0B0C]'
                  : 'bg-[#0B0B0C] text-white/75 border border-white/10'
              }`}
            >
              All
            </button>
            {collections.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCollectionId(c.id)}
                className={`px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer ${
                  collectionId === c.id
                    ? 'bg-white text-[#0B0B0C]'
                    : 'bg-[#0B0B0C] text-white/75 border border-white/10'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {uniqueColours.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">Colour</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setColour('all')}
              className={`px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer ${
                colour === 'all'
                  ? 'bg-white text-[#0B0B0C]'
                  : 'bg-[#0B0B0C] text-white/75 border border-white/10'
              }`}
            >
              All
            </button>
            {uniqueColours.map((cw) => (
              <button
                key={cw.name}
                type="button"
                onClick={() => setColour(cw.name)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer ${
                  colour === cw.name
                    ? 'bg-white text-[#0B0B0C]'
                    : 'bg-[#0B0B0C] text-white/75 border border-white/10'
                }`}
              >
                <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: cw.hex }} />
                <span>{cw.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {uniqueSizes.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">Size</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSize('all')}
              className={`min-w-[44px] h-10 px-3 rounded-full text-xs font-semibold cursor-pointer ${
                size === 'all'
                  ? 'bg-white text-[#0B0B0C]'
                  : 'bg-[#0B0B0C] text-white/75 border border-white/10'
              }`}
            >
              All
            </button>
            {uniqueSizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`min-w-[44px] h-10 px-3 rounded-full text-xs font-semibold cursor-pointer ${
                  size === s
                    ? 'bg-white text-[#0B0B0C]'
                    : 'bg-[#0B0B0C] text-white/75 border border-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {ceilingPrice > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <label htmlFor="price-range" className="text-[11px] font-semibold uppercase tracking-[0.2em]">
              Max Price
            </label>
            <span className="tabular-nums text-white font-medium">
              {maxPrice > 0 ? formatPKR(maxPrice) : 'Any'}
            </span>
          </div>
          <input
            id="price-range"
            type="range"
            min={0}
            max={ceilingPrice}
            step={500}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-[var(--color-primary)]"
          />
        </div>
      )}

      <button
        type="button"
        onClick={resetFilters}
        className="w-full py-2.5 rounded-full border border-white/15 text-xs uppercase tracking-[0.18em] font-medium text-white/70 hover:text-white hover:border-white transition-colors cursor-pointer"
      >
        Reset Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col">
      <SeoHead
        title="Shop Drop"
        description="Explore Zorvique women's limited-run heavyweight hoodies in Pakistan."
      />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-white/[0.08]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)] mb-2">
              Limited Run Archive
            </p>
            <h1 className="font-editorial italic text-4xl sm:text-5xl text-white">
              Heavyweight Drop Pieces
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-white/55 tabular-nums mr-1">
              {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}
            </span>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141416] border border-white/15 text-xs uppercase tracking-[0.18em] font-semibold text-white cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-2">
              <label
                htmlFor="shop-sort"
                className="text-[11px] uppercase tracking-[0.18em] text-white/55 whitespace-nowrap"
              >
                Sort by
              </label>
              <div className="relative">
                <select
                  id="shop-sort"
                  value={sort}
                  onChange={(e) => handleSortChange(normalizeProductSort(e.target.value))}
                  aria-label="Sort products"
                  className="appearance-none min-h-[44px] pl-4 pr-10 py-2 rounded-full bg-[#141416] border border-white/15 hover:border-white/35 text-xs font-medium text-white outline-none focus:border-white transition-colors cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest Arrival</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <ChevronDown
                  className="w-4 h-4 text-white/60 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 rounded-[20px] bg-[#131316] border border-white/[0.08] p-6">
              {FilterPanel}
            </div>
          </aside>

          <div className="lg:col-span-9">
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-red-200"
              >
                <span>Unable to load hoodies from Firestore. {error}</span>
                <button
                  type="button"
                  onClick={() => void reloadCatalog()}
                  className="min-h-[38px] px-4 py-1.5 rounded-full bg-white text-[#0B0B0C] text-xs font-semibold uppercase tracking-[0.16em] cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {loading && products.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="rounded-[20px] bg-[#131316] h-[420px] animate-pulse border border-white/[0.06]"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-[20px] bg-[#131316] border border-white/[0.08] p-12 text-center space-y-3">
                <p className="text-base font-medium text-white">No published hoodies yet.</p>
                <p className="text-xs text-white/55">
                  Check back soon for our upcoming Zorvique capsule drop.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-[20px] bg-[#131316] border border-white/[0.08] p-12 text-center space-y-4">
                <p className="text-base font-medium text-white">No pieces match your selected filters.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-6 py-3 rounded-full bg-white text-[#0B0B0C] text-xs uppercase tracking-[0.2em] font-semibold cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <NewsletterSection />

      {/* Mobile Off-Canvas Filter Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Filter Hoodies"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-80 max-w-[85vw] h-full bg-[#111113] border-r border-white/10 p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
              <h2 className="font-editorial italic text-2xl text-white">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {FilterPanel}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
