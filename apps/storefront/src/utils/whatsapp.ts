export const DEFAULT_WHATSAPP_NUMBER = '03084540977';

export function buildWhatsAppHref(rawSetting?: string | null, prefillMessage?: string): string {
  const rawEnv =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_WHATSAPP_NUMBER
      ? String(import.meta.env.VITE_WHATSAPP_NUMBER)
      : '';
  const candidate = (rawSetting || rawEnv || DEFAULT_WHATSAPP_NUMBER).trim();
  const encodedText = prefillMessage ? encodeURIComponent(prefillMessage) : '';

  // If store settings include an explicit URL (wa.me, api.whatsapp.com, whatsapp.com), preserve it safely
  if (/^https?:\/\//i.test(candidate)) {
    try {
      const parsed = new URL(candidate);
      if (encodedText && !parsed.searchParams.has('text')) {
        parsed.searchParams.set('text', prefillMessage!);
      }
      return parsed.toString();
    } catch {
      return encodedText ? `https://wa.me/923084540977?text=${encodedText}` : 'https://wa.me/923084540977';
    }
  }

  // Normalize Pakistan phone digits (+92 3XX XXXXXXX or 03XX XXXXXXX)
  let digits = candidate.replace(/[^\d]/g, '');
  if (/^03\d{9}$/.test(digits)) {
    digits = `92${digits.slice(1)}`;
  }

  if (digits.length >= 10) {
    return encodedText ? `https://wa.me/${digits}?text=${encodedText}` : `https://wa.me/${digits}`;
  }

  return encodedText ? `https://wa.me/923084540977?text=${encodedText}` : 'https://wa.me/923084540977';
}
