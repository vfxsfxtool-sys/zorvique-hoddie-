import { useState } from 'react';
import { Check, Copy, ImagePlus, Sparkles, Trash2 } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import {
  deleteMediaRecord,
  importStudioMediaPresets,
  registerMediaUrl,
} from '../data/adminApi';
import type { MediaAsset } from '../data/types';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function MediaLibraryPage() {
  const { loading, media, refreshAll } = useAdminData();
  const [assetName, setAssetName] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [importingPresets, setImportingPresets] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);

  const handleAddMediaUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await registerMediaUrl({ name: assetName, url: assetUrl });
      setAssetName('');
      setAssetUrl('');
      setNotice('Image path or URL saved to Media Library.');
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save media record.');
    } finally {
      setSaving(false);
    }
  };

  const handleImportPresets = async () => {
    setImportingPresets(true);
    setError(null);
    setNotice(null);
    try {
      const added = await importStudioMediaPresets(media);
      setNotice(
        added > 0
          ? `Registered ${added} studio hoodie image path${added === 1 ? '' : 's'} into Firestore.`
          : 'All 6 studio hoodie paths are already registered.'
      );
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register studio photos.');
    } finally {
      setImportingPresets(false);
    }
  };

  const handleCopy = async (asset: MediaAsset) => {
    await navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Media Library</h1>
          <p className="text-xs text-[#E0C0AF]">
            Save static image paths (/assets/rack/rack_*.jpg) or external HTTPS image &amp; video URLs in Firestore
          </p>
        </div>

        <button
          type="button"
          disabled={importingPresets}
          onClick={() => void handleImportPresets()}
          className="min-h-[44px] px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-[#FF7A00]" />
          <span>{importingPresets ? 'Registering...' : 'Add 6 Studio Hoodie Photos'}</span>
        </button>
      </div>

      <form
        onSubmit={handleAddMediaUrl}
        className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
      >
        <div className="md:col-span-4 space-y-1">
          <label htmlFor="media-name" className="block text-xs text-[#E0C0AF]">
            Asset Label (Optional)
          </label>
          <input
            id="media-name"
            type="text"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="e.g. Midnight Velvet Hoodie"
            className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none focus:border-[#FF7A00]"
          />
        </div>
        <div className="md:col-span-6 space-y-1">
          <label htmlFor="media-url" className="block text-xs text-[#E0C0AF]">
            Image / Video URL or Static Path
          </label>
          <input
            id="media-url"
            type="text"
            required
            value={assetUrl}
            onChange={(e) => setAssetUrl(e.target.value)}
            placeholder="https://... or /assets/rack/rack_obsidian.jpg"
            className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none focus:border-[#FF7A00]"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-[42px] px-5 py-2.5 rounded-full bg-[#FF7A00] hover:bg-[#E65C00] text-[#121212] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ImagePlus className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save URL'}</span>
          </button>
        </div>
      </form>

      {notice && (
        <div role="status" className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 text-xs text-emerald-200">
          {notice}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-2xl bg-red-500/15 border border-red-500/30 p-4 text-xs text-red-200">
          {error}
        </div>
      )}

      {loading && media.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aspect-square rounded-[24px] bg-[#1F2020] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-12 text-center">
          <p className="text-sm text-[#E0C0AF]">
            No media records saved yet. Paste an HTTPS image URL above or click &ldquo;Add 6 Studio Hoodie Photos&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {media.map((asset) => (
            <article key={asset.id} className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] overflow-hidden flex flex-col">
              <div className="aspect-square bg-[#151515]">
                {asset.contentType.startsWith('video/') ? (
                  <video src={asset.url} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={asset.url} alt={asset.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs font-medium text-white truncate">{asset.name}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopy(asset)}
                    className="flex-1 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === asset.id ? 'Copied' : 'Copy URL'}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${asset.name}`}
                    onClick={() => setDeleteTarget(asset)}
                    className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Media Record"
        description={`Remove "${deleteTarget?.name}" from the Media Library?`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          setError(null);
          try {
            await deleteMediaRecord(deleteTarget);
            setDeleteTarget(null);
            await refreshAll();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to delete media record.');
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
