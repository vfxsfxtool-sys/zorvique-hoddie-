import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Menu, MessageCircle, Search, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { buildWhatsAppHref } from '../utils/whatsapp';
import { GlobalSearchBar } from './GlobalSearchBar';

function toGothicDisplay(name: string): string {
  const clean = name.trim() || 'Zorvique';
  if (clean === clean.toUpperCase()) {
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }
  return clean;
}

export function Navbar() {
  const { settings, cart, wishlist, setCartOpen, setWishlistOpen } = useStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const brandTitle = toGothicDisplay(settings.brandName);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  const navItems = [
    { label: 'Rack', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: '3D Atelier', href: '/studio' },
    { label: 'Track Order', href: '/track-order' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full px-5 sm:px-8 lg:px-10 py-3.5 bg-[#0B0B0C]/90 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-6">
        <Link
          to="/"
          className="font-gothic text-2xl sm:text-3xl text-white tracking-wide whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 rounded-lg"
        >
          {brandTitle}
        </Link>

        <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-5 lg:gap-6">
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`text-[11px] font-medium uppercase tracking-[0.2em] transition-colors whitespace-nowrap shrink-0 ${
                  active ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <GlobalSearchBar
            inputId="global-nav-search"
            className="hidden lg:block w-56 xl:w-64"
          />

          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen((v) => !v);
              setMobileMenuOpen(false);
            }}
            aria-label="Search products and collections"
            aria-expanded={mobileSearchOpen}
            className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full border border-white/10 hover:border-white/30 text-white transition-colors cursor-pointer"
          >
            {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setWishlistOpen(true)}
            aria-label={`Open wishlist (${wishlist.length} saved)`}
            className="relative min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full border border-white/10 hover:border-white/30 text-white transition-colors cursor-pointer"
          >
            <Heart className="w-4 h-4" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {wishlist.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open shopping bag (${cartCount} items)`}
            className="relative min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full border border-white/10 hover:border-white/30 text-white transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen((v) => !v);
              setMobileSearchOpen(false);
            }}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full border border-white/10 text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="lg:hidden mt-3 max-w-7xl mx-auto">
          <GlobalSearchBar
            inputId="mobile-nav-search"
            autoFocus
            onAfterNavigate={() => setMobileSearchOpen(false)}
          />
        </div>
      )}

      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden mt-3 p-3 rounded-2xl glass-nav flex flex-col gap-1"
        >
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-xs uppercase tracking-[0.2em] transition-colors ${
                  active ? 'bg-white text-[#0B0B0C] font-semibold' : 'text-white/85 hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/page/shipping-returns"
            onClick={() => setMobileMenuOpen(false)}
            className={`px-4 py-3 rounded-xl text-xs uppercase tracking-[0.2em] transition-colors ${
              location.pathname === '/page/shipping-returns' || location.pathname === '/shipping'
                ? 'bg-white text-[#0B0B0C] font-semibold'
                : 'text-white/85 hover:bg-white/10'
            }`}
          >
            Shipping &amp; Returns
          </Link>
          <a
            href={buildWhatsAppHref(
              settings.social.whatsapp,
              `Hi ${settings.brandName}, I need help ordering a hoodie.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-1 px-4 py-3 rounded-xl bg-[#25D366]/15 border border-[#25D366]/40 text-xs uppercase tracking-[0.2em] text-[#86EFAC] hover:bg-[#25D366]/25 inline-flex items-center gap-2 font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>WhatsApp Help</span>
          </a>
        </nav>
      )}
    </header>
  );
}
