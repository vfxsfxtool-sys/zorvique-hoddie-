import { useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { deleteCollection, saveCollection } from '../data/adminApi';
import type { Collection } from '../data/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { slugify } from '../utils/adminLogic';

export function CollectionsPage() {
  const { collections, refreshAll } = useAdminData();
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [order, setOrder] = useState(0);
  const [visible, setVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setEditingId(undefined);
    setName('');
    setSlug('');
    setOrder(collections.length);
    setVisible(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await saveCollection(
        {
          name: name.trim(),
          slug: slugify(slug || name),
          order: Number(order) || 0,
          visible,
        },
        editingId
      );
      resetForm();
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Collections</h1>
        <p className="text-xs text-[#E0C0AF]">Organize storefront filter tabs and capsule drops</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSave}
          className="lg:col-span-5 rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-semibold text-white">
            {editingId ? 'Edit Collection' : 'Add Collection'}
          </h2>
          <div className="space-y-1">
            <label htmlFor="col-name" className="block text-xs text-[#E0C0AF]">Name</label>
            <input
              id="col-name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingId) setSlug(slugify(e.target.value));
              }}
              className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-sm text-white outline-none"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="col-slug" className="block text-xs text-[#E0C0AF]">Slug</label>
            <input
              id="col-slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-sm text-white outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="col-order" className="block text-xs text-[#E0C0AF]">Sort Order</label>
              <input
                id="col-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-sm text-white outline-none"
              />
            </div>
            <label className="flex items-center gap-2 pt-6 text-xs text-white cursor-pointer">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
                className="accent-[#FF7A00]"
              />
              <span>Visible</span>
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-full bg-[#FF7A00] text-[#121212] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-full border border-white/15 text-xs text-white cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-7 rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6">
          {collections.length === 0 ? (
            <p className="text-sm text-[#E0C0AF]">No collections created yet.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {collections.map((c) => (
                <li key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {c.name}{' '}
                      {!c.visible && <span className="text-[11px] text-[#E0C0AF]">(Hidden)</span>}
                    </p>
                    <p className="text-xs text-[#E0C0AF]">
                      /{c.slug} · Order {c.order}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Edit ${c.name}`}
                      onClick={() => {
                        setEditingId(c.id);
                        setName(c.name);
                        setSlug(c.slug);
                        setOrder(c.order);
                        setVisible(c.visible);
                      }}
                      className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${c.name}`}
                      onClick={() => setDeleteTarget(c)}
                      className="w-9 h-9 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center cursor-pointer"
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Collection"
        description={`Delete collection "${deleteTarget?.name}"?`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          try {
            await deleteCollection(deleteTarget.id);
            setDeleteTarget(null);
            await refreshAll();
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
