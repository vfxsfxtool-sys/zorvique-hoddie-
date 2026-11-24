import { useState } from 'react';
import { Kanban as KanbanIcon, Plus, CheckCircle2, Clock, AlertTriangle, User, Calendar, Filter } from 'lucide-react';
import { Project, Task, Profile, TaskStatus } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  team: Profile[];
  onOpenNewProject: () => void;
  onOpenNewTask: () => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
}

export function ProjectsView({
  projects,
  tasks,
  team,
  onOpenNewProject,
  onOpenNewTask,
  onUpdateTaskStatus,
}: ProjectsViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filteredTasks = tasks.filter((task) => {
    if (selectedProjectId !== 'all' && task.project_id !== selectedProjectId) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'backlog', label: 'Backlog', color: 'border-slate-700 bg-slate-900/40' },
    { id: 'todo', label: 'To Do', color: 'border-blue-500/30 bg-blue-950/10' },
    { id: 'in_progress', label: 'In Progress', color: 'border-emerald-500/30 bg-emerald-950/10' },
    { id: 'review', label: 'Review', color: 'border-amber-500/30 bg-amber-950/10' },
    { id: 'done', label: 'Done', color: 'border-teal-500/30 bg-teal-950/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Projects & Agile Tasks</h1>
          <p className="text-xs text-slate-400">PostgreSQL table sync with live task kanban board</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none capitalize"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className={`flex flex-col rounded-2xl border ${col.color} p-4 min-h-[500px]`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">{col.label}</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                {colTasks.map((task) => {
                  const assignee = team.find((u) => u.id === task.assignee_id);
                  const project = projects.find((p) => p.id === task.project_id);
                  return (
                    <div
                      key={task.id}
                      className="group relative rounded-xl border border-slate-800/90 bg-slate-950/80 p-3.5 shadow-sm hover:border-slate-700 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-emerald-400 truncate max-w-[120px]">
                          {project?.name || 'Project'}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          task.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-white leading-snug">{task.title}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          {assignee ? (
                            <img src={assignee.avatar_url} alt={assignee.full_name} className="h-5 w-5 rounded-full object-cover" />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-300">?</div>
                          )}
                          <span className="truncate max-w-[80px]">{assignee?.full_name.split(' ')[0]}</span>
                        </div>

                        <select
                          value={task.status}
                          onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                          className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-300 border border-slate-800 focus:outline-none"
                        >
                          <option value="backlog">Backlog</option>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-800 text-[11px] text-slate-600">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
