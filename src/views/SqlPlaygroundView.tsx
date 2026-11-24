import { useState } from 'react';
import { Terminal, Play, Database, CheckCircle2, Code2, Sparkles, Copy, Check } from 'lucide-react';
import { Project, Task, Profile, StorageFile } from '../types';

interface SqlPlaygroundViewProps {
  projects: Project[];
  tasks: Task[];
  team: Profile[];
  files: StorageFile[];
}

export function SqlPlaygroundView({ projects, tasks, team, files }: SqlPlaygroundViewProps) {
  const [query, setQuery] = useState('SELECT id, name, status, budget, progress FROM projects WHERE status = \'active\';');
  const [resultData, setResultData] = useState<any[] | null>(null);
  const [queryTime, setQueryTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleQueries = [
    {
      label: 'Select Active Projects',
      sql: 'SELECT id, name, status, budget, progress FROM projects WHERE status = \'active\';',
      execute: () => projects.filter(p => p.status === 'active'),
    },
    {
      label: 'List Urgent Tasks',
      sql: 'SELECT title, priority, status, due_date FROM tasks WHERE priority = \'urgent\';',
      execute: () => tasks.filter(t => t.priority === 'urgent'),
    },
    {
      label: 'Count Files by Bucket',
      sql: 'SELECT bucket, COUNT(*), SUM(size) FROM storage_objects GROUP BY bucket;',
      execute: () => {
        const map: Record<string, { count: number; totalSize: number }> = {};
        files.forEach(f => {
          if (!map[f.bucket]) map[f.bucket] = { count: 0, totalSize: 0 };
          map[f.bucket].count += 1;
          map[f.bucket].totalSize += f.size;
        });
        return Object.entries(map).map(([bucket, data]) => ({ bucket, file_count: data.count, total_bytes: data.totalSize }));
      },
    },
    {
      label: 'Team Members with Admin Role',
      sql: 'SELECT full_name, email, role, created_at FROM profiles WHERE role = \'admin\';',
      execute: () => team.filter(u => u.role === 'admin'),
    },
  ];

  const handleRunQuery = (customSql?: string, customExec?: () => any[]) => {
    const targetSql = customSql || query;
    const start = performance.now();
    let res: any[] = [];
    if (customExec) {
      res = customExec();
    } else {
      // Default fallback parsing
      if (targetSql.includes('projects')) res = projects;
      else if (targetSql.includes('tasks')) res = tasks;
      else if (targetSql.includes('profiles')) res = team;
      else res = files;
    }
    const end = performance.now();
    setQueryTime(Number((end - start).toFixed(2)));
    setResultData(res);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">PostgreSQL Query Playground</h1>
          <p className="text-xs text-slate-400">Run SQL queries against Supabase PostgreSQL database tables</p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? 'Copied SQL' : 'Copy SQL'}</span>
        </button>
      </div>

      {/* Quick Snippets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">Quick Queries:</span>
        {sampleQueries.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(sq.sql);
              handleRunQuery(sq.sql, sq.execute);
            }}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {sq.label}
          </button>
        ))}
      </div>

      {/* SQL Editor Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between bg-slate-950 px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold text-slate-300">sql_query_editor.sql</span>
          </div>
          <button
            onClick={() => handleRunQuery()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run SQL Query</span>
          </button>
        </div>

        <div className="p-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400 focus:border-emerald-500 focus:outline-none"
            placeholder="SELECT * FROM projects;"
          />
        </div>
      </div>

      {/* Query Results */}
      {resultData && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Query Results</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                {resultData.length} rows returned
              </span>
            </div>
            {queryTime !== null && (
              <span className="text-xs font-mono text-slate-400">⚡ {queryTime} ms execution time</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 bg-slate-950/60">
                <tr>
                  {resultData.length > 0 && Object.keys(resultData[0]).map((key) => (
                    <th key={key} className="px-4 py-3 font-mono">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {resultData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    {Object.values(row).map((val: any, i) => (
                      <td key={i} className="px-4 py-3 font-mono text-slate-200 truncate max-w-[200px]">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
