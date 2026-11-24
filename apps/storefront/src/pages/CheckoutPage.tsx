import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Tag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { createOrder } from '../data/storefront';
import type { PaymentMethod } from '../data/types';
import { SeoHead } from '../components/SeoHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  PAKISTAN_CITIES,
  computeOrderTotals,
  formatPKR,
  validatePakistanPhone,
} from '../utils/commerce';

export function CheckoutPage() {
  const navigate = useNavigate();
  const {
    cart,
    settings,
    appliedDiscount,
    applyDiscount,
    removeDiscount,
    clearCart,
    setCartOpen,
  } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+92 ');
  const [city, setCity] = useState<string>('Lahore');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const defaultPayment: PaymentMethod = settings.payments.cod.enabled
    ? 'cod'
    : settings.payments.jazzcash.enabled
      ? 'jazzcash'
      : 'easypaisa';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultPayment);
  const [transactionId, setTransactionId] = useState('');

  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setCartOpen(false);
  }, [setCartOpen]);

  useEffect(() => {
    if (paymentMethod === 'cod' && !settings.payments.cod.enabled) {
      if (settings.payments.jazzcash.enabled) setPaymentMethod('jazzcash');
      else if (settings.payments.easypaisa.enabled) setPaymentMethod('easypaisa');
    }
  }, [paymentMethod, settings.payments]);

  const totals = computeOrderTotals(cart, city, settings.shipping, appliedDiscount);

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoMsg(null);
    if (!promoInput.trim()) return;
    const res = await applyDiscount(promoInput);
    if (!res.ok) setPromoMsg(res.error || 'Invalid promo code.');
    else setPromoInput('');
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || cart.length === 0) return;
    setFormError(null);

    if (!name.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    const phoneCheck = validatePakistanPhone(phone);
    if (!phoneCheck.valid) {
      setFormError(phoneCheck.error || 'Invalid Pakistan mobile number.');
      return;
    }
    if (address.trim().length < 5) {
      setFormError('Please enter your complete street/phase delivery address.');
      return;
    }
    if ((paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && !transactionId.trim()) {
      setFormError('Please enter the manual transfer Transaction ID (TID) before confirming.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createOrder({
        customer: {
          name: name.trim(),
          email: email.trim(),
          phone: phoneCheck.normalized,
          city,
          address: address.trim(),
          postalCode: postalCode.trim(),
        },
        items: cart.map((item) => ({
          productId: item.productId,
          size: item.size,
          colour: item.colour,
          qty: item.qty,
        })),
        paymentMethod,
        transactionId: paymentMethod === 'cod' ? '' : transactionId.trim(),
        discountCode: appliedDiscount?.code,
      });

      try {
        window.sessionStorage.setItem(`zorvique_order_${created.id}`, JSON.stringify(created));
        const rawRecent = window.localStorage.getItem('zorvique_recent_orders_v1');
        const prevRecent = rawRecent ? (JSON.parse(rawRecent) as unknown) : [];
        const nextRecent = [
          created.orderNo,
          ...(Array.isArray(prevRecent)
            ? prevRecent.filter((id): id is string => typeof id === 'string' && id !== created.orderNo)
            : []),
        ].slice(0, 5);
        window.localStorage.setItem('zorvique_recent_orders_v1', JSON.stringify(nextRecent));
      } catch {
        // Ignore storage errors
      }
      clearCart();
      navigate(`/order-confirmation/${created.id}`, { state: { order: created } });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to place order. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col">
      <SeoHead title="Checkout" />
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 sm:py-14">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white mb-8">
          Express Checkout
        </h1>

        {cart.length === 0 ? (
          <div className="rounded-[24px] bg-[var(--color-surface)] border border-white/10 p-10 text-center space-y-4">
            <p className="text-sm text-[#E0C0AF]">Your bag is empty. Add a hoodie before checking out.</p>
            <Link
              to="/shop"
              className="inline-flex px-6 py-3 rounded-full bg-[var(--color-primary)] text-[#121212] text-sm font-semibold"
            >
              Browse Hoodies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={handleOrderSubmit}
              noValidate
              className="lg:col-span-7 rounded-[28px] bg-[var(--color-surface)] border border-white/[0.08] p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="font-display text-xl font-semibold text-white">Delivery Details</h2>
                <span className="text-xs text-[var(--color-primary)] font-medium">Pakistan Wide</span>
              </div>

              {formError && (
                <div role="alert" className="rounded-2xl bg-red-500/15 border border-red-500/30 p-4 text-sm text-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="chk-name" className="block text-xs font-medium text-[#E0C0AF]">
                    Full Name
                  </label>
                  <input
                    id="chk-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ayesha Tariq"
                    className="w-full px-4 py-3 rounded-full bg-[#171717] border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="chk-email" className="block text-xs font-medium text-[#E0C0AF]">
                    Email / Gmail Address
                  </label>
                  <input
                    id="chk-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full px-4 py-3 rounded-full bg-[#171717] border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="chk-phone" className="block text-xs font-medium text-[#E0C0AF]">
                    Mobile Number (+92)
                  </label>
                  <input
                    id="chk-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-4 py-3 rounded-full bg-[#171717] border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="chk-city" className="block text-xs font-medium text-[#E0C0AF]">
                    City
                  </label>
                  <select
                    id="chk-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-full bg-[#171717] border border-white/10 text-sm text-white focus:border-[var(--color-primary)] outline-none"
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="chk-postal" className="block text-xs font-medium text-[#E0C0AF]">
                    Postal Code (Optional)
                  </label>
                  <input
                    id="chk-postal"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="54000"
                    className="w-full px-4 py-3 rounded-full bg-[#171717] border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-primary)] outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="chk-address" className="block text-xs font-medium text-[#E0C0AF]">
                    Complete Shipping Address
                  </label>
                  <textarea
                    id="chk-address"
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Apartment #, Street, Phase / Sector, Landmark"
                    className="w-full px-4 py-3 rounded-2xl bg-[#171717] border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-primary)] outline-none resize-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#E0C0AF]">
                  Select Payment Method
                </p>

                {settings.payments.cod.enabled && (
                  <label className="flex items-start gap-3 p-4 rounded-2xl bg-[#171717] border border-white/10 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 accent-[var(--color-primary)]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">Cash on Delivery (COD)</span>
                        <span className="text-[11px] font-semibold text-[var(--color-primary)]">Most Popular</span>
                      </div>
                      <p className="text-xs text-[#E0C0AF] mt-0.5">
                        Pay with cash at your doorstep upon parcel delivery.
                      </p>
                    </div>
                  </label>
                )}

                {settings.payments.jazzcash.enabled && (
                  <label className="flex items-start gap-3 p-4 rounded-2xl bg-[#171717] border border-white/10 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="jazzcash"
                      checked={paymentMethod === 'jazzcash'}
                      onChange={() => setPaymentMethod('jazzcash')}
                      className="mt-1 accent-[var(--color-primary)]"
                    />
                    <div className="flex-1 space-y-1">
                      <span className="text-sm font-semibold text-white">JazzCash (Manual Transfer)</span>
                      {settings.payments.jazzcash.account && (
                        <p className="text-xs text-[var(--color-primary)] font-medium">
                          Account: {settings.payments.jazzcash.account}
                        </p>
                      )}
                      {settings.payments.jazzcash.instructions && (
                        <p className="text-xs text-[#E0C0AF]">{settings.payments.jazzcash.instructions}</p>
                      )}
                    </div>
                  </label>
                )}

                {settings.payments.easypaisa.enabled && (
                  <label className="flex items-start gap-3 p-4 rounded-2xl bg-[#171717] border border-white/10 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="easypaisa"
                      checked={paymentMethod === 'easypaisa'}
                      onChange={() => setPaymentMethod('easypaisa')}
                      className="mt-1 accent-[var(--color-primary)]"
                    />
                    <div className="flex-1 space-y-1">
                      <span className="text-sm font-semibold text-white">EasyPaisa (Manual Transfer)</span>
                      {settings.payments.easypaisa.account && (
                        <p className="text-xs text-[var(--color-primary)] font-medium">
                          Account: {settings.payments.easypaisa.account}
                        </p>
                      )}
                      {settings.payments.easypaisa.instructions && (
                        <p className="text-xs text-[#E0C0AF]">{settings.payments.easypaisa.instructions}</p>
                      )}
                    </div>
                  </label>
                )}

                {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && (
                  <div className="space-y-1.5 pt-2">
                    <label htmlFor="chk-tid" className="block text-xs font-medium text-[#E0C0AF]">
                      Transaction ID (TID)
                    </label>
                    <input
                      id="chk-tid"
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter transfer reference / TID"
                      className="w-full px-4 py-3 rounded-full bg-[#171717] border border-[var(--color-primary)]/40 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-primary)] outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[52px] px-6 py-4 rounded-full bg-[#F5B082] hover:bg-[var(--color-primary)] text-[#121212] font-display font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer tabular-nums"
              >
                <Lock className="w-4 h-4" />
                <span>{submitting ? 'Placing Order...' : `CONFIRM ORDER — ${formatPKR(totals.total)}`}</span>
              </button>
            </form>

            {/* Summary Column */}
            <aside className="lg:col-span-5 rounded-[28px] bg-[var(--color-surface)] border border-white/[0.08] p-6 sm:p-8 space-y-5">
              <h2 className="font-display text-xl font-semibold text-white">Order Summary</h2>

              <ul className="divide-y divide-white/[0.08]">
                {cart.map((item) => (
                  <li key={`${item.productId}-${item.size}-${item.colour}`} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {item.name} &times; {item.qty}
                      </p>
                      <p className="text-xs text-[#E0C0AF]">
                        {item.colour} · Size {item.size}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-white tabular-nums">
                      {formatPKR(item.price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              {appliedDiscount ? (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-full bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-xs">
                  <span className="flex items-center gap-2 text-white font-medium">
                    <Tag className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    {appliedDiscount.code} ({appliedDiscount.percent}% off)
                  </span>
                  <button
                    type="button"
                    onClick={removeDiscount}
                    className="text-[#E0C0AF] hover:text-white underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePromoSubmit} className="space-y-1.5">
                  <div className="flex gap-2">
                    <label htmlFor="chk-promo" className="sr-only">Promo code</label>
                    <input
                      id="chk-promo"
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Promo code"
                      className="flex-1 px-4 py-2.5 rounded-full bg-[#171717] border border-white/10 text-xs text-white placeholder:text-white/40 outline-none focus:border-[var(--color-primary)]"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {promoMsg && <p className="text-xs text-red-400 px-2">{promoMsg}</p>}
                </form>
              )}

              <div className="space-y-2.5 pt-4 border-t border-white/10 text-sm tabular-nums">
                <div className="flex justify-between text-[#E0C0AF]">
                  <span>Subtotal</span>
                  <span>{formatPKR(totals.subtotal)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-{formatPKR(totals.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#E0C0AF]">
                  <span>Shipping ({city})</span>
                  <span>{totals.shipping === 0 ? 'FREE' : formatPKR(totals.shipping)}</span>
                </div>
                <div className="flex justify-between text-white font-display text-lg font-semibold pt-2 border-t border-white/10">
                  <span>Grand Total</span>
                  <span>{formatPKR(totals.total)}</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
