import { useEffect, useState } from 'react';
import { Database, ExternalLink, Plus, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAdminData } from '../context/AdminDataContext';
import { FIREBASE_PROJECT_ID } from '../data/firebase';
import {
  addAdminEmail,
  deleteAllSampleData,
  loadSampleData,
  removeAdminEmail,
  saveSiteSettings,
} from '../data/adminApi';
import type { SiteSettings } from '../data/types';
import {
  OWNER_EMAIL,
  buildFirebaseAuthUsersUrl,
  isOwnerEmail,
  validateNewMemberEmail,
} from '../utils/adminLogic';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function SettingsPage() {
  const { user, isOwner } = useAuth();
  const { settings, admins, refreshAll } = useAdminData();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [memberBusy, setMemberBusy] = useState(false);
  const [removeAdminTarget, setRemoveAdminTarget] = useState<string | null>(null);
  const [confirmClearSample, setConfirmClearSample] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);

  const memberList = admins.filter((adm) => !isOwnerEmail(adm.email));
  const firebaseAuthUsersUrl = buildFirebaseAuthUsersUrl(FIREBASE_PROJECT_ID);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    setErrorMsg(null);
    try {
      await saveSiteSettings(draft);
      setNotice('Storefront settings saved to Firestore.');
      await refreshAll();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setErrorMsg(null);
    const check = validateNewMemberEmail(newAdminEmail);
    if (check.ok === false) {
      setErrorMsg(check.reason);
      return;
    }
    setMemberBusy(true);
    try {
      await addAdminEmail(check.email);
      setNewAdminEmail('');
      setNotice(
        `Added ${check.email} as a Team Member. Make sure their email login is also created under Firebase Authentication → Users.`
      );
      await refreshAll();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to add team member.');
    } finally {
      setMemberBusy(false);
    }
  };

  const handleLoadSample = async () => {
    setSampleBusy(true);
    setNotice(null);
    setErrorMsg(null);
    try {
      await loadSampleData();
      setNotice('Sample products, hero slides, testimonials, pages, and promo code ZORVIQUE10 loaded.');
      await refreshAll();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load sample data.');
    } finally {
      setSampleBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Store Settings</h1>
          <p className="text-xs text-[#E0C0AF]">Brand, palette, Pakistan shipping rates, manual payment instructions, SEO, and admin access</p>
        </div>
      </div>

      {notice && (
        <div role="status" className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 text-xs text-emerald-200">
          {notice}
        </div>
      )}
      {errorMsg && (
        <div role="alert" className="rounded-2xl bg-red-500/15 border border-red-500/30 p-4 text-xs text-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand & Colours */}
          <section className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">Brand &amp; Theme Colours</h2>
            <div className="space-y-1">
              <label htmlFor="set-brand" className="block text-xs text-[#E0C0AF]">Brand Name</label>
              <input
                id="set-brand"
                value={draft.brandName}
                onChange={(e) => setDraft({ ...draft, brandName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-sm text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="set-logo" className="block text-xs text-[#E0C0AF]">Logo URL</label>
              <input
                id="set-logo"
                type="text"
                value={draft.logoUrl}
                onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
                placeholder="https://... or /assets/rack/rack_obsidian.jpg"
                className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="set-whatsapp" className="block text-xs text-[#E0C0AF]">
                WhatsApp Helpline Number or Link
              </label>
              <input
                id="set-whatsapp"
                value={draft.social.whatsapp}
                onChange={(e) =>
                  setDraft({ ...draft, social: { ...draft.social, whatsapp: e.target.value } })
                }
                placeholder="03084540977 or https://wa.me/923084540977"
                className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {(['primary', 'background', 'surface'] as const).map((key) => (
                <div key={key} className="space-y-1">
                  <label htmlFor={`clr-${key}`} className="block text-xs capitalize text-[#E0C0AF]">
                    {key}
                  </label>
                  <input
                    id={`clr-${key}`}
                    type="color"
                    value={draft.colors[key]}
                    onChange={(e) =>
                      setDraft({ ...draft, colors: { ...draft.colors, [key]: e.target.value } })
                    }
                    className="w-full h-10 rounded-xl bg-transparent cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* SEO Defaults */}
          <section className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">SEO Defaults</h2>
            <div className="space-y-1">
              <label htmlFor="seo-title" className="block text-xs text-[#E0C0AF]">Default Title</label>
              <input
                id="seo-title"
                value={draft.seo.title}
                onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, title: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="seo-desc" className="block text-xs text-[#E0C0AF]">Meta Description</label>
              <textarea
                id="seo-desc"
                rows={3}
                value={draft.seo.description}
                onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, description: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#151515] border border-white/10 text-xs text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="seo-og" className="block text-xs text-[#E0C0AF]">OG Image URL</label>
              <input
                id="seo-og"
                value={draft.seo.ogImage}
                onChange={(e) => setDraft({ ...draft, seo: { ...draft.seo, ogImage: e.target.value } })}
                className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
              />
            </div>
          </section>
        </div>

        {/* Payments & Shipping */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">Payment Methods (Pakistan)</h2>

            <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
              <input
                type="checkbox"
                checked={draft.payments.cod.enabled}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    payments: { ...draft.payments, cod: { enabled: e.target.checked } },
                  })
                }
                className="accent-[#FF7A00]"
              />
              <span>Enable Cash on Delivery (COD)</span>
            </label>

            {(['jazzcash', 'easypaisa'] as const).map((method) => (
              <div key={method} className="rounded-2xl bg-[#151515] border border-white/10 p-4 space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-semibold capitalize text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.payments[method].enabled}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        payments: {
                          ...draft.payments,
                          [method]: { ...draft.payments[method], enabled: e.target.checked },
                        },
                      })
                    }
                    className="accent-[#FF7A00]"
                  />
                  <span>{method === 'jazzcash' ? 'JazzCash Manual Transfer' : 'EasyPaisa Manual Transfer'}</span>
                </label>
                <input
                  aria-label={`${method} account`}
                  value={draft.payments[method].account}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      payments: {
                        ...draft.payments,
                        [method]: { ...draft.payments[method], account: e.target.value },
                      },
                    })
                  }
                  placeholder="Account Number & Title"
                  className="w-full px-3 py-2 rounded-full bg-[#1F2020] text-xs text-white outline-none"
                />
                <input
                  aria-label={`${method} instructions`}
                  value={draft.payments[method].instructions}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      payments: {
                        ...draft.payments,
                        [method]: { ...draft.payments[method], instructions: e.target.value },
                      },
                    })
                  }
                  placeholder="Instructions for customer"
                  className="w-full px-3 py-2 rounded-full bg-[#1F2020] text-xs text-white outline-none"
                />
              </div>
            ))}
          </section>

          <section className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">Shipping Rules (PKR)</h2>
            <div className="space-y-1">
              <label htmlFor="ship-free" className="block text-xs text-[#E0C0AF]">
                Free Shipping Threshold (PKR)
              </label>
              <input
                id="ship-free"
                type="number"
                min={0}
                value={draft.shipping.freeThreshold}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    shipping: { ...draft.shipping, freeThreshold: Math.max(0, Number(e.target.value) || 0) },
                  })
                }
                className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(draft.shipping.flatByCity).map(([cityName, fee]) => (
                <div key={cityName} className="flex items-center justify-between gap-2 rounded-full bg-[#151515] px-3 py-1.5 border border-white/10">
                  <span className="text-xs text-[#E0C0AF]">{cityName}</span>
                  <input
                    aria-label={`Shipping fee for ${cityName}`}
                    type="number"
                    min={0}
                    value={fee}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        shipping: {
                          ...draft.shipping,
                          flatByCity: {
                            ...draft.shipping.flatByCity,
                            [cityName]: Math.max(0, Number(e.target.value) || 0),
                          },
                        },
                      })
                    }
                    className="w-20 bg-transparent text-right text-xs font-semibold text-white outline-none tabular-nums"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-3 rounded-full bg-[#FF7A00] hover:bg-[#E65C00] text-[#121212] text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving Settings...' : 'Save All Settings'}
          </button>
        </div>
      </form>

      {/* Owner-Only Controls */}
      {isOwner && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-white/10">
          <section className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  Team Access: Admin &amp; Members
                </h2>
                <p className="text-xs text-[#E0C0AF] mt-1">
                  Your account is the sole Store Admin. Only you can add future users—and anyone added joins strictly as a Member.
                </p>
              </div>
              <a
                href={firebaseAuthUsersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-[#E0C0AF] hover:text-white transition-colors"
              >
                <span>Firebase Users</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="rounded-2xl bg-[#151515] border border-[#FF7A00]/30 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldCheck className="w-4 h-4 text-[#FF7A00] shrink-0" />
                <span className="text-xs font-medium text-white truncate">
                  {user?.email || OWNER_EMAIL}
                </span>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#FF7A00]/15 border border-[#FF7A00]/40 text-[11px] font-semibold text-[#FF7A00]">
                Admin (Owner)
              </span>
            </div>

            <form onSubmit={handleAddAdmin} className="flex gap-2">
              <label htmlFor="new-admin-email" className="sr-only">Member email</label>
              <input
                id="new-admin-email"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="member@zorvique.pk"
                className="flex-1 px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none focus:border-[#FF7A00]"
              />
              <button
                type="submit"
                disabled={memberBusy}
                className="px-5 py-2.5 rounded-full bg-[#FF7A00] hover:bg-[#E65C00] text-[#121212] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{memberBusy ? 'Adding...' : 'Add Member'}</span>
              </button>
            </form>

            {memberList.length === 0 ? (
              <p className="text-xs text-[#E0C0AF]">
                No members added yet. Unapproved emails cannot register or sign into this panel.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {memberList.map((adm) => (
                  <li key={adm.email} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserCheck className="w-3.5 h-3.5 text-[#E0C0AF] shrink-0" />
                      <span className="text-white truncate">{adm.email}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-medium text-[#E0C0AF]">
                        Member
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove member ${adm.email}`}
                        onClick={() => setRemoveAdminTarget(adm.email)}
                        className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#FF7A00]" />
              <h2 className="font-display text-lg font-semibold text-white">Sample Storefront Data (Owner Only)</h2>
            </div>
            <p className="text-xs text-[#E0C0AF] leading-relaxed">
              Populates 4 clearly labelled SAMPLE hoodies (with tinted SVG placeholders), 3 hero slides, 3 testimonials (isSample: true), default policies, and promo code ZORVIQUE10 for testing.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                disabled={sampleBusy}
                onClick={() => void handleLoadSample()}
                className="px-5 py-2.5 rounded-full bg-[#F5B082] hover:bg-[#FF7A00] text-[#121212] text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {sampleBusy ? 'Working...' : 'Load sample data'}
              </button>
              <button
                type="button"
                disabled={sampleBusy}
                onClick={() => setConfirmClearSample(true)}
                className="px-5 py-2.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/25 disabled:opacity-50 cursor-pointer"
              >
                Delete all sample data
              </button>
            </div>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removeAdminTarget)}
        title="Revoke Member Access"
        description={`Remove "${removeAdminTarget}" from team Members? They will no longer be able to access the Zorvique console.`}
        onCancel={() => setRemoveAdminTarget(null)}
        onConfirm={async () => {
          if (!removeAdminTarget) return;
          try {
            await removeAdminEmail(removeAdminTarget);
            setNotice(`Removed ${removeAdminTarget} from team Members.`);
            setRemoveAdminTarget(null);
            await refreshAll();
          } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Unable to remove member.');
            setRemoveAdminTarget(null);
          }
        }}
      />

      <ConfirmDialog
        open={confirmClearSample}
        title="Delete All Sample Data"
        description="This permanently deletes every product, hero slide, collection, and testimonial marked with isSample: true."
        confirmLabel="Delete Sample Data"
        loading={sampleBusy}
        onCancel={() => setConfirmClearSample(false)}
        onConfirm={async () => {
          setSampleBusy(true);
          try {
            const count = await deleteAllSampleData();
            setConfirmClearSample(false);
            setNotice(`Removed ${count} sample document(s).`);
            await refreshAll();
          } finally {
            setSampleBusy(false);
          }
        }}
      />
    </div>
  );
}
