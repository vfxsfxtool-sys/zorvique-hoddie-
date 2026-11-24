import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from 'lucide-react';
import { fetchOrderTracking } from '../data/storefront';
import { useStore } from '../context/StoreContext';
import type { OrderTrackingRecord } from '../data/types';
import { SeoHead } from '../components/SeoHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { formatPKR } from '../utils/commerce';
import { buildWhatsAppHref } from '../utils/whatsapp';
import {
  buildOrderTrackingStepModel,
  formatOrderTimestamp,
  normalizeOrderLookupId,
} from '../utils/orderTracking';

const RECENT_ORDERS_KEY = 'zorvique_recent_orders_v1';

function readRecentOrderNos(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string' && v.length >= 3).slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

export function OrderTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useStore();
  const urlOrderId = searchParams.get('id') || '';

  const [inputId, setInputId] = useState(urlOrderId);
  const [loading, setLoading] = useState(false);
  const [searchedId, setSearchedId] = useState('');
  const [record, setRecord] = useState<OrderTrackingRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const recentOrderNos = useMemo(() => readRecentOrderNos(), []);

  const lookupOrder = useCallback(async (rawId: string) => {
    const parsed = normalizeOrderLookupId(rawId);
    if (!parsed.valid) {
      setRecord(null);
      setNotFound(false);
      setErrorMsg(parsed.error || 'Enter a valid Order ID.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setNotFound(false);
    setSearchedId(parsed.normalized);

    try {
      const found = await fetchOrderTracking(parsed.normalized);
      if (!found) {
        setRecord(null);
        setNotFound(true);
      } else {
        setRecord(found);
      }
    } catch (err) {
      setRecord(null);
      setErrorMsg(err instanceof Error ? err.message : 'Unable to look up this order right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (urlOrderId.trim()) {
      setInputId(urlOrderId);
      void lookupOrder(urlOrderId);
    }
  }, [urlOrderId, lookupOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = normalizeOrderLookupId(inputId);
    if (!parsed.valid) {
      setRecord(null);
      setNotFound(false);
      setErrorMsg(parsed.error || 'Enter your Order ID (e.g. ZRV-48129304).');
      return;
    }
    setSearchParams({ id: parsed.normalized });
    void lookupOrder(parsed.normalized);
  };

  const handleSelectRecent = (orderNo: string) => {
    setInputId(orderNo);
    setSearchParams({ id: orderNo });
    void lookupOrder(orderNo);
  };

  const handleCopyOrderNo = async () => {
    if (!record?.orderNo) return;
    try {
      await navigator.clipboard.writeText(record.orderNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const stepModel = record
    ? buildOrderTrackingStepModel(record.status, record.courier, record.trackingNo)
    : null;

  const paymentStatusLabel =
    record?.paymentStatus === 'paid'
      ? 'Paid'
      : record?.paymentStatus === 'verification'
        ? 'Transfer Verification'
        : 'Cash on Delivery Pending';

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F4F4F5] flex flex-col">
      <SeoHead
        title="Track Your Order"
        description="Check live dispatch and delivery status for your Zorvique hoodie order."
      />
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 sm:px-10 py-12 sm:py-20 space-y-10">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
            Dispatch Status
          </p>
          <h1 className="font-editorial italic text-4xl sm:text-5xl text-white leading-[1.06]">
            Track Your Order
          </h1>
          <p className="text-sm sm:text-base text-white/65 max-w-xl leading-relaxed">
            Enter your Zorvique Order ID (for example <span className="text-white font-mono">ZRV-48129304</span>) to check live studio confirmation, courier assignment, and delivery status.
          </p>
        </div>

        {/* Search Lookup Form */}
        <section className="rounded-[22px] bg-[#131316] border border-white/[0.08] p-6 sm:p-8 space-y-5">
          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <label
              htmlFor="track-order-input"
              className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60"
            >
              Order ID
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="track-order-input"
                  type="text"
                  value={inputId}
                  onChange={(e) => setInputId(e.target.value)}
                  placeholder="e.g. ZRV-48129304"
                  autoComplete="off"
                  className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-full bg-[#0B0B0C] border border-white/15 text-sm font-mono uppercase text-white placeholder:normal-case placeholder:font-sans placeholder:text-white/30 focus:border-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="min-h-[48px] px-7 py-3 rounded-full bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-semibold uppercase tracking-[0.2em] whitespace-nowrap shrink-0 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Checking...' : 'Track Order'}
              </button>
            </div>
          </form>

          {recentOrderNos.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-white/55">
              <span>Recent orders on this device:</span>
              {recentOrderNos.map((no) => (
                <button
                  key={no}
                  type="button"
                  onClick={() => handleSelectRecent(no)}
                  className="px-3 py-1 rounded-full border border-white/15 hover:border-white text-white font-mono text-[11px] transition-colors cursor-pointer"
                >
                  {no}
                </button>
              ))}
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3 text-xs text-red-200"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </section>

        {/* Loading State */}
        {loading && (
          <div className="rounded-[22px] bg-[#131316] border border-white/[0.08] p-8 space-y-5 animate-pulse">
            <div className="h-7 w-48 bg-white/10 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="h-16 bg-white/5 rounded-xl" />
              <div className="h-16 bg-white/5 rounded-xl" />
              <div className="h-16 bg-white/5 rounded-xl" />
              <div className="h-16 bg-white/5 rounded-xl" />
            </div>
          </div>
        )}

        {/* Not Found State */}
        {!loading && notFound && searchedId && (
          <section className="rounded-[22px] bg-[#131316] border border-white/[0.08] p-8 space-y-4">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-white/50 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h2 className="font-editorial italic text-2xl text-white">
                  No tracking record found for {searchedId}
                </h2>
                <p className="text-sm text-white/60 leading-relaxed">
                  Double-check your Order ID (it starts with <span className="text-white font-mono">ZRV-</span> on your confirmation receipt). If your order was placed earlier or you need an update right away, message our Lahore studio on WhatsApp.
                </p>
              </div>
            </div>
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={buildWhatsAppHref(
                  settings.social.whatsapp,
                  `Hi ${settings.brandName}, please check the status of my order ${searchedId}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Ask on WhatsApp</span>
              </a>
              <Link
                to="/shop"
                className="min-h-[44px] px-5 py-2.5 rounded-full border border-white/15 hover:border-white text-white text-xs font-medium uppercase tracking-[0.16em] inline-flex items-center"
              >
                Browse Store
              </Link>
            </div>
          </section>
        )}

        {/* Tracking Result Card */}
        {!loading && record && stepModel && (
          <section className="rounded-[22px] bg-[#131316] border border-white/[0.08] p-6 sm:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-lg sm:text-xl font-semibold text-white tracking-wide tabular-nums">
                    {record.orderNo}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopyOrderNo()}
                    aria-label="Copy Order ID"
                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/55 tabular-nums">
                  <span>Placed {formatOrderTimestamp(record.createdAt)}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span>{record.city}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span className="uppercase">{record.paymentMethod}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span>{paymentStatusLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-lg font-semibold text-white tabular-nums">
                  {formatPKR(record.total)}
                </span>
                <button
                  type="button"
                  onClick={() => void lookupOrder(record.orderNo)}
                  aria-label="Refresh tracking status"
                  className="min-h-[40px] px-3.5 py-2 rounded-full border border-white/15 hover:border-white text-xs text-white/80 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Status Banner + Progress Timeline */}
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                {stepModel.isCancelled ? (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                ) : record.status === 'delivered' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : record.status === 'shipped' ? (
                  <Truck className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="text-base font-semibold text-white">{stepModel.statusLabel}</p>
                  <p className="text-sm text-white/65">{stepModel.statusSummary}</p>
                </div>
              </div>

              {!stepModel.isCancelled && (
                <ol className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {stepModel.steps.map((step, index) => {
                    const active = step.state === 'current';
                    const done = step.state === 'completed';
                    return (
                      <li
                        key={step.key}
                        className={`rounded-2xl p-4 border transition-colors ${
                          active
                            ? 'bg-white/[0.06] border-[var(--color-primary)]/60'
                            : done
                              ? 'bg-[#0B0B0C] border-emerald-500/35'
                              : 'bg-[#0B0B0C]/60 border-white/[0.06] opacity-65'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-mono text-white/50 tabular-nums">
                            0{index + 1}
                          </span>
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : active ? (
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                              Current
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-white">{step.label}</p>
                        <p className="text-xs text-white/55 mt-1 leading-relaxed">{step.description}</p>
                      </li>
                    );
                  })}
                </ol>
              )}

              {(record.courier || record.trackingNo) && (
                <div className="pt-2 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Courier Partner
                    </span>
                    <p className="text-sm font-medium text-white">
                      {record.courier || 'Courier Assigned'}
                    </p>
                  </div>
                  {record.trackingNo && (
                    <div className="space-y-0.5 text-left sm:text-right">
                      <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                        Courier Tracking / AWB
                      </span>
                      <p className="text-sm font-mono font-semibold text-white tabular-nums">
                        {record.trackingNo}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Items Purchased */}
            <div className="pt-6 border-t border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between text-xs text-white/55">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                  Items in Order
                </h2>
                <span className="tabular-nums">
                  {record.itemCount} {record.itemCount === 1 ? 'piece' : 'pieces'}
                </span>
              </div>
              <ul className="divide-y divide-white/[0.06]">
                {record.itemSummary.map((item, idx) => (
                  <li
                    key={`${item.name}-${item.size}-${idx}`}
                    className="py-3 flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-xs text-white/55">
                        {item.colour} &middot; Size {item.size}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-white/80 tabular-nums">
                      &times;{item.qty}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Concierge CTA */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08]">
              <p className="text-xs text-white/55">
                Questions about delivery timing or address updates?
              </p>
              <a
                href={buildWhatsAppHref(
                  settings.social.whatsapp,
                  `Hi ${settings.brandName}, I'm checking on Order ${record.orderNo} (${stepModel.statusLabel}) for ${record.city}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#0E1913] border border-emerald-500/40 hover:border-emerald-400 text-emerald-200 hover:text-white text-xs font-medium uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Support</span>
              </a>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
