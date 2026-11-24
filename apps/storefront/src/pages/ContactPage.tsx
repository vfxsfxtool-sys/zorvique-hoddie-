import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { createSubscriber, fetchPageBySlug } from '../data/storefront';
import { useStore } from '../context/StoreContext';
import type { CmsPage } from '../data/types';
import { SeoHead } from '../components/SeoHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { buildWhatsAppHref } from '../utils/whatsapp';

export function ContactPage() {
  const [searchParams] = useSearchParams();
  const pieceParam = searchParams.get('piece') || '';
  const { settings } = useStore();
  const [cmsContact, setCmsContact] = useState<CmsPage | null>(null);

  const [email, setEmail] = useState('');
  const [pieceNote, setPieceNote] = useState(pieceParam);
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setPieceNote(pieceParam);
  }, [pieceParam]);

  useEffect(() => {
    let active = true;
    fetchPageBySlug('contact')
      .then((res) => {
        if (active && res) setCmsContact(res);
      })
      .catch(() => {
        // Fallback to studio directory
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setStatus('error');
      setFeedback('Enter a valid email address so the studio can reply.');
      return;
    }
    setStatus('loading');
    setFeedback('');
    try {
      await createSubscriber(clean);
      setStatus('sent');
      setFeedback(
        pieceNote
          ? `Registered interest for "${pieceNote}". Our Lahore studio will notify ${clean}.`
          : `Request logged for ${clean}. Studio replies within two working days.`
      );
      setEmail('');
    } catch {
      setStatus('error');
      setFeedback('Unable to submit right now. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F4F4F5] flex flex-col">
      <SeoHead
        title={cmsContact?.title || 'Contact Studio'}
        description="Ask about sizing, holds, or Pakistan courier dispatch from Zorvique."
      />
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 sm:px-10 py-14 sm:py-24 space-y-12">
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
            Contact
          </p>
          <h1 className="font-editorial italic text-4xl sm:text-6xl text-white leading-[1.05]">
            {cmsContact?.title || 'Ask about a piece.'}
          </h1>
          <p className="text-base text-white/65 max-w-xl leading-relaxed">
            {cmsContact?.body ||
              'Sizing, studio holds, express courier timelines, or a run you missed. Write to us and someone from our Lahore studio replies within two working days.'}
          </p>
        </div>

        <div className="divide-y divide-white/10 border-y border-white/10">
          <div className="py-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">Studio</span>
            <span className="sm:col-span-2 text-sm text-white">Gulberg III, Lahore, Pakistan</span>
          </div>
          <div className="py-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">Hours</span>
            <span className="sm:col-span-2 text-sm text-white">Thursday to Saturday, 12:00 to 19:00 PKT</span>
          </div>
          <div className="py-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">Shipping</span>
            <span className="sm:col-span-2 text-sm text-white">
              TCS, Leopard &amp; Trax across Pakistan in 2 to 4 working days.
            </span>
          </div>
          <div className="py-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">WhatsApp</span>
            <a
              href={buildWhatsAppHref(
                settings.social.whatsapp,
                pieceNote
                  ? `Hi ${settings.brandName}, I'd like to enquire about "${pieceNote}".`
                  : `Hi ${settings.brandName}, I need assistance from the studio concierge.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:col-span-2 text-sm text-emerald-300 underline hover:text-emerald-200"
            >
              Message Studio Concierge ({settings.social.whatsapp || '03084540977'})
            </a>
          </div>
        </div>

        {/* Piece Availability / Private Hold Request */}
        <form
          onSubmit={handleRequestSubmit}
          noValidate
          className="rounded-[20px] bg-[#131316] border border-white/[0.08] p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-primary)]">
              Studio Enquiry &amp; Early Access
            </p>
            <h2 className="font-editorial italic text-2xl sm:text-3xl text-white">
              Request Piece Hold or Drop Alert
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="contact-piece" className="block text-[11px] uppercase tracking-[0.18em] text-white/55">
                Piece Reference (Optional)
              </label>
              <input
                id="contact-piece"
                type="text"
                value={pieceNote}
                onChange={(e) => setPieceNote(e.target.value)}
                placeholder="e.g. Obsidian Arch Hoodie (M)"
                className="w-full min-h-[44px] px-4 py-2.5 rounded-full bg-[#0B0B0C] border border-white/15 text-sm text-white placeholder:text-white/30 focus:border-white outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="block text-[11px] uppercase tracking-[0.18em] text-white/55">
                Your Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full min-h-[44px] px-4 py-2.5 rounded-full bg-[#0B0B0C] border border-white/15 text-sm text-white placeholder:text-white/30 focus:border-white outline-none"
              />
            </div>
          </div>

          {feedback && (
            <p className={`flex items-center gap-2 text-xs ${status === 'sent' ? 'text-emerald-400' : 'text-red-400'}`}>
              {status === 'sent' && <Check className="w-4 h-4 shrink-0" />}
              <span>{feedback}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-5 pt-1">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="min-h-[44px] px-7 py-3 rounded-full bg-[var(--color-primary)] hover:opacity-90 text-white text-[11px] uppercase tracking-[0.22em] font-semibold transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {status === 'loading' ? 'Sending...' : 'Notify Me / Enquire'}
            </button>
            <Link
              to="/"
              className="text-[11px] uppercase tracking-[0.22em] text-white/60 hover:text-white transition-colors"
            >
              Back to the Rack
            </Link>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
