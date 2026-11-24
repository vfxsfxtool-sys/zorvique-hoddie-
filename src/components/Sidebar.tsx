import { LayoutDashboard, Kanban, HardDrive, Terminal, Users, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'projects' | 'storage' | 'sql' | 'team' | 'rls' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  projectCount: number;
  fileCount: number;
}

export function Sidebar({ activeTab, onSelectTab, projectCount, fileCount }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects' as ActiveTab, label: 'Projects & Tasks', icon: Kanban, badge: projectCount },
    { id: 'storage' as ActiveTab, label: 'Storage Buckets', icon: HardDrive, badge: fileCount },
    { id: 'sql' as ActiveTab, label: 'SQL Playground', icon: Terminal },
    { id: 'team' as ActiveTab, label: 'Team Members', icon: Users },
    { id: 'rls' as ActiveTab, label: 'RLS & Security', icon: ShieldCheck },
    { id: 'settings' as ActiveTab, label: 'Supabase Config', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Supabase Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isActive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <ShieldCheck className="h-4 w-4" />
          <span>PostgreSQL Active</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Row Level Security (RLS) policies are active across all tables.
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
          <span className="text-slate-400">PostgreSQL</span>
          <span className="font-mono text-emerald-400">v15.2-supabase</span>
        </div>
      </div>
    </aside>
  );
}
