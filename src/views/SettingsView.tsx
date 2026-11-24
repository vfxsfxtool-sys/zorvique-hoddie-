import { useState } from 'react';
import { Database, Key, CheckCircle2, RefreshCw, Shield, Save } from 'lucide-react';

interface SettingsViewProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDemo: boolean;
  onSaveConfig: (url: string, anonKey: string) => void;
  onResetData: () => void;
}

export function SettingsView({ supabaseUrl, supabaseAnonKey, isDemo, onSaveConfig, onResetData }: SettingsViewProps) {
  const [url, setUrl] = useState(supabaseUrl);
  const [anonKey, setAnonKey] = useState(supabaseAnonKey);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(url, anonKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Supabase Configuration & Settings</h1>
        <p className="text-xs text-slate-400">Connect Supaship Hub to your live Supabase project instance</p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Supabase Project URL</label>
          <div className="relative">
            <Database className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 pl-9 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
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
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 pl-9 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Supabase configuration updated successfully!</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onResetData}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Demo Data</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
