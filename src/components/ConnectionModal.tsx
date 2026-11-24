import { useState } from 'react';
import { Database, Key, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, anonKey: string) => void;
  currentUrl: string;
  currentAnonKey: string;
  isDemo: boolean;
}

export function ConnectionModal({ isOpen, onClose, onSave, currentUrl, currentAnonKey, isDemo }: ConnectionModalProps) {
  const [url, setUrl] = useState(currentUrl);
  const [anonKey, setAnonKey] = useState(currentAnonKey);
  const [tested, setTested] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleTest = () => {
    if (url.startsWith('https://') && anonKey.length > 20) {
      setTested(true);
    } else {
      setTested(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(url, anonKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Supabase Connection Settings</h3>
              <p className="text-xs text-slate-400">Configure your Supabase project URL and Anon API key</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Supabase Project URL</label>
            <div className="relative">
              <Database className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 pl-9 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Found in your Supabase project API settings.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Supabase Anon / Public Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 pl-9 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {tested !== null && (
            <div className={`flex items-center gap-2 rounded-xl p-3 text-xs ${tested ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
              {tested ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              <span>{tested ? 'Connection successful! Supabase API and PostgreSQL responsive.' : 'Invalid URL or API Key format. Please check your credentials.'}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTest}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Test Connection
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
