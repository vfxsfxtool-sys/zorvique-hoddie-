import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Banknote, MessageCircle, Package, ShoppingBag, Sparkles, Tag, UserCheck } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { importStudioCatalog, saveDiscountCode } from '../data/adminApi';
import { computeOverviewMetrics, deriveCustomerDirectory, formatPKR } from '../utils/adminLogic';

export function OverviewPage() {
  const { loading, orders, products, subscribers, settings, refreshAll } = useAdminData();
  const [days, setDays] = useState<7 | 30>(7);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Quick discount code creator state
  const [promoCode, setPromoCode] = useState('');
  const [promoPercent, setPromoPercent] = useState(15);
  const [promoLimit, setPromoLimit] = useState(100);
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);

  const metrics = useMemo(
    () => computeOverviewMetrics(orders, products, days),
    [orders, products, days]
  );
  const customersCount = useMemo(
    () => deriveCustomerDirectory(orders, subscribers).length,
    [orders, subscribers]
  );

  const handleImportCatalog = async () => {
    setImporting(true);
    setImportError(null);
    try {
      await importStudioCatalog(products);
      await refreshAll();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Unable to import studio catalog.');
    } finally {
      setImporting(false);
    }
  };

  const handleQuickPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,40}$/.test(clean)) {
      setPromoMsg('Code must be 3–40 uppercase letters/numbers.');
      return;
    }
    setPromoSaving(true);
    setPromoMsg(null);
    try {
      await saveDiscountCode({
        code: clean,
        percent: Math.max(1, Math.min(100, Number(promoPercent) || 10)),
        usageLimit: Math.max(0, Number(promoLimit) || 0),
        usedCount: 0,
        expiresAt: null,
        active: true,
      });
      setPromoCode('');
      setPromoMsg(`Code ${clean} activated.`);
      await refreshAll();
    } catch (err) {
      setPromoMsg(err instanceof Error ? err.message : 'Unable to save discount code.');
    } finally {
      setPromoSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 rounded-2xl bg-[#1F2020] animate-pulse" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-[#1F2020] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Store Operations Control Bar */}
      {(products.length === 0 || !settings.social.whatsapp.trim()) && (
        <section className="rounded-2xl bg-[#1F2020] border border-[#FF7A00]/30 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display text-base font-semibold text-white">Store Control Readiness</h2>
            <p className="text-xs text-[#E0C0AF]">
              {products.length === 0
                ? 'Import the 6 signature studio hoodies into live Firestore to manage pricing, sizes, and stock directly.'
                : 'Add your WhatsApp Helpline number in Settings so the storefront corner helpline opens your store chat directly.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {products.length === 0 && (
              <button
                type="button"
                disabled={importing}
                onClick={() => void handleImportCatalog()}
                className="px-4 py-2 rounded-xl bg-[#FF7A00] hover:bg-[#E65C00] text-[#121212] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{importing ? 'Importing...' : 'Publish 6 Atelier Hoodies'}</span>
              </button>
            )}
            {!settings.social.whatsapp.trim() && (
              <Link
                to="/settings"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span>Set WhatsApp Number</span>
              </Link>
            )}
          </div>
        </section>
      )}
      {importError && (
        <div role="alert" className="rounded-2xl bg-red-500/15 border border-red-500/30 p-4 text-xs text-red-200">
          {importError}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl bg-[#1F2020] border border-white/[0.06] p-6 space-y-3 admin-glow">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#E0C0AF]">Total Sales Revenue</span>
            <span className="w-8 h-8 rounded-xl bg-[#FF7A00] text-[#121212] flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </span>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {formatPKR(metrics.totalRevenue)}
          </p>
          <p className="text-xs text-[#E0C0AF]">Excludes cancelled orders</p>
        </div>

        <Link
          to="/orders"
          className="rounded-2xl bg-[#1F2020] border border-white/[0.06] hover:border-[#FF7A00]/40 p-6 space-y-3 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#E0C0AF]">Active Orders</span>
            <span className="w-8 h-8 rounded-xl bg-[#FF7A00]/20 text-[#FF7A00] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {metrics.activeOrdersCount}
          </p>
          <p className="text-xs text-[#E0C0AF]">New, confirmed &amp; shipped</p>
        </Link>

        <Link
          to="/customers"
          className="rounded-2xl bg-[#1F2020] border border-white/[0.06] hover:border-white/20 p-6 space-y-3 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#E0C0AF]">Customers &amp; Contacts</span>
            <span className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {customersCount}
          </p>
          <p className="text-xs text-[#E0C0AF]">{subscribers.length} inner circle signups</p>
        </Link>

        <Link
          to="/products"
          className="rounded-2xl bg-[#1F2020] border border-white/[0.06] hover:border-amber-400/40 p-6 space-y-3 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#E0C0AF]">Stock &amp; Inventory</span>
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              {metrics.lowStockCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            </span>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {metrics.totalUnits}
          </p>
          <p className="text-xs text-[#E0C0AF]">
            {products.length} SKUs · {metrics.lowStockCount} low-stock sizes
          </p>
        </Link>
      </div>

      {/* Chart + Quick Discount Code Creator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Revenue Analytics (PKR)</h2>
              <p className="text-xs text-[#E0C0AF]">Computed from live Firestore orders</p>
            </div>
            <div className="inline-flex rounded-full bg-[#151515] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setDays(7)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                  days === 7 ? 'bg-[#F5B082] text-[#121212]' : 'text-[#E0C0AF]'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setDays(30)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                  days === 30 ? 'bg-[#F5B082] text-[#121212]' : 'text-[#E0C0AF]'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.chartData}>
                <XAxis dataKey="label" stroke="#9C8478" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#9C8478"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v > 0 ? `${Math.round(v / 1000)}k` : '0')}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    backgroundColor: '#151515',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    color: '#E4E2E1',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [formatPKR(Number(value)), 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[8, 8, 8, 8]}>
                  {metrics.chartData.map((entry, idx) => (
                    <Cell
                      key={`${entry.label}-${idx}`}
                      fill={entry.revenue > 0 ? '#FF7A00' : '#4A362B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-4 rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-white">Quick Promo Voucher</h2>
            <p className="text-xs text-[#E0C0AF]">Activate a live checkout discount code</p>
          </div>

          <form onSubmit={handleQuickPromo} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="ov-promo-code" className="block text-xs text-[#E0C0AF]">
                Promo Code
              </label>
              <input
                id="ov-promo-code"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="ZORVIQUE15"
                className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-sm text-white uppercase outline-none focus:border-[#FF7A00]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="ov-promo-pct" className="block text-xs text-[#E0C0AF]">
                  Discount %
                </label>
                <input
                  id="ov-promo-pct"
                  type="number"
                  min={1}
                  max={100}
                  value={promoPercent}
                  onChange={(e) => setPromoPercent(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-sm text-white outline-none focus:border-[#FF7A00]"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="ov-promo-limit" className="block text-xs text-[#E0C0AF]">
                  Usage Limit
                </label>
                <input
                  id="ov-promo-limit"
                  type="number"
                  min={0}
                  value={promoLimit}
                  onChange={(e) => setPromoLimit(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-full bg-[#151515] border border-white/10 text-sm text-white outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            {promoMsg && <p className="text-xs text-[#FF7A00]">{promoMsg}</p>}

            <button
              type="submit"
              disabled={promoSaving}
              className="w-full py-3 rounded-full bg-[#F5B082] hover:bg-[#FF7A00] text-[#121212] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{promoSaving ? 'Activating...' : 'Activate Promo Voucher'}</span>
            </button>
          </form>
        </section>
      </div>

      {/* Recent Orders */}
      <section className="rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Recent Orders</h2>
          <Link to="/orders" className="text-xs font-semibold text-[#FF7A00] hover:underline">
            View All Orders
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-[#E0C0AF] py-6">No customer orders recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead>
                <tr className="border-b border-white/10 text-[#E0C0AF]">
                  <th className="py-3 pr-4">Order ID</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Items</th>
                  <th className="py-3 pr-4">Total (PKR)</th>
                  <th className="py-3 pr-4">Payment</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 pr-4 font-semibold text-white">{o.orderNo}</td>
                    <td className="py-3 pr-4 text-[#E4E2E1]">
                      {o.customer.name} ({o.customer.city})
                    </td>
                    <td className="py-3 pr-4 text-[#E0C0AF]">
                      {o.items.map((i) => `${i.name} (${i.size})`).join(', ')}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-white">{formatPKR(o.total)}</td>
                    <td className="py-3 pr-4 uppercase text-[#E0C0AF]">
                      {o.paymentMethod} · {o.paymentStatus}
                    </td>
                    <td className="py-3 capitalize text-[#FF7A00] font-medium">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
