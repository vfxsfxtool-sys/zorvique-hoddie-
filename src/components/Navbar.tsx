import { Database, Bell, Shield, Sparkles, User, LogOut, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Profile } from '../types';

interface NavbarProps {
  currentUser: Profile;
  onOpenSettings: () => void;
  isDemo: boolean;
  supabaseUrl: string;
}

export function Navbar({ currentUser, onOpenSettings, isDemo, supabaseUrl }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-lg">Supaship<span className="text-emerald-400">Hub</span></span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">Supabase SaaS Workspace</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 ml-6 pl-6 border-l border-slate-800">
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              isDemo
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isDemo ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
            <Database className="h-3 w-3" />
            <span>{isDemo ? 'Demo Mode (Mock DB)' : 'Connected to Supabase'}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="https://supabase.com/docs"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>Supabase Docs</span>
          <ExternalLink className="h-3 w-3 text-slate-400" />
        </a>

        <div className="relative">
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500" />
          </button>
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <img
            src={currentUser.avatar_url}
            alt={currentUser.full_name}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-500/30"
          />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-white">{currentUser.full_name}</div>
            <div className="text-[10px] text-slate-400 capitalize">{currentUser.role} • {currentUser.email}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
