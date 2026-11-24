import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { buildWhatsAppHref } from '../utils/whatsapp';

export function WhatsAppHelplineButton() {
  const { settings } = useStore();
  const location = useLocation();

  const href = buildWhatsAppHref(
    settings.social.whatsapp,
    `Hi ${settings.brandName}, I need help ordering a hoodie.`
  );

  // Keep clear of the bottom crimson marquee ticker on '/' and 3D Atelier dock on '/studio' across mobile, tablet, and desktop
  const positionClass =
    location.pathname === '/studio'
      ? 'bottom-28 right-3.5 md:bottom-6 md:right-5'
      : location.pathname === '/'
        ? 'bottom-12 right-3.5 sm:bottom-14 sm:right-5'
        : 'bottom-4 right-3.5 sm:bottom-5 sm:right-5';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp Helpline"
      title="WhatsApp Helpline"
      className={`fixed ${positionClass} z-40 min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-[#052E16] border border-[#BBF7D0]/60 shadow-[0_10px_28px_rgba(0,0,0,0.55)] inline-flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 print:hidden`}
    >
      <MessageCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 stroke-[2.25]" />
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] whitespace-nowrap">
        <span className="sm:hidden">WhatsApp</span>
        <span className="hidden sm:inline">WhatsApp Help</span>
      </span>
    </a>
  );
}
