import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Mail } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { createSubscriber } from '../data/storefront';
import { validateSubscriberEmail } from '../utils/newsletter';
import { buildWhatsAppHref } from '../utils/whatsapp';

export function Footer() {
  const { settings, homepage } = useStore();
  const { showToast } = useToast();
  const year = new Date().getFullYear();

  const cmsNewsletter = homepage.sections.find((s) => s.type === 'newsletter');
  const newsletterTitle = cmsNewsletter?.title?.trim() || 'Early access before numbered drops sell out.';
  const newsletterBody =
    cmsNewsletter?.body?.trim() ||
    'Receive private drop alerts and restock notices from our Lahore studio.';

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [subscribedEmail, setSubscribedEmail] = useState('');

  const socialEntries = [
    { label: 'Instagram', href: settings.social.instagram },
    { label: 'Facebook', href: settings.social.facebook },
    { label: 'TikTok', href: settings.social.tiktok },
    {
      label: 'WhatsApp',
      href: buildWhatsAppHref(
        settings.social.whatsapp,
        `Hi ${settings.brandName}, I would like to enquire about your hoodies.`
      ),
    },
  ].filter((s) => Boolean(s.href));

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateSubscriberEmail(email);
    if (!check.valid) {
      setErrorMsg(check.error || 'Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const saved = await createSubscriber(check.email);
      setSubscribedEmail(saved.email);
      setEmail('');
      showToast({
        variant: 'success',
        title: `Subscribed to ${settings.brandName} Drops`,
        description: `${saved.email} has been added to early drop notifications.`,
      });
    } catch {
      setErrorMsg('Unable to subscribe right now. Please try again in a moment.');
      showToast({
        variant: 'error',
        title: 'Subscription failed',
        description: 'Could not save your email right now. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-white/[0.08] bg-[#0B0B0C] px-6 sm:px-10 pt-12 pb-24 sm:pb-24">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Newsletter Signup Strip */}
        <div className="rounded-2xl bg-[#131316] border border-white/[0.08] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-md space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
              Inner Circle Newsletter
            </p>
            <h2 className="font-editorial italic text-2xl sm:text-3xl text-white text-balance">
              {newsletterTitle}
            </h2>
            <p className="text-xs text-white/60 leading-relaxed">
              {newsletterBody}
            </p>
          </div>

          <div className="w-full lg:max-w-md space-y-2">
            <form onSubmit={handleSubscribe} noValidate className="flex flex-col sm:flex-row gap-2.5">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Footer newsletter email address
              </label>
              <div className="relative flex-1">
                <Mail
                  className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="footer-newsletter-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Enter your email address"
                  className="w-full min-h-[44px] pl-11 pr-4 py-2.5 rounded-full bg-[#0B0B0C] border border-white/15 text-sm text-white placeholder:text-white/35 focus:border-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] px-6 py-2.5 rounded-full bg-[var(--color-primary)] hover:opacity-90 text-white font-semibold text-xs uppercase tracking-[0.18em] inline-flex items-center justify-center gap-2 transition-opacity whitespace-nowrap disabled:opacity-50 cursor-pointer"
              >
                <span>{submitting ? 'Joining...' : 'Subscribe'}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </form>

            {errorMsg && (
              <p role="alert" className="text-xs text-red-400 px-2">
                {errorMsg}
              </p>
            )}
            {subscribedEmail && !errorMsg && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-400 px-2">
                <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Subscribed ({subscribedEmail}) — early drop access confirmed.</span>
              </p>
            )}
          </div>
        </div>

        {/* Bottom Copyright & Navigation Links */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] uppercase tracking-[0.2em] text-white/50">
          <div className="flex items-center gap-3">
            <span>&copy; {year} {settings.brandName}</span>
            <span aria-hidden="true">&middot;</span>
            <span className="hidden sm:inline">Limited Run &middot; No Restocks</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {socialEntries.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                {s.label}
              </a>
            ))}
            <Link
              to="/"
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              Rack
            </Link>
            <Link
              to="/track-order"
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              Track Order
            </Link>
            {settings.footerLinks
              .filter((link) => link.href !== '/track-order')
              .map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="hover:text-white transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
