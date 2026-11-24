import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Edit3, Eye, EyeOff, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import {
  deleteProduct,
  duplicateProduct,
  importStudioCatalog,
  saveProduct,
  toggleProductStatus,
} from '../data/adminApi';
import {
  STUDIO_ASSET_PRESETS,
  analyzeStudioMigrationState,
} from '../data/initialCatalogMigration';
import type { Product, ProductColourway, ProductSizeStock } from '../data/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ensureUniqueSlug, formatPKR } from '../utils/adminLogic';

interface ProductDraft {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  fabric: string;
  price: number;
  compareAtPrice: string;
  badgesText: string;
  collectionId: string;
  colourways: ProductColourway[];
  sizes: ProductSizeStock[];
  status: 'draft' | 'published';
  featured: boolean;
  showOnRack: boolean;
  rackOrder: string;
  seoTitle: string;
  seoDescription: string;
}

const EMPTY_DRAFT = (defaultCollectionId: string): ProductDraft => ({
  name: '',
  slug: '',
  sku: '',
  description: '',
  fabric: '450 GSM French Terry Cotton',
  price: 12500,
  compareAtPrice: '',
  badgesText: '',
  collectionId: defaultCollectionId,
  colourways: [{ name: 'Sunset Amber', hex: '#FF7A00', images: [] }],
  sizes: [
    { label: 'S', stock: 10 },
    { label: 'M', stock: 15 },
    { label: 'L', stock: 12 },
    { label: 'XL', stock: 6 },
  ],
  status: 'draft',
  featured: false,
  showOnRack: true,
  rackOrder: '',
  seoTitle: '',
  seoDescription: '',
});

export function ProductsPage() {
  const { loading, products, collections, refreshAll } = useAdminData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [collectionFilter, setCollectionFilter] = useState('all');

  const [editing, setEditing] = useState<ProductDraft | null>(null);
  const [colourUrlInputs, setColourUrlInputs] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importingCatalog, setImportingCatalog] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const openNewFromParam = searchParams.get('new') === '1';
  const defaultCollectionId = collections[0]?.id || '';
  const migrationState = useMemo(() => analyzeStudioMigrationState(products), [products]);

  useEffect(() => {
    if (!openNewFromParam) return;
    setFormError(null);
    setColourUrlInputs({});
    setEditing((prev) =>
      prev || {
        ...EMPTY_DRAFT(defaultCollectionId),
        status: 'published',
        showOnRack: true,
      }
    );
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [openNewFromParam, defaultCollectionId, searchParams, setSearchParams]);

  const summary = useMemo(() => {
    let published = 0;
    let draft = 0;
    let totalUnits = 0;
    for (const p of products) {
      if (p.status === 'published') published += 1;
      else draft += 1;
      for (const s of p.sizes) totalUnits += Math.max(0, s.stock);
    }
    return { total: products.length, published, draft, totalUnits };
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (collectionFilter !== 'all' && p.collectionId !== collectionFilter) return false;
      if (q) {
        const hay = `${p.name} ${p.sku} ${p.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, search, statusFilter, collectionFilter]);

  const openEdit = (p: Product) => {
    setFormError(null);
    setColourUrlInputs({});
    setEditing({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.description,
      fabric: p.fabric,
      price: p.price,
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
      badgesText: p.badges.join(', '),
      collectionId: p.collectionId,
      colourways: p.colourways.map((c) => ({ ...c, images: [...c.images] })),
      sizes: p.sizes.map((s) => ({ ...s })),
      status: p.status,
      featured: p.featured,
      showOnRack: p.showOnRack !== false,
      rackOrder: typeof p.rackOrder === 'number' ? String(p.rackOrder) : '',
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
    });
  };

  const handleAddImageUrl = (cwIdx: number, rawValue?: string) => {
    if (!editing) return;
    const raw = (rawValue ?? colourUrlInputs[cwIdx] ?? '').trim();
    if (!raw) return;
    if (!raw.startsWith('/') && !/^https?:\/\//i.test(raw)) {
      setFormError('Image path must start with "/" (e.g. /assets/rack/rack_obsidian.jpg) or "https://".');
      return;
    }
    setFormError(null);
    const next = [...editing.colourways];
    const targetCw = next[cwIdx];
    if (!targetCw) return;
    if (!targetCw.images.includes(raw)) {
      next[cwIdx] = { ...targetCw, images: [...targetCw.images, raw] };
      setEditing({ ...editing, colourways: next });
    }
    if (rawValue === undefined) {
      setColourUrlInputs((prev) => ({ ...prev, [cwIdx]: '' }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setFormError(null);
    setActionError(null);
    setActionNotice(null);
    if (!editing.name.trim() || !editing.sku.trim()) {
      setFormError('Product Name and SKU are required.');
      return;
    }
    if (!Number.isFinite(editing.price) || editing.price < 0) {
      setFormError('Price must be zero or greater.');
      return;
    }
    setSaving(true);
    try {
      const badges = editing.badgesText
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);
      const compareVal = editing.compareAtPrice.trim() ? Number(editing.compareAtPrice) : null;
      const parsedRackOrder =
        editing.rackOrder.trim() === ''
          ? undefined
          : Math.max(0, Math.min(999, Math.round(Number(editing.rackOrder))));

      const savedName = editing.name.trim();
      const wasEditing = Boolean(editing.id);
      await saveProduct(
        {
          name: savedName,
          slug: ensureUniqueSlug(
            editing.slug || editing.name,
            products.map((p) => p.slug),
            editing.id ? products.find((p) => p.id === editing.id)?.slug : undefined
          ),
          sku: editing.sku.trim(),
          description: editing.description.trim(),
          fabric: editing.fabric.trim(),
          price: Math.max(0, Number(editing.price) || 0),
          compareAtPrice: compareVal && Number.isFinite(compareVal) && compareVal > 0 ? compareVal : null,
          badges,
          collectionId: editing.collectionId,
          colourways: editing.colourways,
          sizes: editing.sizes,
          status: editing.status,
          featured: editing.featured,
          showOnRack: editing.showOnRack,
          rackOrder: parsedRackOrder !== undefined && Number.isFinite(parsedRackOrder) ? parsedRackOrder : undefined,
          seoTitle: editing.seoTitle.trim(),
          seoDescription: editing.seoDescription.trim(),
        },
        editing.id,
        products
      );
      setEditing(null);
      await refreshAll();
      setActionNotice(wasEditing ? `Saved changes to "${savedName}" in Firestore.` : `Added "${savedName}" to Firestore.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError(null);
    setActionNotice(null);
    const deletedName = deleteTarget.name;
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      await refreshAll();
      setActionNotice(`Deleted "${deletedName}" permanently from Firestore.`);
    } catch (err) {
      setDeleteTarget(null);
      setActionError(err instanceof Error ? err.message : `Unable to delete "${deletedName}".`);
    } finally {
      setDeleting(false);
    }
  };

  const handleImportOrRepair = async () => {
    setImportingCatalog(true);
    setActionError(null);
    setActionNotice(null);
    try {
      const res = await importStudioCatalog(products);
      await refreshAll();
      if (res.createdCount === 0 && res.repairedCount === 0) {
        setActionNotice('All 6 Studio hoodies and photos are already synced in Firestore.');
      } else {
        const parts: string[] = [];
        if (res.createdCount > 0) parts.push(`${res.createdCount} studio product(s) added`);
        if (res.repairedCount > 0) parts.push(`${res.repairedCount} studio photo path(s) upgraded`);
        setActionNotice(`Firestore synced: ${parts.join(', ')}.`);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to migrate studio catalog to Firestore.');
    } finally {
      setImportingCatalog(false);
    }
  };

  const showSyncButton =
    products.length === 0 ||
    migrationState.missingSeeds.length > 0 ||
    migrationState.svgPlaceholderProducts.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Products Inventory</h1>
          <p className="text-xs text-[#E0C0AF] tabular-nums">
            {summary.total} SKUs · {summary.published} Published · {summary.draft} Draft · {summary.totalUnits} Total Units
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {showSyncButton && (
            <button
              type="button"
              disabled={importingCatalog}
              onClick={() => void handleImportOrRepair()}
              className="min-h-[44px] px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#FF7A00]" />
              <span>
                {importingCatalog
                  ? 'Migrating...'
                  : products.length === 0
                    ? 'Import 6 Atelier Hoodies'
                    : 'Sync Missing Studio Hoodies'}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setActionError(null);
              setEditing(EMPTY_DRAFT(collections[0]?.id || ''));
            }}
            className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#FF7A00] hover:bg-[#E65C00] text-[#121212] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Hoodie SKU</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div role="alert" className="rounded-2xl bg-red-500/15 border border-red-500/30 p-3.5 text-xs text-red-200">
          {actionError}
        </div>
      )}
      {actionNotice && (
        <div role="status" className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3.5 text-xs text-emerald-200">
          {actionNotice}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#E0C0AF]/60 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or slug..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none focus:border-[#FF7A00]"
          />
        </div>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        <select
          aria-label="Filter by collection"
          value={collectionFilter}
          onChange={(e) => setCollectionFilter(e.target.value)}
          className="px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
        >
          <option value="all">All Collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-[340px] rounded-[24px] bg-[#1F2020] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-12 text-center space-y-3">
          <p className="text-sm text-[#E0C0AF]">No products match your view yet.</p>
          <button
            type="button"
            onClick={() => setEditing(EMPTY_DRAFT(collections[0]?.id || ''))}
            className="px-5 py-2.5 rounded-full bg-[#FF7A00] text-[#121212] text-xs font-semibold cursor-pointer"
          >
            Create First Hoodie
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => {
            const totalStock = p.sizes.reduce((sum, s) => sum + s.stock, 0);
            const thumb = p.colourways[0]?.images?.[0] || '';
            return (
              <article
                key={p.id}
                className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-[#151515]">
                  {thumb ? (
                    <img src={thumb} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[#E0C0AF]">
                      No Photo
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                        p.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/10 text-[#E0C0AF] border border-white/15'
                      }`}
                    >
                      {p.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    {p.status === 'published' && p.showOnRack !== false && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FF7A00]/20 text-[#F5B082] border border-[#FF7A00]/35">
                        On Rack
                      </span>
                    )}
                  </div>
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 text-[11px] text-white tabular-nums">
                    Stock: {totalStock}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div>
                    <h2 className="font-display text-base font-semibold text-white">{p.name}</h2>
                    <p className="text-xs text-[#E0C0AF] mt-0.5 tabular-nums">
                      SKU: {p.sku} · {formatPKR(p.price)}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      disabled={togglingId === p.id}
                      onClick={async () => {
                        setTogglingId(p.id);
                        setActionError(null);
                        setActionNotice(null);
                        try {
                          const nextStatus = p.status === 'published' ? 'draft' : 'published';
                          await toggleProductStatus(p.id, nextStatus);
                          await refreshAll();
                          setActionNotice(`"${p.name}" is now ${nextStatus}.`);
                        } catch (err) {
                          setActionError(err instanceof Error ? err.message : 'Unable to change status.');
                        } finally {
                          setTogglingId(null);
                        }
                      }}
                      aria-label={p.status === 'published' ? `Move ${p.name} to Draft` : `Publish ${p.name}`}
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 text-[#E0C0AF] hover:text-white flex items-center justify-center cursor-pointer disabled:opacity-40"
                    >
                      {p.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      disabled={duplicatingId === p.id}
                      onClick={async () => {
                        setDuplicatingId(p.id);
                        setActionError(null);
                        setActionNotice(null);
                        try {
                          await duplicateProduct(p, products);
                          await refreshAll();
                          setActionNotice(`Created draft copy of "${p.name}".`);
                        } catch (err) {
                          setActionError(err instanceof Error ? err.message : 'Unable to duplicate product.');
                        } finally {
                          setDuplicatingId(null);
                        }
                      }}
                      aria-label={`Duplicate ${p.name}`}
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center cursor-pointer disabled:opacity-40"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(p)}
                      aria-label={`Delete ${p.name}`}
                      className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/25 text-red-400 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Product Editor Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit Product"
        >
          <form
            onSubmit={handleSave}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-[#1A1A1A] border border-white/10 p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="font-display text-xl font-semibold text-white">
                {editing.id ? 'Edit Hoodie SKU' : 'New Hoodie SKU'}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close product editor"
                className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div role="alert" className="rounded-2xl bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-200">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="prod-name" className="block text-xs text-[#E0C0AF]">Name</label>
                <input
                  id="prod-name"
                  required
                  value={editing.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            name,
                            slug: prev.id
                              ? prev.slug
                              : ensureUniqueSlug(name, products.map((p) => p.slug)),
                          }
                        : prev
                    );
                  }}
                  className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-sm text-white outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prod-slug" className="block text-xs text-[#E0C0AF]">Slug (URL)</label>
                <input
                  id="prod-slug"
                  required
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-sm text-white outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prod-sku" className="block text-xs text-[#E0C0AF]">SKU</label>
                <input
                  id="prod-sku"
                  required
                  value={editing.sku}
                  onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-sm text-white outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prod-col" className="block text-xs text-[#E0C0AF]">Collection</label>
                <select
                  id="prod-col"
                  value={editing.collectionId}
                  onChange={(e) => setEditing({ ...editing, collectionId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-sm text-white outline-none"
                >
                  <option value="">Uncategorized</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="prod-price" className="block text-xs text-[#E0C0AF]">Price (PKR)</label>
                <input
                  id="prod-price"
                  type="number"
                  min={0}
                  required
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-sm text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prod-compare" className="block text-xs text-[#E0C0AF]">Compare-At Price (PKR)</label>
                <input
                  id="prod-compare"
                  type="number"
                  min={0}
                  value={editing.compareAtPrice}
                  onChange={(e) => setEditing({ ...editing, compareAtPrice: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-sm text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prod-fabric" className="block text-xs text-[#E0C0AF]">Fabric Subtitle</label>
                <input
                  id="prod-fabric"
                  value={editing.fabric}
                  onChange={(e) => setEditing({ ...editing, fabric: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-sm text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prod-badges" className="block text-xs text-[#E0C0AF]">Badges (comma separated)</label>
                <input
                  id="prod-badges"
                  value={editing.badgesText}
                  onChange={(e) => setEditing({ ...editing, badgesText: e.target.value })}
                  placeholder="Bestseller, Limited Edition"
                  className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-sm text-white outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label htmlFor="prod-desc" className="block text-xs text-[#E0C0AF]">Description</label>
                <textarea
                  id="prod-desc"
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-[#121212] border border-white/10 text-sm text-white outline-none"
                />
              </div>
            </div>

            {/* Sizes & Stock */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#E0C0AF]">Sizes &amp; Stock</p>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      sizes: [...editing.sizes, { label: 'XXL', stock: 0 }],
                    })
                  }
                  className="text-xs text-[#FF7A00] hover:underline cursor-pointer"
                >
                  + Add Size
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {editing.sizes.map((sz, idx) => (
                  <div key={idx} className="relative rounded-2xl bg-[#121212] border border-white/10 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <input
                        aria-label={`Size label ${idx + 1}`}
                        value={sz.label}
                        onChange={(e) => {
                          const next = [...editing.sizes];
                          next[idx] = { ...sz, label: e.target.value };
                          setEditing({ ...editing, sizes: next });
                        }}
                        className="w-full bg-transparent text-xs font-semibold text-white outline-none"
                      />
                      {editing.sizes.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Remove size ${sz.label}`}
                          onClick={() =>
                            setEditing({
                              ...editing,
                              sizes: editing.sizes.filter((_, sIdx) => sIdx !== idx),
                            })
                          }
                          className="text-xs text-red-400 hover:text-red-300 px-1 cursor-pointer"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                    <input
                      aria-label={`Stock for size ${sz.label}`}
                      type="number"
                      min={0}
                      value={sz.stock}
                      onChange={(e) => {
                        const next = [...editing.sizes];
                        next[idx] = {
                          ...sz,
                          stock: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0),
                        };
                        setEditing({ ...editing, sizes: next });
                      }}
                      className="w-full px-3 py-1.5 rounded-full bg-[#1F2020] text-xs text-white outline-none tabular-nums"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Colourways & Image URLs/Paths (Firebase Storage disabled) */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#E0C0AF]">Colourways &amp; Photos</p>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      colourways: [...editing.colourways, { name: 'New Shade', hex: '#2A2A2A', images: [] }],
                    })
                  }
                  className="text-xs text-[#FF7A00] hover:underline cursor-pointer"
                >
                  + Add Colourway
                </button>
              </div>

              {editing.colourways.map((cw, cwIdx) => (
                <div key={cwIdx} className="rounded-2xl bg-[#121212] border border-white/10 p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      aria-label={`Colourway name ${cwIdx + 1}`}
                      value={cw.name}
                      onChange={(e) => {
                        const next = [...editing.colourways];
                        next[cwIdx] = { ...cw, name: e.target.value };
                        setEditing({ ...editing, colourways: next });
                      }}
                      placeholder="Colour Name"
                      className="flex-1 min-w-[140px] px-3 py-2 rounded-full bg-[#1F2020] text-xs text-white outline-none"
                    />
                    <input
                      aria-label={`Colourway hex ${cwIdx + 1}`}
                      type="color"
                      value={cw.hex}
                      onChange={(e) => {
                        const next = [...editing.colourways];
                        next[cwIdx] = { ...cw, hex: e.target.value };
                        setEditing({ ...editing, colourways: next });
                      }}
                      className="w-10 h-9 rounded-lg bg-transparent cursor-pointer"
                    />
                    {editing.colourways.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            colourways: editing.colourways.filter((_, idx) => idx !== cwIdx),
                          })
                        }
                        className="text-xs text-red-400 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      aria-label={`Paste image URL or path for ${cw.name}`}
                      type="text"
                      value={colourUrlInputs[cwIdx] || ''}
                      onChange={(e) =>
                        setColourUrlInputs((prev) => ({ ...prev, [cwIdx]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl(cwIdx);
                        }
                      }}
                      placeholder="Image URL or path (https://... or /assets/rack/rack_obsidian.jpg)"
                      className="flex-1 px-3 py-2 rounded-full bg-[#1F2020] text-xs text-white placeholder:text-white/35 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddImageUrl(cwIdx)}
                      className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-[#E0C0AF]/70 mr-1">Studio Photos:</span>
                    {STUDIO_ASSET_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleAddImageUrl(cwIdx, preset.url)}
                        className="px-2.5 py-1 rounded-full bg-[#1F2020] hover:bg-[#FF7A00]/20 border border-white/10 hover:border-[#FF7A00]/40 text-[11px] text-[#E0C0AF] hover:text-white cursor-pointer"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>

                  {cw.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {cw.images.map((url, imgIdx) => (
                        <div key={imgIdx} className="relative w-16 h-20 rounded-xl overflow-hidden bg-[#1F2020]">
                          <img src={url} alt={cw.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            aria-label="Remove photo"
                            onClick={() => {
                              const next = [...editing.colourways];
                              next[cwIdx] = {
                                ...cw,
                                images: cw.images.filter((_, i) => i !== imgIdx),
                              };
                              setEditing({ ...editing, colourways: next });
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white text-[10px] flex items-center justify-center cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Status, Garment Rack Placement, Featured & SEO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div className="space-y-1">
                <label htmlFor="prod-status" className="block text-xs text-[#E0C0AF]">Publish Status</label>
                <select
                  id="prod-status"
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as 'draft' | 'published' })}
                  className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-sm text-white outline-none"
                >
                  <option value="draft">Draft (Hidden from Storefront)</option>
                  <option value="published">Published (Live)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="prod-rack-order" className="block text-xs text-[#E0C0AF]">
                  Garment Rack Position (0 = first)
                </label>
                <input
                  id="prod-rack-order"
                  type="number"
                  min={0}
                  max={999}
                  value={editing.rackOrder}
                  onChange={(e) => setEditing({ ...editing, rackOrder: e.target.value })}
                  placeholder="Auto (leave empty or enter 0, 1, 2...)"
                  className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-sm text-white outline-none tabular-nums"
                />
              </div>

              <label className="flex items-center gap-3 pt-1 cursor-pointer text-sm text-white">
                <input
                  type="checkbox"
                  checked={editing.showOnRack}
                  onChange={(e) => setEditing({ ...editing, showOnRack: e.target.checked })}
                  className="w-4 h-4 accent-[#FF7A00]"
                />
                <span>Hang on Homepage Garment Rack (when Published)</span>
              </label>

              <label className="flex items-center gap-3 pt-1 cursor-pointer text-sm text-white">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  className="w-4 h-4 accent-[#FF7A00]"
                />
                <span>Featured Product</span>
              </label>

              <div className="space-y-1">
                <label htmlFor="prod-seot" className="block text-xs text-[#E0C0AF]">SEO Title</label>
                <input
                  id="prod-seot"
                  value={editing.seoTitle}
                  onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-sm text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prod-seod" className="block text-xs text-[#E0C0AF]">SEO Description</label>
                <input
                  id="prod-seod"
                  value={editing.seoDescription}
                  onChange={(e) => setEditing({ ...editing, seoDescription: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-6 py-2.5 rounded-full border border-white/15 text-xs font-semibold text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-7 py-2.5 rounded-full bg-[#FF7A00] hover:bg-[#E65C00] text-[#121212] text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Hoodie'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Product"
        description={`Are you sure you want to permanently delete "${deleteTarget?.name}"?`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
