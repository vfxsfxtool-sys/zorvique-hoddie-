import { FolderKanban, CheckSquare, HardDrive, Users, ArrowUpRight, Plus, Terminal, ShieldCheck } from 'lucide-react';
import { Project, Task, StorageFile, Profile, ActivityLog } from '../types';

interface DashboardViewProps {
  projects: Project[];
  tasks: Task[];
  files: StorageFile[];
  team: Profile[];
  activities: ActivityLog[];
  onOpenNewProject: () => void;
  onOpenNewTask: () => void;
  onNavigate: (tab: any) => void;
}

export function DashboardView({
  projects,
  tasks,
  files,
  team,
  activities,
  onOpenNewProject,
  onOpenNewTask,
  onNavigate,
}: DashboardViewProps) {
  const activeProjectsCount = projects.filter((p) => p.status === 'active').length;
  const completedTasksCount = tasks.filter((t) => t.status === 'done').length;
  const totalStorageBytes = files.reduce((acc, f) => acc + f.size, 0);
  const storageMB = (totalStorageBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-8 shadow-xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Supabase PostgreSQL + RLS Enabled</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Supabase SaaS Workspace Hub
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Manage PostgreSQL tables, Supabase Auth user sessions, Storage buckets, and Realtime Kanban workflows in one unified dashboard.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenNewProject}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </button>
            <button
              onClick={onOpenNewTask}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('projects')}
          className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-emerald-500/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <FolderKanban className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{activeProjectsCount} <span className="text-xs font-normal text-slate-400">/ {projects.length}</span></div>
            <div className="text-xs font-medium text-slate-400 mt-0.5">Active Projects</div>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('projects')}
          className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-blue-500/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <CheckSquare className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{completedTasksCount} <span className="text-xs font-normal text-slate-400">completed</span></div>
            <div className="text-xs font-medium text-slate-400 mt-0.5">Agile Tasks</div>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('storage')}
          className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-indigo-500/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <HardDrive className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{storageMB} MB <span className="text-xs font-normal text-slate-400">({files.length} files)</span></div>
            <div className="text-xs font-medium text-slate-400 mt-0.5">Storage Buckets</div>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('team')}
          className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-violet-500/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/30">
              <Users className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{team.length} <span className="text-xs font-normal text-slate-400">members</span></div>
            <div className="text-xs font-medium text-slate-400 mt-0.5">Supabase Auth Users</div>
          </div>
        </div>
      </div>

      {/* Grid: Projects Summary & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Overview */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Workspace Projects</h2>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              View All Kanban →
            </button>
          </div>

          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">{project.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      project.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{project.description}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-semibold text-slate-200">${project.budget.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">Budget</div>
                  </div>
                  <div className="w-24">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold text-white">{project.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Activity Feed</h2>
            <Terminal className="h-4 w-4 text-emerald-400" />
          </div>

          <div className="space-y-4 pt-2">
            {activities.map((act) => (
              <div key={act.id} className="flex gap-3 text-xs">
                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                <div className="space-y-0.5">
                  <div className="text-slate-300">
                    <span className="font-semibold text-white">{act.user_email.split('@')[0]}</span> {act.action}{' '}
                    <span className="font-medium text-emerald-400">"{act.target}"</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => onNavigate('sql')}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Open SQL Query Playground →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
