import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, Search, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPKR, searchCatalog } from '../utils/commerce';

interface GlobalSearchBarProps {
  inputId?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onAfterNavigate?: () => void;
}

export function GlobalSearchBar({
  inputId = 'global-nav-search',
  placeholder = 'Search hoodies, collections...',
  className = '',
  autoFocus = false,
  onAfterNavigate,
}: GlobalSearchBarProps) {
  const { products, collections } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(
    () => searchCatalog(products, collections, query, 6),
    [products, collections, query]
  );
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    navigate(clean ? `/shop?q=${encodeURIComponent(clean)}` : '/shop');
    setDropdownOpen(false);
    onAfterNavigate?.();
  };

  const handleSelectProduct = (slug: string) => {
    setDropdownOpen(false);
    setQuery('');
    navigate(`/product/${slug}`);
    onAfterNavigate?.();
  };

  const handleSelectCollection = (collectionId: string) => {
    setDropdownOpen(false);
    setQuery('');
    navigate(`/shop?collection=${encodeURIComponent(collectionId)}`);
    onAfterNavigate?.();
  };

  const noMatches = results.collections.length === 0 && results.products.length === 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form role="search" onSubmit={handleSubmit} className="relative flex items-center">
        <label htmlFor={inputId} className="sr-only">
          Search products or collections
        </label>
        <Search className="w-3.5 h-3.5 text-white/45 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="search"
          value={query}
          onFocus={() => {
            if (query.trim()) setDropdownOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setDropdownOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-10 pl-9 pr-8 rounded-full bg-[#141416] border border-white/15 focus:border-white/50 text-xs text-white placeholder:text-white/40 outline-none transition-colors"
        />
        {hasQuery && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setDropdownOpen(false);
            }}
            aria-label="Clear search"
            className="absolute right-2.5 p-1 text-white/50 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {dropdownOpen && hasQuery && (
        <div
          role="region"
          aria-label="Search results"
          className="absolute right-0 top-full mt-2 w-full min-w-[280px] sm:w-80 xl:w-96 rounded-2xl bg-[#131316] border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.78)] overflow-hidden z-50"
        >
          {noMatches ? (
            <div className="p-5 text-center space-y-2">
              <p className="text-xs text-white/70">
                No hoodies or collections match &ldquo;{query.trim()}&rdquo;.
              </p>
              <Link
                to="/shop"
                onClick={() => {
                  setDropdownOpen(false);
                  onAfterNavigate?.();
                }}
                className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-primary)] hover:underline"
              >
                <span>Browse Full Collection</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.08] max-h-[65vh] overflow-y-auto">
              {results.collections.length > 0 && (
                <div className="p-3 space-y-1">
                  <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                    Collections
                  </p>
                  {results.collections.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => handleSelectCollection(col.id)}
                      className="w-full px-2.5 py-2 rounded-xl hover:bg-white/[0.06] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-white truncate">
                        <Layers className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                        <span className="truncate">{col.name}</span>
                      </span>
                      <span className="text-[11px] text-white/50 whitespace-nowrap shrink-0 tabular-nums">
                        {col.productCount} {col.productCount === 1 ? 'piece' : 'pieces'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.products.length > 0 && (
                <div className="p-3 space-y-1">
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                    Pieces
                  </p>
                  {results.products.map(({ product, collectionName }) => {
                    const thumb = product.colourways[0]?.images?.[0] || '';
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product.slug)}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-white/[0.06] flex items-center gap-3 text-left transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-12 rounded-lg bg-[#1F1F24] overflow-hidden shrink-0">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{product.name}</p>
                          <p className="text-[11px] text-white/50 truncate">
                            {collectionName || product.sku}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-white whitespace-nowrap shrink-0 tabular-nums">
                          {formatPKR(product.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="p-2.5 bg-[#0B0B0C]/60">
                <button
                  type="button"
                  onClick={() => {
                    const clean = query.trim();
                    setDropdownOpen(false);
                    navigate(`/shop?q=${encodeURIComponent(clean)}`);
                    onAfterNavigate?.();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/[0.06] flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <span>View all results for &ldquo;{query.trim()}&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
