import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { deleteDiscountCode, saveDiscountCode } from '../data/adminApi';
import type { DiscountCode } from '../data/types';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function DiscountsPage() {
  const { discountCodes, refreshAll } = useAdminData();
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState(10);
  const [usageLimit, setUsageLimit] = useState(100);
  const [expiresAt, setExpiresAt] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DiscountCode | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{2,40}$/.test(clean)) return;
    setSaving(true);
    try {
      const existing = discountCodes.find((d) => d.code === clean);
      await saveDiscountCode({
        code: clean,
        percent: Math.max(1, Math.min(100, Number(percent) || 10)),
        usageLimit: Math.max(0, Number(usageLimit) || 0),
        usedCount: existing?.usedCount || 0,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        active,
      });
      setCode('');
      setExpiresAt('');
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Discount Codes</h1>
        <p className="text-xs text-[#E0C0AF]">Create and manage promo codes validated at checkout</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSave}
          className="lg:col-span-5 rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-semibold text-white">Create / Update Code</h2>
          <div className="space-y-1">
            <label htmlFor="dc-code" className="block text-xs text-[#E0C0AF]">Code (Uppercase)</label>
            <input
              id="dc-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ZORVIQUE10"
              className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white uppercase outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="dc-pct" className="block text-xs text-[#E0C0AF]">Percent Off (%)</label>
              <input
                id="dc-pct"
                type="number"
                min={1}
                max={100}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="dc-limit" className="block text-xs text-[#E0C0AF]">Usage Limit (0 = ∞)</label>
              <input
                id="dc-limit"
                type="number"
                min={0}
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="dc-exp" className="block text-xs text-[#E0C0AF]">Expiry Date (Optional)</label>
            <input
              id="dc-exp"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-xs text-white outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="accent-[#FF7A00]"
            />
            <span>Active</span>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-full bg-[#FF7A00] text-[#121212] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Discount Code'}</span>
          </button>
        </form>

        <div className="lg:col-span-7 rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6">
          {discountCodes.length === 0 ? (
            <p className="text-sm text-[#E0C0AF]">No discount codes created yet.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {discountCodes.map((d) => (
                <li key={d.code} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {d.code} · {d.percent}% Off{' '}
                      <span className={d.active ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>
                        ({d.active ? 'Active' : 'Inactive'})
                      </span>
                    </p>
                    <p className="text-xs text-[#E0C0AF] tabular-nums">
                      Used {d.usedCount} / {d.usageLimit === 0 ? 'Unlimited' : d.usageLimit}
                      {d.expiresAt ? ` · Expires ${d.expiresAt.slice(0, 10)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCode(d.code);
                        setPercent(d.percent);
                        setUsageLimit(d.usageLimit);
                        setExpiresAt(d.expiresAt ? d.expiresAt.slice(0, 10) : '');
                        setActive(d.active);
                      }}
                      className="px-3 py-1.5 rounded-full bg-white/10 text-xs text-white cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete discount code ${d.code}`}
                      onClick={() => setDeleteTarget(d)}
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
        title="Delete Discount Code"
        description={`Delete promo code "${deleteTarget?.code}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteDiscountCode(deleteTarget.code);
          setDeleteTarget(null);
          await refreshAll();
        }}
      />
    </div>
  );
}
