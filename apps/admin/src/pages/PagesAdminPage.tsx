import { useState } from 'react';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { deletePage, savePage } from '../data/adminApi';
import type { CmsPage } from '../data/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { slugify } from '../utils/adminLogic';

export function PagesAdminPage() {
  const { pages, refreshAll } = useAdminData();
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visible, setVisible] = useState(true);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CmsPage | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = slugify(slug || title);
    if (!cleanSlug || !title.trim()) return;
    setSaving(true);
    try {
      await savePage({ slug: cleanSlug, title: title.trim(), body, visible });
      setSlug('');
      setTitle('');
      setBody('');
      setVisible(true);
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Policy &amp; Custom Pages</h1>
        <p className="text-xs text-[#E0C0AF]">Author markdown pages rendered at /page/:slug on the storefront</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Page Editor</h2>
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs text-white cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{preview ? 'Edit Markdown' : 'Preview'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              aria-label="Page title"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug) setSlug(slugify(e.target.value));
              }}
              placeholder="Page Title (e.g. Privacy Policy)"
              className="px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
            <input
              aria-label="Page slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="privacy-policy"
              className="px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
          </div>

          {preview ? (
            <div className="min-h-[220px] rounded-2xl bg-[#151515] border border-white/10 p-4 space-y-2 text-xs text-[#E4E2E1] whitespace-pre-wrap">
              {body || 'Nothing to preview yet.'}
            </div>
          ) : (
            <textarea
              aria-label="Markdown content"
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="# Heading&#10;&#10;Write markdown content..."
              className="w-full px-4 py-3 rounded-2xl bg-[#151515] border border-white/10 text-xs font-mono text-white outline-none"
            />
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
                className="accent-[#FF7A00]"
              />
              <span>Visible on Storefront</span>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-[#FF7A00] text-[#121212] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Page'}</span>
            </button>
          </div>
        </form>

        <div className="lg:col-span-5 rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold text-white">Published &amp; Draft Pages</h2>
          {pages.length === 0 ? (
            <p className="text-sm text-[#E0C0AF]">No CMS pages created yet.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {pages.map((pg) => (
                <li key={pg.slug} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{pg.title}</p>
                    <p className="text-xs text-[#E0C0AF]">
                      /page/{pg.slug} · {pg.visible ? 'Visible' : 'Hidden'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSlug(pg.slug);
                        setTitle(pg.title);
                        setBody(pg.body);
                        setVisible(pg.visible);
                      }}
                      className="px-3 py-1.5 rounded-full bg-white/10 text-xs text-white cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete page ${pg.title}`}
                      onClick={() => setDeleteTarget(pg)}
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Page"
        description={`Delete page "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deletePage(deleteTarget.slug);
          setDeleteTarget(null);
          await refreshAll();
        }}
      />
    </div>
  );
}
