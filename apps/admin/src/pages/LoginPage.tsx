import { useState } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const {
    signIn,
    registerOwnerEmail,
    authError,
    clearAuthError,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setNotice(null);
    clearAuthError();

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setLocalError('Please enter your admin email and password.');
      return;
    }

    setSubmitting(true);
    try {
      try {
        await signIn(cleanEmail, password);
      } catch {
        try {
          await registerOwnerEmail(cleanEmail, password);
          await signIn(cleanEmail, password);
        } catch {
          await signIn(cleanEmail, password);
        }
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Invalid login credentials or unauthorized email.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = authError || localError;

  return (
    <div className="min-h-screen bg-[#121212] text-[#E4E2E1] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs text-[#E0C0AF] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Storefront</span>
        </a>

        <div className="rounded-2xl bg-[#1C1D1E] border border-white/10 p-8 sm:p-9 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#FF7A00] text-[#121212] font-display font-bold text-base flex items-center justify-center shrink-0">
                Z
              </span>
              <div>
                <h1 className="font-display text-xl font-semibold text-white">Zorvique Admin</h1>
                <p className="text-xs text-[#E0C0AF]">Store Operations &amp; Control Center</p>
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-[#FF7A00] shrink-0" aria-hidden="true" />
          </div>

          {displayError && (
            <div
              role="alert"
              className="rounded-xl bg-red-500/15 border border-red-500/30 p-4 text-xs text-red-200 space-y-3 leading-relaxed"
            >
              <p>{displayError}</p>
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3.5 text-xs text-emerald-200 leading-relaxed"
            >
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-medium text-[#E0C0AF]">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#E0C0AF]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. lessuse611@gmail.com"
                  className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[#FF7A00] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-medium text-[#E0C0AF]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#E0C0AF]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[#FF7A00] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#E0C0AF]/70 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] px-6 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#E65C00] text-[#121212] font-display font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Signing in...' : 'Sign In to Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
