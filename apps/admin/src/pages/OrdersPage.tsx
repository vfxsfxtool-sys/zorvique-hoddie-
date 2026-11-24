import { useMemo, useState } from 'react';
import { AlertTriangle, Download, MessageCircle, Printer, Search, X } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { updateOrderAtomic } from '../data/adminApi';
import type { CourierName, Order, OrderStatus, PaymentStatus } from '../data/types';
import {
  formatPKR,
  formatWhatsAppOutreachUrl,
  ordersToCsv,
  recomputeOrderComparison,
} from '../utils/adminLogic';

export function OrdersPage() {
  const { orders, products, refreshAll } = useAdminData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all');

  const [selected, setSelected] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>('new');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('pending');
  const [editCourier, setEditCourier] = useState<CourierName>('');
  const [editTrackingNo, setEditTrackingNo] = useState('');
  const [editTransactionId, setEditTransactionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false;
      if (q) {
        const hay = `${o.orderNo} ${o.customer.name} ${o.customer.city} ${o.customer.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const openOrder = (o: Order) => {
    setSelected(o);
    setEditStatus(o.status);
    setEditPaymentStatus(o.paymentStatus);
    setEditCourier(o.courier);
    setEditTrackingNo(o.trackingNo);
    setEditTransactionId(o.transactionId);
    setErrorMsg(null);
  };

  const priceCheck = useMemo(
    () => (selected ? recomputeOrderComparison(selected, products) : null),
    [selected, products]
  );

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await updateOrderAtomic(selected, {
        status: editStatus,
        paymentStatus: editPaymentStatus,
        courier: editCourier,
        trackingNo: editTrackingNo.trim(),
        transactionId: editTransactionId.trim(),
      });
      setSelected(null);
      await refreshAll();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update order.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    const csv = ordersToCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zorvique-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Orders (PKR)</h1>
          <p className="text-xs text-[#E0C0AF]">
            Confirming an order atomically deducts size stock and increments discount code usage
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white inline-flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Status Tabs + Search Filters */}
      <div className="no-print space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#1F2020] border border-white/[0.06]">
          {(
            [
              { id: 'all', label: 'All Orders' },
              { id: 'new', label: 'New' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'shipped', label: 'Shipped' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map((tab) => {
            const count =
              tab.id === 'all'
                ? orders.length
                : orders.filter((o) => o.status === tab.id).length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#FF7A00] text-[#121212] font-semibold'
                    : 'text-[#E0C0AF] hover:text-white'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl bg-[#1F2020] border border-white/[0.06] p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#E0C0AF]/60 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Search orders"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, customer, phone, or city..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#151515] border border-white/10 text-xs text-white outline-none focus:border-[#FF7A00]"
            />
          </div>

          <select
            aria-label="Filter by payment status"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)}
            className="px-4 py-2.5 rounded-xl bg-[#151515] border border-white/10 text-xs text-white outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="pending">Pending</option>
            <option value="verification">Verification</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="no-print rounded-[24px] bg-[#1F2020] border border-white/[0.06] p-6">
        {filtered.length === 0 ? (
          <p className="text-sm text-[#E0C0AF] py-6">No orders found matching your criteria.</p>
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
                  <th className="py-3 pr-4">Courier / Status</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 pr-4 font-semibold text-white">{o.orderNo}</td>
                    <td className="py-3.5 pr-4 text-[#E4E2E1]">
                      {o.customer.name} ({o.customer.city})
                    </td>
                    <td className="py-3.5 pr-4 text-[#E0C0AF]">
                      {o.items.map((i) => `${i.name} (${i.size}) x${i.qty}`).join(', ')}
                    </td>
                    <td className="py-3.5 pr-4 font-semibold text-white">{formatPKR(o.total)}</td>
                    <td className="py-3.5 pr-4 uppercase text-[#E0C0AF]">
                      {o.paymentMethod} · {o.paymentStatus}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="capitalize text-[#FF7A00] font-semibold">{o.status}</span>
                      {o.courier && <span className="text-[#E0C0AF]"> · {o.courier}</span>}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openOrder(o)}
                        className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-[#FF7A00] hover:text-[#121212] text-white font-semibold cursor-pointer transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail & Slip Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Order ${selected.orderNo}`}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-[#1A1A1A] border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="no-print flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">
                  Order {selected.orderNo}
                </h2>
                <p className="text-xs text-[#E0C0AF]">
                  {selected.customer.name} · {selected.customer.phone} · {selected.customer.city}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selected.customer.phone && (
                  <a
                    href={formatWhatsAppOutreachUrl(
                      selected.customer.phone,
                      `Assalam-o-Alaikum ${selected.customer.name}! Confirming your Zorvique order ${selected.orderNo} (${formatPKR(selected.total)}).`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-xs text-[#4ADE80] inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-full bg-white/10 text-xs text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close order detail"
                  className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {priceCheck?.hasMismatch && (
              <div role="alert" className="no-print rounded-2xl bg-amber-500/15 border border-amber-500/40 p-4 text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    Catalog Price Mismatch Detected (Stored Subtotal {formatPKR(priceCheck.storedSubtotal)} vs Current {formatPKR(priceCheck.currentSubtotal)})
                  </span>
                </div>
                {priceCheck.details.map((d, idx) => (
                  <p key={idx}>{d}</p>
                ))}
              </div>
            )}

            {errorMsg && (
              <div role="alert" className="no-print rounded-2xl bg-red-500/15 border border-red-500/30 p-4 text-xs text-red-200">
                {errorMsg}
              </div>
            )}

            {/* Printable Packing Slip Content */}
            <div className="rounded-2xl bg-[#141414] border border-white/10 p-5 space-y-4">
              <div className="flex justify-between items-start text-xs">
                <div>
                  <p className="font-display font-bold text-base text-white">ZORVIQUE PACKING SLIP</p>
                  <p className="text-[#E0C0AF]">{selected.orderNo}</p>
                </div>
                <div className="text-right text-[#E0C0AF]">
                  <p className="text-white font-semibold">{selected.customer.name}</p>
                  <p>{selected.customer.phone}</p>
                  <p>{selected.customer.address}, {selected.customer.city} {selected.customer.postalCode}</p>
                </div>
              </div>

              <table className="w-full text-xs text-left tabular-nums border-t border-white/10">
                <thead>
                  <tr className="text-[#E0C0AF] border-b border-white/10">
                    <th className="py-2">Item</th>
                    <th className="py-2">Variant</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {selected.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-white">{i.name}</td>
                      <td className="py-2 text-[#E0C0AF]">{i.colour} / {i.size}</td>
                      <td className="py-2 text-white">{i.qty}</td>
                      <td className="py-2 text-right text-white">{formatPKR(i.price * i.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-2 border-t border-white/10 text-xs space-y-1 tabular-nums text-right">
                <p className="text-[#E0C0AF]">Subtotal: {formatPKR(selected.subtotal)}</p>
                {selected.discount > 0 && (
                  <p className="text-emerald-400">
                    Discount ({selected.discountCode || 'PROMO'}): -{formatPKR(selected.discount)}
                  </p>
                )}
                <p className="text-[#E0C0AF]">Shipping: {formatPKR(selected.shipping)}</p>
                <p className="text-sm font-bold text-white">Total: {formatPKR(selected.total)}</p>
              </div>
            </div>

            <form onSubmit={handleSaveOrder} className="no-print space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="ord-status" className="block text-xs text-[#E0C0AF]">Order Status</label>
                  <select
                    id="ord-status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                    className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-xs text-white outline-none"
                  >
                    <option value="new">New</option>
                    <option value="confirmed">Confirmed (Deducts Stock)</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="ord-pay" className="block text-xs text-[#E0C0AF]">Payment Status</label>
                  <select
                    id="ord-pay"
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-xs text-white outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="verification">Verification</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="ord-courier" className="block text-xs text-[#E0C0AF]">Courier</label>
                  <select
                    id="ord-courier"
                    value={editCourier}
                    onChange={(e) => setEditCourier(e.target.value as CourierName)}
                    className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-xs text-white outline-none"
                  >
                    <option value="">Unassigned</option>
                    <option value="TCS">TCS</option>
                    <option value="Leopard">Leopard</option>
                    <option value="Trax">Trax</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="ord-track" className="block text-xs text-[#E0C0AF]">Tracking Number</label>
                  <input
                    id="ord-track"
                    value={editTrackingNo}
                    onChange={(e) => setEditTrackingNo(e.target.value)}
                    placeholder="AWB / Tracking #"
                    className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-xs text-white outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label htmlFor="ord-tid" className="block text-xs text-[#E0C0AF]">
                    Transaction ID ({selected.paymentMethod.toUpperCase()})
                  </label>
                  <input
                    id="ord-tid"
                    value={editTransactionId}
                    onChange={(e) => setEditTransactionId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full bg-[#121212] border border-white/10 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="px-5 py-2.5 rounded-full border border-white/15 text-xs text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-[#FF7A00] text-[#121212] text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Save Order Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
