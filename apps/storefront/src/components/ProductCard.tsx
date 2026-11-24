import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '../data/types';
import { useStore } from '../context/StoreContext';
import { useProductTransition } from '../context/ProductTransitionContext';
import { formatPKR, getTotalStock } from '../utils/commerce';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const { navigateToProduct } = useProductTransition();
  const [selectedColourIdx, setSelectedColourIdx] = useState(0);
  const imageWrapRef = useRef<HTMLDivElement>(null);

  const activeColour = product.colourways[selectedColourIdx] || product.colourways[0];
  const primaryImage = activeColour?.images?.[0] || '';
  const totalStock = getTotalStock(product);
  const firstInStockSize = product.sizes.find((s) => s.stock > 0) || product.sizes[0];
  const numLabel = typeof index === 'number' ? `No. ${String(index + 1).padStart(2, '0')}` : null;
  const isLiked = wishlist.includes(product.id);

  const handleToggleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstInStockSize || firstInStockSize.stock <= 0) return;
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      size: firstInStockSize.label,
      colour: activeColour?.name || 'Default',
      colourHex: activeColour?.hex || '#9E0B14',
      imageUrl: primaryImage,
      qty: 1,
      maxStock: firstInStockSize.stock,
    });
  };

  const handleOpenProduct = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigateToProduct(product.slug, imageWrapRef.current, {
      imageUrl: primaryImage,
      name: product.name,
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: Math.min((index || 0) * 0.05, 0.25) }}
      className="group rounded-[20px] bg-[#131316] border border-white/[0.08] hover:border-[var(--color-blush)]/25 overflow-hidden transition-colors duration-300 flex flex-col"
    >
      <Link
        to={`/product/${product.slug}`}
        onClick={handleOpenProduct}
        className="relative block aspect-[3/4] bg-[#0B0B0C] overflow-hidden"
      >
        <div
          ref={imageWrapRef}
          className="w-full h-full flex items-center justify-center p-4"
        >
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={`${product.name} in ${activeColour?.name || 'featured colour'}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain mix-blend-lighten garment-vignette transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#18181C] to-[#0B0B0C] p-6 text-center">
              <span className="font-editorial italic text-2xl text-white/75">{product.name}</span>
            </div>
          )}
        </div>

        <motion.button
          type="button"
          onClick={handleToggleHeart}
          whileTap={{ scale: 0.86 }}
          aria-label={isLiked ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={isLiked}
          className={`absolute top-3 right-3 z-10 w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors cursor-pointer ${
            isLiked
              ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'bg-[#0B0B0C]/80 border-white/15 text-white/80 hover:text-white hover:border-white/40'
          }`}
        >
          <AnimatePresence>
            {isLiked && (
              <motion.span
                key="pulse-ring"
                aria-hidden="true"
                initial={{ scale: 0.65, opacity: 0.7 }}
                animate={{ scale: 1.55, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="pointer-events-none absolute inset-0 rounded-full border border-[var(--color-primary)]"
              />
            )}
          </AnimatePresence>
          <motion.span
            animate={isLiked ? { scale: [1, 1.35, 0.9, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
            className="inline-flex items-center justify-center"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </motion.span>
        </motion.button>

        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={totalStock <= 0}
          aria-label={totalStock > 0 ? `Quick add ${product.name}` : `${product.name} out of stock`}
          className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-[#0B0B0C]/85 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-[var(--color-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
        </button>
      </Link>

      <div className="p-5 flex-1 flex flex-col gap-2">
        {product.colourways.length > 0 && (
          <div
            className="flex items-center gap-2 pt-0.5"
            role="group"
            aria-label={`Colourways for ${product.name}`}
          >
            {product.colourways.map((cw, idx) => {
              const selected = idx === selectedColourIdx;
              return (
                <button
                  key={`${cw.name}-${idx}`}
                  type="button"
                  onClick={() => setSelectedColourIdx(idx)}
                  aria-label={`Select colour ${cw.name}`}
                  aria-pressed={selected}
                  className={`w-5 h-5 rounded-full transition-all cursor-pointer ${
                    selected
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#131316]'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: cw.hex }}
                />
              );
            })}
          </div>
        )}

        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-blush)]/60">
          {[numLabel, product.badges[0]].filter(Boolean).join(' · ') || 'Women’s Limited Run'}
        </p>

        <Link
          to={`/product/${product.slug}`}
          onClick={handleOpenProduct}
          className="block"
        >
          <h3 className="font-editorial italic text-2xl text-white group-hover:text-[var(--color-blush)] transition-colors">
            {product.name}
          </h3>
        </Link>

        <p className="text-xs text-white/55 line-clamp-1">{product.fabric}</p>

        <div className="mt-auto pt-2 flex items-baseline gap-2.5 tabular-nums">
          <span className="text-sm font-semibold text-white">{formatPKR(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-white/45 line-through">
              {formatPKR(product.compareAtPrice)}
            </span>
          )}
          {totalStock <= 0 && (
            <span className="ml-auto text-[11px] font-medium text-red-400">Sold out</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
