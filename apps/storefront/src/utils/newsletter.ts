export interface SubscriberValidationResult {
  valid: boolean;
  email: string;
  error?: string;
}

const SUBSCRIBER_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBSCRIBER_DOC_ID_RE = /^[a-zA-Z0-9_-]+$/;

export function validateSubscriberEmail(rawEmail: string): SubscriberValidationResult {
  const clean = (rawEmail || '').trim().toLowerCase();
  if (!clean) {
    return { valid: false, email: '', error: 'Please enter your email address.' };
  }
  if (clean.length < 3 || clean.length > 254 || !SUBSCRIBER_EMAIL_RE.test(clean)) {
    return { valid: false, email: clean, error: 'Please enter a valid email address.' };
  }
  return { valid: true, email: clean };
}

export function buildSubscriberDocId(nowMs: number = Date.now(), randomSuffix?: number): string {
  const suffix =
    typeof randomSuffix === 'number' && Number.isFinite(randomSuffix)
      ? Math.floor(Math.abs(randomSuffix)) % 900 + 100
      : Math.floor(100 + Math.random() * 900);
  const safeMs = Math.max(0, Math.floor(nowMs));
  const id = `sub_${safeMs}_${suffix}`;
  return SUBSCRIBER_DOC_ID_RE.test(id) ? id.slice(0, 128) : `sub_${Date.now()}_101`;
}
