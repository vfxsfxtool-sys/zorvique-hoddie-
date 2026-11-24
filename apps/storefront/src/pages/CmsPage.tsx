import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPageBySlug } from '../data/storefront';
import type { CmsPage as CmsPageType } from '../data/types';
import { SeoHead } from '../components/SeoHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

function renderMarkdownBlocks(markdown: string) {
  const lines = markdown.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-3" />;
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={i} className="font-editorial italic text-xl text-white pt-4">
          {trimmed.slice(4)}
        </h3>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={i} className="font-editorial italic text-2xl text-white pt-6">
          {trimmed.slice(3)}
        </h2>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h1 key={i} className="font-editorial italic text-3xl text-white pt-4">
          {trimmed.slice(2)}
        </h1>
      );
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <li key={i} className="ml-5 list-disc text-sm text-white/75 leading-relaxed">
          {trimmed.slice(2)}
        </li>
      );
    }
    return (
      <p key={i} className="text-sm sm:text-base text-white/75 leading-relaxed">
        {trimmed}
      </p>
    );
  });
}

export function CmsPage({ defaultSlug }: { defaultSlug?: string } = {}) {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || defaultSlug;
  const [page, setPage] = useState<CmsPageType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!slug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetchPageBySlug(slug);
        if (active) setPage(res);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col">
      <SeoHead
        title={page?.title || 'Information'}
        canonicalPath={slug ? `/page/${slug}` : undefined}
        noIndex={!loading && !page}
      />
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 sm:py-16">
        {loading ? (
          <div className="h-64 rounded-[24px] bg-[#131316] animate-pulse border border-white/[0.08]" />
        ) : !page ? (
          <div className="rounded-[24px] bg-[#131316] border border-white/10 p-10 text-center space-y-4">
            <h1 className="font-editorial italic text-3xl text-white">Page Not Published</h1>
            <p className="text-sm text-white/65">This page is currently unavailable or unpublished.</p>
            <Link
              to="/"
              className="inline-flex px-6 py-3 rounded-full bg-[var(--color-primary)] text-white text-xs font-semibold uppercase tracking-[0.18em]"
            >
              Return to Rack
            </Link>
          </div>
        ) : (
          <article className="rounded-[28px] bg-[#131316] border border-white/[0.08] p-8 sm:p-12 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
              Zorvique Atelier
            </p>
            <h1 className="font-editorial italic text-4xl sm:text-5xl text-white pb-4 border-b border-white/10">
              {page.title}
            </h1>
            <div className="space-y-2">{renderMarkdownBlocks(page.body)}</div>
            <div className="pt-6 border-t border-white/10 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex px-6 py-2.5 rounded-full bg-white text-[#0B0B0C] text-xs font-semibold uppercase tracking-[0.18em]"
              >
                Back to Rack
              </Link>
              <Link
                to="/track-order"
                className="inline-flex px-6 py-2.5 rounded-full border border-white/20 hover:border-white text-white text-xs font-medium uppercase tracking-[0.18em] transition-colors"
              >
                Track Order
              </Link>
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
