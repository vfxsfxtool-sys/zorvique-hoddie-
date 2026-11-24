import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { deleteSubscriber } from '../data/adminApi';
import type { Subscriber } from '../data/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { subscribersToCsv, timestampToMs } from '../utils/adminLogic';

export function SubscribersPage() {
  const { subscribers, refreshAll } = useAdminData();
  const [deleteTarget, setDeleteTarget] = useState<Subscriber | null>(null);

  const handleExport = () => {
    const csv = subscribersToCsv(subscribers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zorvique-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Newsletter Subscribers</h1>
          <p className="text-xs text-[#E0C0AF]">{subscribers.length} inner circle signups</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={subscribers.length === 0}
          className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white inline-flex items-center gap-2 disabled:opacity-40 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6">
        {subscribers.length === 0 ? (
          <p className="text-sm text-[#E0C0AF]">No subscribers yet.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {subscribers.map((sub) => {
              const ms = timestampToMs(sub.createdAt);
              return (
                <li key={sub.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-white font-medium">{sub.email}</p>
                    <p className="text-xs text-[#E0C0AF] tabular-nums">
                      {ms ? new Date(ms).toLocaleString('en-PK') : 'Pending timestamp'}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete subscriber ${sub.email}`}
                    onClick={() => setDeleteTarget(sub)}
                    className="p-2 rounded-full bg-red-500/10 text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove Subscriber"
        description={`Remove "${deleteTarget?.email}" from the newsletter list?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteSubscriber(deleteTarget.id);
          setDeleteTarget(null);
          await refreshAll();
        }}
      />
    </div>
  );
}
