import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import {
  deleteHeroSlide,
  deleteTestimonial,
  importStudioCatalog,
  reorderHeroSlides,
  reorderRackProducts,
  saveHeroSlide,
  saveHomepage,
  saveTestimonial,
  updateProductRackPlacement,
} from '../data/adminApi';
import { analyzeStudioMigrationState } from '../data/initialCatalogMigration';
import type { HeroSlide, HomepageData, Product, Testimonial } from '../data/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatPKR, sortAdminRackProducts } from '../utils/adminLogic';

export function HeroHomepagePage() {
  const { loading, homepage, heroSlides, products, testimonials, refreshAll } = useAdminData();
  const [hp, setHp] = useState<HomepageData>(homepage);
  const [slides, setSlides] = useState<HeroSlide[]>(heroSlides);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [savingHp, setSavingHp] = useState(false);
  const [rackBusy, setRackBusy] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [slideDraft, setSlideDraft] = useState<Omit<HeroSlide, 'id'> & { id?: string }>({
    order: 0,
    productId: '',
    colourName: 'Sunset Amber',
    bgColor: '#B8540D',
    headline: 'Stand out Without trying.',
    body: '',
    ctaLabel: 'Get the look',
    ctaLink: '/shop',
    imageUrl: '',
    active: true,
  });

  const [testDraft, setTestDraft] = useState<Omit<Testimonial, 'id'> & { id?: string }>({
    name: '',
    city: 'Lahore',
    rating: 5,
    text: '',
    visible: true,
    isSample: false,
  });

  const [deleteSlideTarget, setDeleteSlideTarget] = useState<HeroSlide | null>(null);
  const [deleteTestTarget, setDeleteTestTarget] = useState<Testimonial | null>(null);

  useEffect(() => {
    setHp(homepage);
  }, [homepage]);

  useEffect(() => {
    setSlides(heroSlides);
  }, [heroSlides]);

  const handleSaveHomepage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHp(true);
    setPageError(null);
    try {
      await saveHomepage(hp);
      await refreshAll();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Unable to save homepage settings.');
    } finally {
      setSavingHp(false);
    }
  };

  const handleReorder = async (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || toIdx < 0 || toIdx >= slides.length) return;
    setPageError(null);
    const copy = [...slides];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    const reordered = copy.map((s, idx) => ({ ...s, order: idx }));
    setSlides(reordered);
    try {
      await reorderHeroSlides(reordered);
      await refreshAll();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Unable to reorder hero slides.');
    }
  };

  const rackProducts = useMemo(() => sortAdminRackProducts(products), [products]);
  const hiddenPublishedProducts = useMemo(
    () => products.filter((p) => p.status === 'published' && p.showOnRack === false),
    [products]
  );
  const migrationState = useMemo(() => analyzeStudioMigrationState(products), [products]);
  const needsStudioSync =
    products.length === 0 ||
    migrationState.missingSeeds.length > 0 ||
    migrationState.svgPlaceholderProducts.length > 0;

  const handleRackMove = async (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || toIdx < 0 || toIdx >= rackProducts.length) return;
    setRackBusy(true);
    setPageError(null);
    try {
      const next: Product[] = [...rackProducts];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      await reorderRackProducts(next);
      await refreshAll();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Unable to reorder garment rack.');
    } finally {
      setRackBusy(false);
    }
  };

  const handleRackVisibility = async (productId: string, showOnRack: boolean) => {
    setRackBusy(true);
    setPageError(null);
    try {
      await updateProductRackPlacement(productId, {
        showOnRack,
        ...(showOnRack ? { rackOrder: rackProducts.length } : {}),
      });
      await refreshAll();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Unable to update garment rack.');
    } finally {
      setRackBusy(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-14 rounded-2xl bg-[#1F2020] animate-pulse" />
        <div className="h-64 rounded-[24px] bg-[#1F2020] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Garment Rack &amp; Homepage</h1>
        <p className="text-xs text-[#E0C0AF]">
          Manage which hoodies hang on the homepage Garment Rack, their rail order, hero media, sections, and testimonials
        </p>
      </div>

      {pageError && (
        <div role="alert" className="rounded-2xl bg-red-500/15 border border-red-500/30 p-4 text-xs text-red-200">
          {pageError}
        </div>
      )}

      {/* Homepage Garment Rack Manager */}
      <section className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Homepage Garment Rack</h2>
            <p className="text-xs text-[#E0C0AF] mt-0.5">
              Every Published product with &ldquo;Hang on Homepage Garment Rack&rdquo; enabled appears on the metallic rail (up to 12 pieces).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {needsStudioSync && (
              <button
                type="button"
                disabled={rackBusy}
                onClick={async () => {
                  setRackBusy(true);
                  setPageError(null);
                  try {
                    await importStudioCatalog(products);
                    await refreshAll();
                  } catch (err) {
                    setPageError(err instanceof Error ? err.message : 'Import failed.');
                  } finally {
                    setRackBusy(false);
                  }
                }}
                className="min-h-[42px] px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
                <span>
                  {rackBusy
                    ? 'Syncing...'
                    : products.length === 0
                      ? 'Import 6 Atelier Hoodies'
                      : 'Sync Missing Studio Hoodies'}
                </span>
              </button>
            )}
            <Link
              to="/products?new=1"
              className="min-h-[42px] px-5 py-2 rounded-full bg-[#FF7A00] hover:bg-[#E65C00] text-[#121212] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Hoodie to Rack</span>
            </Link>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl bg-[#151515] border border-white/10 p-5 text-xs text-[#E0C0AF] leading-relaxed">
            Your Firestore catalog currently has 0 products. Click <strong className="text-white">Import 6 Atelier Hoodies</strong> above to migrate the signature Zorvique lineup into Firestore, or click <strong className="text-white">Add Hoodie to Rack</strong> to publish your own collection.
          </div>
        ) : rackProducts.length === 0 ? (
          <div className="rounded-2xl bg-[#151515] border border-white/10 p-5 text-xs text-[#E0C0AF]">
            No published hoodies are currently set to hang on the rack. Add a hoodie or restore one below.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {rackProducts.map((item, idx) => {
              const firstColour = item.colourways[0];
              const thumb = firstColour?.images?.[0] || '';
              return (
                <li
                  key={item.id}
                  className="rounded-2xl bg-[#151515] border border-white/10 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono text-[#FF7A00] w-7 shrink-0">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="w-10 h-12 rounded-lg bg-[#1F2020] overflow-hidden shrink-0 flex items-center justify-center border border-white/10">
                      {thumb ? (
                        <img src={thumb} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: firstColour?.hex || '#FF7A00' }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-[#E0C0AF] truncate tabular-nums">
                        {firstColour?.name || 'Studio Wash'} · {formatPKR(item.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={rackBusy || idx === 0}
                      aria-label={`Move ${item.name} earlier on rack`}
                      onClick={() => void handleRackMove(idx, idx - 1)}
                      className="p-2 rounded-full bg-white/5 text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={rackBusy || idx === rackProducts.length - 1}
                      aria-label={`Move ${item.name} later on rack`}
                      onClick={() => void handleRackMove(idx, idx + 1)}
                      className="p-2 rounded-full bg-white/5 text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={rackBusy}
                      aria-label={`Hide ${item.name} from rack`}
                      onClick={() => void handleRackVisibility(item.id, false)}
                      className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] text-[#E0C0AF] hover:text-white inline-flex items-center gap-1 cursor-pointer"
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>Hide</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {hiddenPublishedProducts.length > 0 && (
          <div className="pt-3 border-t border-white/10 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#E0C0AF]">
              Published Hoodies Not Currently on Rack
            </p>
            <div className="flex flex-wrap gap-2">
              {hiddenPublishedProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={rackBusy}
                  onClick={() => void handleRackVisibility(p.id, true)}
                  className="px-3.5 py-2 rounded-full bg-[#151515] hover:bg-[#FF7A00]/20 border border-white/10 hover:border-[#FF7A00]/40 text-xs text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#FF7A00]" />
                  <span>Hang {p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Homepage Mode, Sections, Stats & Craft */}
      <form
        onSubmit={handleSaveHomepage}
        className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <h2 className="font-display text-lg font-semibold text-white">Homepage Architecture</h2>
          <button
            type="submit"
            disabled={savingHp}
            className="px-6 py-2.5 rounded-full bg-[#FF7A00] text-[#121212] text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {savingHp ? 'Saving...' : 'Save Homepage Settings'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="hp-mode" className="block text-xs text-[#E0C0AF]">Hero Mode</label>
            <select
              id="hp-mode"
              value={hp.heroMode}
              onChange={(e) => setHp({ ...hp, heroMode: e.target.value as 'carousel' | 'video' })}
              className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-sm text-white outline-none"
            >
              <option value="carousel">Colour-Morph Carousel</option>
              <option value="video">Looping Background Video</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="hp-video" className="block text-xs text-[#E0C0AF]">Hero Video URL</label>
            <input
              id="hp-video"
              type="text"
              value={hp.heroVideoUrl}
              onChange={(e) => setHp({ ...hp, heroVideoUrl: e.target.value })}
              placeholder="https://... (MP4 or WebM URL)"
              className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="hp-poster" className="block text-xs text-[#E0C0AF]">Hero Poster URL</label>
            <input
              id="hp-poster"
              type="text"
              value={hp.heroPosterUrl}
              onChange={(e) => setHp({ ...hp, heroPosterUrl: e.target.value })}
              placeholder="https://... or /assets/rack/rack_obsidian.jpg"
              className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
          </div>
        </div>

        {/* Section Order & Visibility */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#E0C0AF]">Sections Order &amp; Visibility</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...hp.sections]
              .sort((a, b) => a.order - b.order)
              .map((sec, idx, arr) => (
                <div key={sec.id} className="rounded-2xl bg-[#151515] border border-white/10 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      aria-label={`Toggle ${sec.type} section`}
                      checked={sec.visible}
                      onChange={(e) => {
                        const next = hp.sections.map((s) =>
                          s.id === sec.id ? { ...s, visible: e.target.checked } : s
                        );
                        setHp({ ...hp, sections: next });
                      }}
                      className="accent-[#FF7A00]"
                    />
                    <input
                      aria-label={`Title for ${sec.type}`}
                      value={sec.title}
                      onChange={(e) => {
                        const next = hp.sections.map((s) =>
                          s.id === sec.id ? { ...s, title: e.target.value } : s
                        );
                        setHp({ ...hp, sections: next });
                      }}
                      className="bg-transparent text-xs font-semibold text-white outline-none truncate"
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      aria-label={`Move ${sec.type} up`}
                      onClick={() => {
                        const sorted = [...arr];
                        [sorted[idx - 1], sorted[idx]] = [sorted[idx], sorted[idx - 1]];
                        setHp({ ...hp, sections: sorted.map((s, i) => ({ ...s, order: i })) });
                      }}
                      className="p-1.5 rounded-full bg-white/5 text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === arr.length - 1}
                      aria-label={`Move ${sec.type} down`}
                      onClick={() => {
                        const sorted = [...arr];
                        [sorted[idx + 1], sorted[idx]] = [sorted[idx], sorted[idx + 1]];
                        setHp({ ...hp, sections: sorted.map((s, i) => ({ ...s, order: i })) });
                      }}
                      className="p-1.5 rounded-full bg-white/5 text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Craft Block & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#E0C0AF]">Craftsmanship Block</p>
            <input
              aria-label="Craft title"
              value={hp.craft.title}
              onChange={(e) => setHp({ ...hp, craft: { ...hp.craft, title: e.target.value } })}
              placeholder="Craft title"
              className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
            <textarea
              aria-label="Craft body"
              rows={3}
              value={hp.craft.body}
              onChange={(e) => setHp({ ...hp, craft: { ...hp.craft, body: e.target.value } })}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
            <input
              aria-label="Craft image URL"
              type="text"
              value={hp.craft.imageUrl}
              onChange={(e) => setHp({ ...hp, craft: { ...hp.craft, imageUrl: e.target.value } })}
              placeholder="https://... or /assets/rack/rack_obsidian.jpg"
              className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#E0C0AF]">Craft Stats</p>
              <button
                type="button"
                onClick={() => setHp({ ...hp, stats: [...hp.stats, { value: '100%', label: 'New Stat' }] })}
                className="text-xs text-[#FF7A00] hover:underline cursor-pointer"
              >
                + Add Stat
              </button>
            </div>
            {hp.stats.map((st, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  aria-label={`Stat value ${idx + 1}`}
                  value={st.value}
                  onChange={(e) => {
                    const next = [...hp.stats];
                    next[idx] = { ...st, value: e.target.value };
                    setHp({ ...hp, stats: next });
                  }}
                  className="w-28 px-3 py-2 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
                />
                <input
                  aria-label={`Stat label ${idx + 1}`}
                  value={st.label}
                  onChange={(e) => {
                    const next = [...hp.stats];
                    next[idx] = { ...st, label: e.target.value };
                    setHp({ ...hp, stats: next });
                  }}
                  className="flex-1 px-3 py-2 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
                />
                <button
                  type="button"
                  aria-label="Remove stat"
                  onClick={() => setHp({ ...hp, stats: hp.stats.filter((_, i) => i !== idx) })}
                  className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>

      {/* Hero Slides CRUD + Drag Reorder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPageError(null);
            try {
              await saveHeroSlide(
                {
                  order: slideDraft.id ? slideDraft.order : slides.length,
                  productId: slideDraft.productId,
                  colourName: slideDraft.colourName,
                  bgColor: slideDraft.bgColor,
                  headline: slideDraft.headline,
                  body: slideDraft.body,
                  ctaLabel: slideDraft.ctaLabel,
                  ctaLink: slideDraft.ctaLink,
                  imageUrl: slideDraft.imageUrl,
                  active: slideDraft.active,
                },
                slideDraft.id
              );
              setSlideDraft({
                order: slides.length,
                productId: '',
                colourName: 'Sunset Amber',
                bgColor: '#B8540D',
                headline: 'Stand out Without trying.',
                body: '',
                ctaLabel: 'Get the look',
                ctaLink: '/shop',
                imageUrl: '',
                active: true,
              });
              await refreshAll();
            } catch (err) {
              setPageError(err instanceof Error ? err.message : 'Unable to save hero slide.');
            }
          }}
          className="lg:col-span-5 rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-3"
        >
          <h2 className="font-display text-lg font-semibold text-white">
            {slideDraft.id ? 'Edit Hero Slide' : 'Add Hero Slide'}
          </h2>
          <select
            aria-label="Bind product"
            value={slideDraft.productId}
            onChange={(e) => {
              const prod = products.find((p) => p.id === e.target.value);
              setSlideDraft({
                ...slideDraft,
                productId: e.target.value,
                ctaLink: prod ? `/product/${prod.slug}` : slideDraft.ctaLink,
              });
            }}
            className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
          >
            <option value="">Bind Product (Optional)</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-2">
            <input
              aria-label="Colour name"
              value={slideDraft.colourName}
              onChange={(e) => setSlideDraft({ ...slideDraft, colourName: e.target.value })}
              placeholder="Colour"
              className="col-span-2 px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
            <input
              aria-label="Slide background colour"
              type="color"
              value={slideDraft.bgColor}
              onChange={(e) => setSlideDraft({ ...slideDraft, bgColor: e.target.value })}
              className="w-full h-10 rounded-full bg-transparent cursor-pointer"
            />
          </div>

          <input
            aria-label="Slide headline"
            required
            value={slideDraft.headline}
            onChange={(e) => setSlideDraft({ ...slideDraft, headline: e.target.value })}
            placeholder="Headline"
            className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
          />
          <textarea
            aria-label="Slide body"
            rows={2}
            value={slideDraft.body}
            onChange={(e) => setSlideDraft({ ...slideDraft, body: e.target.value })}
            placeholder="Slide description"
            className="w-full px-4 py-2.5 rounded-2xl bg-[#151515] border border-white/10 text-xs text-white outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label="CTA label"
              value={slideDraft.ctaLabel}
              onChange={(e) => setSlideDraft({ ...slideDraft, ctaLabel: e.target.value })}
              placeholder="CTA Label"
              className="px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
            <input
              aria-label="CTA link"
              value={slideDraft.ctaLink}
              onChange={(e) => setSlideDraft({ ...slideDraft, ctaLink: e.target.value })}
              placeholder="/shop"
              className="px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
          </div>
          <input
            aria-label="Slide image URL"
            type="text"
            value={slideDraft.imageUrl}
            onChange={(e) => setSlideDraft({ ...slideDraft, imageUrl: e.target.value })}
            placeholder="https://... or /assets/rack/rack_amber.jpg"
            className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
          />
          <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
            <input
              type="checkbox"
              checked={slideDraft.active}
              onChange={(e) => setSlideDraft({ ...slideDraft, active: e.target.checked })}
              className="accent-[#FF7A00]"
            />
            <span>Active on storefront</span>
          </label>
          <button
            type="submit"
            className="w-full py-2.5 rounded-full bg-[#FF7A00] text-[#121212] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{slideDraft.id ? 'Update Slide' : 'Add Slide'}</span>
          </button>
        </form>

        <div className="lg:col-span-7 rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold text-white">Hero Slides (Drag to Reorder)</h2>
          {slides.length === 0 ? (
            <p className="text-sm text-[#E0C0AF]">No hero slides configured yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {slides.map((s, idx) => (
                <li
                  key={s.id}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIdx !== null) void handleReorder(dragIdx, idx);
                    setDragIdx(null);
                  }}
                  className="rounded-2xl bg-[#151515] border border-white/10 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical className="w-4 h-4 text-[#E0C0AF]/60 shrink-0 cursor-grab" />
                    <span className="w-6 h-6 rounded-full shrink-0 border border-white/20" style={{ backgroundColor: s.bgColor }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {s.colourName} · {s.headline}
                      </p>
                      <p className="text-[11px] text-[#E0C0AF]">
                        {s.active ? 'Active' : 'Inactive'} · Order {idx + 1}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      aria-label={`Move ${s.colourName} up`}
                      onClick={() => void handleReorder(idx, idx - 1)}
                      className="p-2 rounded-full bg-white/5 text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === slides.length - 1}
                      aria-label={`Move ${s.colourName} down`}
                      onClick={() => void handleReorder(idx, idx + 1)}
                      className="p-2 rounded-full bg-white/5 text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideDraft(s)}
                      className="px-3 py-1.5 rounded-full bg-white/10 text-[11px] font-medium text-white cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${s.colourName}`}
                      onClick={() => setDeleteSlideTarget(s)}
                      className="p-2 rounded-full bg-red-500/10 text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Testimonials CRUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPageError(null);
            try {
              await saveTestimonial(
                {
                  name: testDraft.name.trim(),
                  city: testDraft.city.trim(),
                  rating: Number(testDraft.rating) || 5,
                  text: testDraft.text.trim(),
                  visible: testDraft.visible,
                  isSample: testDraft.isSample,
                },
                testDraft.id
              );
              setTestDraft({ name: '', city: 'Lahore', rating: 5, text: '', visible: true, isSample: false });
              await refreshAll();
            } catch (err) {
              setPageError(err instanceof Error ? err.message : 'Unable to save testimonial.');
            }
          }}
          className="lg:col-span-5 rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-3"
        >
          <h2 className="font-display text-lg font-semibold text-white">Add Testimonial</h2>
          <input
            aria-label="Customer name"
            required
            value={testDraft.name}
            onChange={(e) => setTestDraft({ ...testDraft, name: e.target.value })}
            placeholder="Customer Name"
            className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label="City"
              required
              value={testDraft.city}
              onChange={(e) => setTestDraft({ ...testDraft, city: e.target.value })}
              placeholder="City"
              className="px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
            <input
              aria-label="Rating"
              type="number"
              min={1}
              max={5}
              value={testDraft.rating}
              onChange={(e) => setTestDraft({ ...testDraft, rating: Number(e.target.value) })}
              className="px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
          </div>
          <textarea
            aria-label="Review text"
            required
            rows={3}
            value={testDraft.text}
            onChange={(e) => setTestDraft({ ...testDraft, text: e.target.value })}
            placeholder="Review quote..."
            className="w-full px-4 py-2.5 rounded-2xl bg-[#151515] border border-white/10 text-xs text-white outline-none"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-full bg-[#FF7A00] text-[#121212] text-xs font-semibold cursor-pointer"
          >
            {testDraft.id ? 'Update Testimonial' : 'Add Testimonial'}
          </button>
        </form>

        <div className="lg:col-span-7 rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold text-white">Customer Testimonials</h2>
          {testimonials.length === 0 ? (
            <p className="text-sm text-[#E0C0AF]">No testimonials added yet.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {testimonials.map((t) => (
                <li key={t.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {t.name} ({t.city}) · {t.rating}/5 {t.isSample ? '· SAMPLE' : ''}
                    </p>
                    <p className="text-xs text-[#E0C0AF] mt-1">&ldquo;{t.text}&rdquo;</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete testimonial from ${t.name}`}
                    onClick={() => setDeleteTestTarget(t)}
                    className="p-2 rounded-full bg-red-500/10 text-red-400 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteSlideTarget)}
        title="Delete Hero Slide"
        description={`Remove hero slide "${deleteSlideTarget?.colourName}"?`}
        onCancel={() => setDeleteSlideTarget(null)}
        onConfirm={async () => {
          if (!deleteSlideTarget) return;
          setPageError(null);
          try {
            await deleteHeroSlide(deleteSlideTarget.id);
            setDeleteSlideTarget(null);
            await refreshAll();
          } catch (err) {
            setPageError(err instanceof Error ? err.message : 'Unable to delete hero slide.');
            setDeleteSlideTarget(null);
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTestTarget)}
        title="Delete Testimonial"
        description={`Remove testimonial by "${deleteTestTarget?.name}"?`}
        onCancel={() => setDeleteTestTarget(null)}
        onConfirm={async () => {
          if (!deleteTestTarget) return;
          setPageError(null);
          try {
            await deleteTestimonial(deleteTestTarget.id);
            setDeleteTestTarget(null);
            await refreshAll();
          } catch (err) {
            setPageError(err instanceof Error ? err.message : 'Unable to delete testimonial.');
            setDeleteTestTarget(null);
          }
        }}
      />
    </div>
  );
}
