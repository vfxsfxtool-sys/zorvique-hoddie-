import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Check, CheckCircle2, Copy, MessageCircle, Package } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Order } from '../data/types';
import { SeoHead } from '../components/SeoHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { formatPKR } from '../utils/commerce';
import { buildWhatsAppHref } from '../utils/whatsapp';

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { settings } = useStore();
  const stateOrder = (location.state as { order?: Order } | null)?.order || null;
  const [copied, setCopied] = useState(false);

  const order = useMemo<Order | null>(() => {
    if (stateOrder) return stateOrder;
    if (!id) return null;
    try {
      const raw = window.sessionStorage.getItem(`zorvique_order_${id}`);
      return raw ? (JSON.parse(raw) as Order) : null;
    } catch {
      return null;
    }
  }, [stateOrder, id]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col">
      <SeoHead title="Order Confirmed" />
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 sm:py-16">
        <div className="rounded-[28px] bg-[var(--color-surface)] border border-white/[0.08] p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-7 h-7 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider">Order Received</p>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">
                {order ? `Order ${order.orderNo} Confirmed` : `Order Reference ${id}`}
              </h1>
            </div>
          </div>

          {order ? (
            <>
              <div className="rounded-2xl bg-[#171717] border border-white/[0.06] p-5 space-y-2.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[#E4E2E1]">
                    Thank you, <strong>{order.customer.name}</strong>. Dispatched to{' '}
                    <strong>{order.customer.city}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(order.orderNo).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1800);
                      }).catch(() => {});
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-mono text-white cursor-pointer"
                  >
                    <span>ID: {order.orderNo}</span>
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-xs text-[#E0C0AF]">
                  Payment Method: <strong className="uppercase text-white">{order.paymentMethod}</strong> · Status:{' '}
                  <strong className="text-[var(--color-primary)]">
                    {order.paymentStatus === 'verification'
                      ? `Pending Manual Verification (TID: ${order.transactionId})`
                      : 'Pending Cash on Delivery'}
                  </strong>
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="font-display text-base font-semibold text-white">Items Ordered</h2>
                <ul className="divide-y divide-white/[0.08]">
                  {order.items.map((item, idx) => (
                    <li key={`${item.productId}-${idx}`} className="py-3 flex justify-between text-sm">
                      <div>
                        <p className="text-white font-medium">
                          {item.name} &times; {item.qty}
                        </p>
                        <p className="text-xs text-[#E0C0AF]">
                          {item.colour} · Size {item.size}
                        </p>
                      </div>
                      <span className="font-semibold text-white tabular-nums">
                        {formatPKR(item.price * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-white/10 space-y-1.5 text-sm tabular-nums">
                  <div className="flex justify-between text-[#E0C0AF]">
                    <span>Subtotal</span>
                    <span>{formatPKR(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount</span>
                      <span>-{formatPKR(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#E0C0AF]">
                    <span>Shipping</span>
                    <span>{order.shipping === 0 ? 'FREE' : formatPKR(order.shipping)}</span>
                  </div>
                  <div className="flex justify-between text-white font-display font-semibold text-base pt-2 border-t border-white/10">
                    <span>Total Payable</span>
                    <span>{formatPKR(order.total)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#E0C0AF]">
              Your order reference <strong>{id}</strong> has been recorded. For security, full customer order details are not publicly readable after your browser session ends.
            </p>
          )}

          <div className="pt-4 flex flex-wrap gap-3">
            {order && (
              <Link
                to={`/track-order?id=${encodeURIComponent(order.orderNo)}`}
                className="px-6 py-3 rounded-full bg-white text-[#0B0B0C] text-sm font-semibold inline-flex items-center gap-2 hover:bg-white/90 transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>Track Order</span>
              </Link>
            )}
            <a
              href={buildWhatsAppHref(
                settings.social.whatsapp,
                order
                  ? `Hi ${settings.brandName}, I just placed order ${order.orderNo} (${formatPKR(order.total)}) for ${order.customer.city}.`
                  : `Hi ${settings.brandName}, I placed order ${id || ''}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm on WhatsApp</span>
            </a>
            <Link
              to="/shop"
              className="px-6 py-3 rounded-full bg-[var(--color-primary)] text-[#121212] text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Continue Shopping
            </Link>
            <Link
              to="/"
              className="px-6 py-3 rounded-full border border-white/15 text-white text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
