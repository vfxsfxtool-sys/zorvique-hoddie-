import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { fetchPageBySlug } from '../data/storefront';
import type { CmsPage } from '../data/types';
import { SeoHead } from '../components/SeoHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export function AboutPage() {
  const [cmsAbout, setCmsAbout] = useState<CmsPage | null>(null);

  useEffect(() => {
    let active = true;
    fetchPageBySlug('about')
      .then((res) => {
        if (active && res) setCmsAbout(res);
      })
      .catch(() => {
        // Fallback to editorial copy if pages/about does not exist
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F4F4F5] flex flex-col">
      <SeoHead
        title={cmsAbout?.title || 'About Zorvique'}
        description="Women's heavyweight hoodies crafted in small runs in Lahore, then never again."
      />
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 max-w-4xl w-full mx-auto px-6 sm:px-10 py-14 sm:py-24 space-y-12"
      >
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
            Women&apos;s Atelier &middot; Lahore
          </p>
          <h1 className="font-editorial italic text-4xl sm:text-6xl text-white leading-[1.05] text-balance">
            {cmsAbout?.title || 'Hoodies tailored for women in small runs, then never again.'}
          </h1>
        </div>

        <div className="space-y-6 text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
          {cmsAbout?.body ? (
            cmsAbout.body.split('\n\n').map((para, i) => <p key={i}>{para}</p>)
          ) : (
            <>
              <p>
                Zorvique is a women&apos;s heavyweight label run out of a studio in Lahore. We draft every shoulder line and hood drape from scratch, sew a numbered batch of forty or fewer, and when a run finishes we move on to the next study.
              </p>
              <p>
                Every garment on the rack begins with 460–500 gsm long-staple combed cotton selected for effortless drape—giving structured warmth without stiff bulk across the neckline, sleeves, and waist.
              </p>
              <p>
                We don&apos;t restock and we don&apos;t chase seasons. If a silhouette on the rail speaks to you, it&apos;s best not to wait.
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-y border-white/10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-blush)]/65">Atelier</p>
            <p className="mt-1.5 text-sm font-medium text-white">Gulberg III, Lahore</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-blush)]/65">Cut &amp; Drape</p>
            <p className="mt-1.5 text-sm font-medium text-white">Tailored Women&apos;s Drop-Shoulder</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-blush)]/65">Restocks</p>
            <p className="mt-1.5 text-sm font-medium text-white tabular-nums">40 pieces or fewer &middot; Never repeated</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <Link
            to="/"
            className="min-h-[44px] px-7 py-3 rounded-full border border-white/25 hover:border-white hover:bg-white hover:text-[#0B0B0C] text-[11px] uppercase tracking-[0.22em] font-medium text-white inline-flex items-center transition-all"
          >
            See the Rack
          </Link>
          <Link
            to="/contact"
            className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-blush)]/75 hover:text-white transition-colors"
          >
            Contact Studio
          </Link>
        </div>
      </motion.main>

      <Footer />
    </div>
  );
}
