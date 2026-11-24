import { useState } from 'react';
import { Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { createSubscriber } from '../data/storefront';
import { validateSubscriberEmail } from '../utils/newsletter';

interface NewsletterSectionProps {
  title?: string;
  body?: string;
}

export function NewsletterSection({
  title = 'First access before the rack sells out.',
  body = 'Small batch hoodies released in runs of forty or fewer. Join the list for private drop links and early sizing access.',
}: NewsletterSectionProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const checked = validateSubscriberEmail(email);
    if (!checked.valid) {
      setStatus('error');
      setMessage(checked.error || 'Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const saved = await createSubscriber(checked.email);
      setStatus('success');
      setMessage('You are on the early-access drop list.');
      setEmail('');
      showToast({
        variant: 'success',
        title: 'Subscribed to Zorvique Drops',
        description: `${saved.email} has been added to early drop notifications.`,
      });
    } catch {
      setStatus('error');
      setMessage('Could not subscribe right now. Please try again.');
    }
  };

  return (
    <section id="newsletter" className="px-6 py-14 sm:py-20">
      <div className="max-w-7xl mx-auto rounded-[24px] bg-gradient-to-r from-[#1A0D10] via-[#131316] to-[#1A0D10] border border-[var(--color-primary)]/30 p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 crimson-glow">
        <div className="max-w-xl space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
            Early Drop Access
          </p>
          <h2 className="font-editorial italic text-3xl sm:text-4xl text-white text-balance">
            {title}
          </h2>
          <p className="text-sm text-white/65 leading-relaxed">{body}</p>
        </div>

        <div className="w-full lg:max-w-md space-y-2">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col sm:flex-row gap-3">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 min-h-[44px] px-5 py-3 rounded-full bg-[#0B0B0C] border border-white/15 text-sm text-white placeholder:text-white/35 focus:border-white outline-none"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="min-h-[44px] px-7 py-3 rounded-full bg-[var(--color-primary)] hover:opacity-90 text-white font-semibold text-xs uppercase tracking-[0.2em] transition-opacity whitespace-nowrap disabled:opacity-50 cursor-pointer"
            >
              {status === 'loading' ? 'Joining...' : 'Join List'}
            </button>
          </form>
          {status === 'success' && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-400 px-2">
              <Check className="w-3.5 h-3.5" />
              <span>{message}</span>
            </p>
          )}
          {status === 'error' && <p className="text-xs text-red-400 px-2">{message}</p>}
        </div>
      </div>
    </section>
  );
}
