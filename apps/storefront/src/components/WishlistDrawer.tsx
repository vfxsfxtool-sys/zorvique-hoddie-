import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/commerce';

export function WishlistDrawer() {
  const { wishlist, wishlistOpen, setWishlistOpen, products, toggleWishlist, addToCart } = useStore();

  useEffect(() => {
    if (!wishlistOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWishlistOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [wishlistOpen, setWishlistOpen]);

  if (!wishlistOpen) return null;

  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Saved Wishlist"
      onClick={() => setWishlistOpen(false)}
    >
      <div
        className="w-full max-w-md h-full bg-[#171717] border-l border-white/10 p-6 overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-[var(--color-primary)] fill-current" />
            <h2 className="font-display text-xl font-semibold text-white">Saved Looks</h2>
          </div>
          <button
            type="button"
            onClick={() => setWishlistOpen(false)}
            aria-label="Close wishlist"
            className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedProducts.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <p className="text-sm text-[#E0C0AF]">You have no saved hoodies yet.</p>
            <Link
              to="/shop"
              onClick={() => setWishlistOpen(false)}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-[#121212] text-sm font-semibold"
            >
              Browse Hoodies
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.08]">
            {savedProducts.map((p) => {
              const firstColour = p.colourways[0];
              const img = firstColour?.images?.[0] || '';
              const firstSize = p.sizes.find((s) => s.stock > 0) || p.sizes[0];
              return (
                <li key={p.id} className="py-4 flex items-center gap-3.5">
                  <div className="w-16 h-20 rounded-xl bg-[#222] overflow-hidden shrink-0">
                    {img && (
                      <img src={img} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${p.slug}`}
                      onClick={() => setWishlistOpen(false)}
                      className="font-display text-sm font-semibold text-white hover:underline block truncate"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-[#E0C0AF] mt-1 tabular-nums">{formatPKR(p.price)}</p>
                  </div>
                  {firstSize && firstSize.stock > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        addToCart({
                          productId: p.id,
                          slug: p.slug,
                          name: p.name,
                          price: p.price,
                          compareAtPrice: p.compareAtPrice,
                          size: firstSize.label,
                          colour: firstColour?.name || 'Default',
                          colourHex: firstColour?.hex || '#9E0B14',
                          imageUrl: img,
                          qty: 1,
                          maxStock: firstSize.stock,
                        });
                        setWishlistOpen(false);
                      }}
                      aria-label={`Add ${p.name} to bag`}
                      title="Add to Bag"
                      className="w-10 h-10 rounded-full bg-[var(--color-primary)]/90 hover:bg-[var(--color-primary)] flex items-center justify-center text-white cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(p.id)}
                    aria-label={`Remove ${p.name} from wishlist`}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#E0C0AF] hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
