import { Link } from 'react-router-dom';
import { SeoHead } from '../components/SeoHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col">
      <SeoHead title="Page Not Found" />
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="rounded-[28px] bg-[var(--color-surface)] border border-white/[0.08] p-10 sm:p-12 text-center max-w-md space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">404</p>
          <h1 className="font-display text-3xl font-semibold text-white">Page Not Found</h1>
          <p className="text-sm text-[#E0C0AF]">
            The page you requested does not exist or has moved.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/"
              className="px-6 py-3 rounded-full bg-[var(--color-primary)] text-[#121212] text-sm font-semibold"
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="px-6 py-3 rounded-full border border-white/15 text-white text-sm font-medium hover:bg-white/10"
            >
              Shop Hoodies
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
