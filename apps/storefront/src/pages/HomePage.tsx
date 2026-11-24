import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { Hero } from '../components/Hero';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';

export function HomePage() {
  const { loading, error, reloadCatalog, settings, homepage, products, collections, testimonials } = useStore();
  const [selectedCollection, setSelectedCollection] = useState<string>('all');

  const orderedSections = useMemo(
    () => [...homepage.sections].filter((s) => s.visible).sort((a, b) => a.order - b.order),
    [homepage.sections]
  );

  const visibleProducts = useMemo(() => {
    const base =
      selectedCollection === 'all'
        ? products
        : products.filter((p) => p.collectionId === selectedCollection);
    return base.slice(0, 6);
  }, [products, selectedCollection]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col">
      <SeoHead />

      {settings.announcement && (
        <div className="w-full bg-[var(--color-primary)] text-white text-[11px] uppercase tracking-[0.2em] font-semibold text-center py-2 px-4">
          {settings.announcement}
        </div>
      )}

      <main className="flex-1">
        {error && (
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div
              role="alert"
              className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-red-200"
            >
              <span>Unable to sync live studio catalog from Firestore. Please retry.</span>
              <button
                type="button"
                onClick={() => void reloadCatalog()}
                className="min-h-[38px] px-4 py-1.5 rounded-full bg-white text-[#0B0B0C] text-xs font-semibold uppercase tracking-[0.16em] cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {orderedSections.map((section) => {
          if (section.type === 'hero') {
            return <Hero key={section.id} />;
          }

          if (section.type === 'collection') {
            return (
              <section key={section.id} className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)] mb-2">
                      {section.body || "Women's Curated Drop"}
                    </p>
                    <h2 className="font-editorial italic text-4xl sm:text-5xl text-white text-balance">
                      {section.title || 'Luxury Oversized Hoodies'}
                    </h2>
                  </div>

                  {products.length > 0 && collections.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by collection">
                      <button
                        type="button"
                        onClick={() => setSelectedCollection('all')}
                        className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-[0.16em] transition-colors cursor-pointer whitespace-nowrap ${
                          selectedCollection === 'all'
                            ? 'bg-white text-[#0B0B0C]'
                            : 'bg-[#141416] text-white/75 border border-white/10 hover:text-white'
                        }`}
                      >
                        All
                      </button>
                      {collections.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setSelectedCollection(col.id)}
                          className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-[0.16em] transition-colors cursor-pointer whitespace-nowrap ${
                            selectedCollection === col.id
                              ? 'bg-white text-[#0B0B0C]'
                              : 'bg-[#141416] text-white/75 border border-white/10 hover:text-white'
                          }`}
                        >
                          {col.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {loading && products.length === 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="rounded-[20px] bg-[#131316] h-[440px] animate-pulse border border-white/[0.06]"
                      />
                    ))}
                  </div>
                ) : visibleProducts.length === 0 ? (
                  <div className="rounded-[20px] bg-[#131316] border border-white/[0.08] p-12 text-center space-y-3">
                    <p className="font-editorial italic text-2xl text-white">
                      New drop arriving soon.
                    </p>
                    <p className="text-xs text-white/55">
                      No published hoodies are active in this collection yet.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {visibleProducts.map((product, idx) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          index={idx}
                        />
                      ))}
                    </div>
                    <div className="mt-10 text-center">
                      <Link
                        to="/shop"
                        className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-white/25 hover:border-white hover:bg-white hover:text-[#0B0B0C] text-[11px] font-medium uppercase tracking-[0.22em] text-white transition-all"
                      >
                        View Full Archive
                      </Link>
                    </div>
                  </>
                )}
              </section>
            );
          }

          if (section.type === 'craft') {
            return (
              <section key={section.id} className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24 border-t border-white/[0.06]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  <div className="lg:col-span-6 space-y-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
                      {section.title || 'Small-Batch Craft'}
                    </p>
                    <h2 className="font-editorial italic text-4xl sm:text-5xl text-white leading-tight text-balance">
                      {homepage.craft.title}
                    </h2>
                    <p className="text-sm sm:text-base text-white/65 leading-relaxed max-w-xl">
                      {homepage.craft.body}
                    </p>

                    {homepage.stats.length > 0 && (
                      <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                        {homepage.stats.map((stat, idx) => (
                          <div key={`${stat.label}-${idx}`}>
                            <p className="font-editorial italic text-4xl sm:text-5xl text-white tabular-nums">
                              {stat.value}
                            </p>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mt-1">
                              {stat.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-6">
                    <div className="rounded-[24px] overflow-hidden bg-[#131316] border border-white/[0.08] aspect-[4/3]">
                      {homepage.craft.imageUrl ? (
                        <img
                          src={homepage.craft.imageUrl}
                          alt={homepage.craft.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center bg-gradient-to-br from-[#18181C] via-[#121215] to-[#0B0B0C] space-y-4">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-primary)]">
                            Lahore Studio Standard
                          </p>
                          <p className="font-editorial italic text-3xl sm:text-4xl text-white text-balance">
                            Hoodies made in small runs, then never again.
                          </p>
                          <p className="text-xs text-white/55 max-w-sm leading-relaxed">
                            Double-lined architectural hoods &middot; Heavyweight 500 gsm combed fleece &middot; Individually numbered studio tags.
                          </p>
                          <Link
                            to="/about"
                            className="mt-2 inline-flex px-6 py-2.5 rounded-full border border-white/25 hover:border-white text-[11px] uppercase tracking-[0.2em] text-white transition-colors"
                          >
                            Read Our Story
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          if (section.type === 'testimonials') {
            if (testimonials.length === 0) return null;
            return (
              <section key={section.id} className="max-w-7xl mx-auto px-6 sm:px-10 py-16">
                <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
                    Community
                  </p>
                  <h2 className="font-editorial italic text-4xl sm:text-5xl text-white text-balance">
                    {section.title || 'Worn Across Pakistan'}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {testimonials.slice(0, 6).map((t) => (
                    <article
                      key={t.id}
                      className="rounded-[20px] bg-[#131316] border border-white/[0.08] p-6 flex flex-col justify-between gap-5"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-1 text-[var(--color-primary)]" aria-label={`${t.rating} out of 5 stars`}>
                          {Array.from({ length: Math.max(1, Math.min(5, Math.round(t.rating))) }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed italic">
                          &ldquo;{t.text}&rdquo;
                        </p>
                      </div>
                      <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                        <div className="w-8 h-8 rounded-full bg-white/10 text-xs font-semibold text-white flex items-center justify-center">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{t.name}</p>
                          <p className="text-[11px] text-white/50">{t.city}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          }

          return null;
        })}
      </main>

      <Footer />
    </div>
  );
}
