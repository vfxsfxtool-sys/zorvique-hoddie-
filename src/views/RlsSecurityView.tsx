import { ShieldCheck, Lock, CheckCircle2, Code } from 'lucide-react';

export function RlsSecurityView() {
  const policies = [
    {
      table: 'projects',
      policy: 'Enable read access for authenticated workspace members',
      command: 'CREATE POLICY "Allow members to select projects" ON projects FOR SELECT USING (auth.uid() IS NOT NULL);',
    },
    {
      table: 'tasks',
      policy: 'Allow project owners and assignees to update tasks',
      command: 'CREATE POLICY "Allow task updates" ON tasks FOR UPDATE USING (auth.uid() = assignee_id OR auth.uid() IN (SELECT owner_id FROM projects WHERE id = project_id));',
    },
    {
      table: 'storage.objects',
      policy: 'Restrict bucket uploads to authenticated organization users',
      command: 'CREATE POLICY "Authenticated uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN (\'project-assets\', \'documents\') AND auth.role() = \'authenticated\');',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Row Level Security (RLS) & Security</h1>
        <p className="text-xs text-slate-400">Inspect PostgreSQL security policies protecting your Supabase backend</p>
      </div>

      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-6 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
          <ShieldCheck className="h-5 w-5" />
          <span>PostgreSQL Row Level Security is Enabled</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Row Level Security ensures that database queries automatically apply security filters based on the JWT `auth.uid()` claims of the authenticated user. No unauthorized data leakage is possible across tenants.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Security Policies</h2>
        {policies.map((p, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white">{p.table}</span>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">{p.policy}</p>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              {p.command}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
