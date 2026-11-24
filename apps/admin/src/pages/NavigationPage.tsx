import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { saveSiteSettings } from '../data/adminApi';
import type { SiteSettings } from '../data/types';

export function NavigationPage() {
  const { settings, refreshAll } = useAdminData();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    try {
      await saveSiteSettings(draft);
      setSavedNotice(true);
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Navigation, Footer &amp; Socials</h1>
          <p className="text-xs text-[#E0C0AF]">Edit storefront top bar links, footer links, announcement bar, and social URLs</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-full bg-[#FF7A00] text-[#121212] text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Navigation'}
        </button>
      </div>

      {savedNotice && (
        <p className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-200">
          Navigation and footer settings updated in Firestore.
        </p>
      )}

      <div className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-2">
        <label htmlFor="nav-announcement" className="block text-xs font-semibold uppercase tracking-wider text-[#E0C0AF]">
          Announcement Bar (leave blank to hide)
        </label>
        <input
          id="nav-announcement"
          value={draft.announcement}
          onChange={(e) => setDraft({ ...draft, announcement: e.target.value })}
          placeholder="e.g. Free Express Shipping across Pakistan on orders above PKR 12,000"
          className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-sm text-white outline-none focus:border-[#FF7A00]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Header Nav Links</h2>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, nav: [...draft.nav, { label: 'Link', href: '/shop' }] })}
              className="text-xs text-[#FF7A00] inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {draft.nav.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                aria-label={`Nav label ${idx + 1}`}
                value={item.label}
                onChange={(e) => {
                  const next = [...draft.nav];
                  next[idx] = { ...item, label: e.target.value };
                  setDraft({ ...draft, nav: next });
                }}
                className="flex-1 px-3 py-2 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
              />
              <input
                aria-label={`Nav href ${idx + 1}`}
                value={item.href}
                onChange={(e) => {
                  const next = [...draft.nav];
                  next[idx] = { ...item, href: e.target.value };
                  setDraft({ ...draft, nav: next });
                }}
                className="flex-1 px-3 py-2 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
              />
              <button
                type="button"
                aria-label={`Remove nav item ${item.label}`}
                onClick={() => setDraft({ ...draft, nav: draft.nav.filter((_, i) => i !== idx) })}
                className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Footer Links</h2>
            <button
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  footerLinks: [...draft.footerLinks, { label: 'Policy', href: '/page/privacy-policy' }],
                })
              }
              className="text-xs text-[#FF7A00] inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {draft.footerLinks.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                aria-label={`Footer label ${idx + 1}`}
                value={item.label}
                onChange={(e) => {
                  const next = [...draft.footerLinks];
                  next[idx] = { ...item, label: e.target.value };
                  setDraft({ ...draft, footerLinks: next });
                }}
                className="flex-1 px-3 py-2 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
              />
              <input
                aria-label={`Footer href ${idx + 1}`}
                value={item.href}
                onChange={(e) => {
                  const next = [...draft.footerLinks];
                  next[idx] = { ...item, href: e.target.value };
                  setDraft({ ...draft, footerLinks: next });
                }}
                className="flex-1 px-3 py-2 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
              />
              <button
                type="button"
                aria-label={`Remove footer item ${item.label}`}
                onClick={() =>
                  setDraft({ ...draft, footerLinks: draft.footerLinks.filter((_, i) => i !== idx) })
                }
                className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-white">Social Profiles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['instagram', 'facebook', 'tiktok', 'whatsapp'] as const).map((key) => (
            <div key={key} className="space-y-1">
              <label htmlFor={`social-${key}`} className="block text-xs capitalize text-[#E0C0AF]">
                {key === 'whatsapp' ? 'WhatsApp Helpline (Number or URL)' : `${key} URL`}
              </label>
              <input
                id={`social-${key}`}
                value={draft.social[key]}
                onChange={(e) =>
                  setDraft({ ...draft, social: { ...draft.social, [key]: e.target.value } })
                }
                placeholder={
                  key === 'whatsapp'
                    ? '03084540977 or https://wa.me/923084540977'
                    : `https://${key}.com/...`
                }
                className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
