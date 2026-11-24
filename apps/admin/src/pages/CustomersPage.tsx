import { useMemo, useState } from 'react';
import { Download, Mail, MessageCircle, Search } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import {
  customersToCsv,
  deriveCustomerDirectory,
  formatPKR,
  formatWhatsAppOutreachUrl,
} from '../utils/adminLogic';

export function CustomersPage() {
  const { orders, subscribers } = useAdminData();
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<'all' | 'buyers' | 'subscribers'>('all');

  const directory = useMemo(
    () => deriveCustomerDirectory(orders, subscribers),
    [orders, subscribers]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return directory.filter((c) => {
      if (segment === 'buyers' && c.ordersCount === 0) return false;
      if (segment === 'subscribers' && !c.subscribed) return false;
      if (!q) return true;
      return `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(q);
    });
  }, [directory, search, segment]);

  const buyersCount = useMemo(
    () => directory.filter((c) => c.ordersCount > 0).length,
    [directory]
  );
  const totalLtv = useMemo(
    () => directory.reduce((sum, c) => sum + c.totalSpent, 0),
    [directory]
  );

  const handleExport = () => {
    const csv = customersToCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zorvique-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Customers</h1>
          <p className="text-xs text-[#E0C0AF]">
            {directory.length} total contacts · {buyersCount} active buyers · {formatPKR(totalLtv)} lifetime volume
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white inline-flex items-center gap-2 disabled:opacity-40 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search & Segment Bar */}
      <div className="rounded-2xl bg-[#1F2020] border border-white/[0.06] p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#E0C0AF]/60 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search customers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, Gmail, phone, or city..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#151515] border border-white/10 text-xs text-white outline-none focus:border-[#FF7A00]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#151515] border border-white/10">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'buyers', label: 'Buyers' },
              { id: 'subscribers', label: 'Subscribers' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSegment(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                segment === tab.id ? 'bg-[#FF7A00] text-[#121212] font-semibold' : 'text-[#E0C0AF] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#1F2020] border border-white/[0.06] p-6">
        {filtered.length === 0 ? (
          <p className="text-sm text-[#E0C0AF] py-6">No customer records match your filter yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead>
                <tr className="border-b border-white/10 text-[#E0C0AF]">
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Contact</th>
                  <th className="py-3 pr-4">City</th>
                  <th className="py-3 pr-4 text-right">Orders</th>
                  <th className="py-3 pr-4 text-right">Total Spent</th>
                  <th className="py-3 text-right">Reach Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.map((c) => (
                  <tr key={c.key} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="text-[11px] text-[#E0C0AF]">
                        {c.ordersCount > 0 ? 'Buyer' : 'Subscriber'}
                        {c.subscribed ? ' · Newsletter' : ''}
                      </p>
                    </td>
                    <td className="py-3.5 pr-4 text-[#E4E2E1]">
                      <p>{c.email || '—'}</p>
                      {c.phone && <p className="text-[11px] text-[#E0C0AF]">{c.phone}</p>}
                    </td>
                    <td className="py-3.5 pr-4 text-[#E0C0AF]">{c.city || '—'}</td>
                    <td className="py-3.5 pr-4 text-right text-white font-medium">{c.ordersCount}</td>
                    <td className="py-3.5 pr-4 text-right font-semibold text-white">
                      {formatPKR(c.totalSpent)}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {c.phone && (
                          <a
                            href={formatWhatsAppOutreachUrl(
                              c.phone,
                              `Assalam-o-Alaikum ${c.name}, reaching out from Zorvique Studio regarding your order.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Message ${c.name} on WhatsApp`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#25D366]/15 border border-[#25D366]/35 text-[#4ADE80] hover:bg-[#25D366]/25 font-medium"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            aria-label={`Email ${c.name}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Email</span>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
