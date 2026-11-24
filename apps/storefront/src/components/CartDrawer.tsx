import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { computeOrderTotals, formatPKR } from '../utils/commerce';

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
    appliedDiscount,
    applyDiscount,
    removeDiscount,
    settings,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    if (!cartOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  const totals = computeOrderTotals(cart, 'Lahore', settings.shipping, appliedDiscount);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoInput.trim()) {
      setPromoError('Enter a promo code.');
      return;
    }
    setPromoLoading(true);
    try {
      const res = await applyDiscount(promoInput);
      if (!res.ok) {
        setPromoError(res.error || 'Invalid code.');
      } else {
        setPromoInput('');
      }
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      onClick={() => setCartOpen(false)}
    >
      <div
        className="w-full max-w-md h-full bg-[#171717] border-l border-white/10 flex flex-col justify-between p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="font-display text-xl font-semibold text-white">Your Bag</h2>
            </div>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              aria-label="Close bag"
              className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="text-sm text-[#E0C0AF]">Your shopping bag is currently empty.</p>
              <Link
                to="/shop"
                onClick={() => setCartOpen(false)}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[var(--color-primary)] text-[#121212] text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Explore Hoodies
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.08]">
              {cart.map((item) => (
                <li key={`${item.productId}-${item.size}-${item.colour}`} className="py-4 flex gap-4">
                  <div className="w-20 h-24 rounded-2xl bg-[#222] overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/product/${item.slug}`}
                        onClick={() => setCartOpen(false)}
                        className="font-display text-sm font-semibold text-white truncate hover:underline"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId, item.size, item.colour)}
                        aria-label={`Remove ${item.name}`}
                        className="p-1.5 text-[#E0C0AF] hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#E0C0AF] mt-0.5">
                      {item.colour} · Size {item.size}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, item.size, item.colour, item.qty - 1)}
                          aria-label={`Decrease quantity for ${item.name}`}
                          className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-l-full cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold tabular-nums text-white">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, item.size, item.colour, item.qty + 1)}
                          disabled={item.maxStock > 0 && item.qty >= item.maxStock}
                          aria-label={`Increase quantity for ${item.name}`}
                          className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-r-full disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-display text-sm font-semibold text-white tabular-nums">
                        {formatPKR(item.price * item.qty)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="pt-5 border-t border-white/10 space-y-4">
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
              <form onSubmit={handleApplyPromo} className="space-y-1.5">
                <div className="flex gap-2">
                  <label htmlFor="cart-promo-input" className="sr-only">
                    Promo code
                  </label>
                  <input
                    id="cart-promo-input"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Promo code"
                    className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder:text-[#E0C0AF]/50 focus:border-[var(--color-primary)] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={promoLoading}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {promoLoading ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {promoError && <p className="text-xs text-red-400 px-2">{promoError}</p>}
              </form>
            )}

            <div className="space-y-2 text-sm tabular-nums">
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
                <span>Estimated Shipping</span>
                <span>{totals.shipping === 0 ? 'FREE' : formatPKR(totals.shipping)}</span>
              </div>
              <div className="flex justify-between text-white font-display font-semibold text-base pt-2 border-t border-white/10">
                <span>Estimated Total</span>
                <span>{formatPKR(totals.total)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              onClick={() => setCartOpen(false)}
              className="w-full py-3.5 rounded-full bg-[var(--color-primary)] text-[#121212] font-semibold text-sm flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
