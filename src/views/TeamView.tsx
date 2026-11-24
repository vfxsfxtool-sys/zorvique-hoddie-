import { Users, Shield, Mail, Calendar, UserPlus } from 'lucide-react';
import { Profile } from '../types';

interface TeamViewProps {
  team: Profile[];
}

export function TeamView({ team }: TeamViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Team Members & Supabase Auth</h1>
          <p className="text-xs text-slate-400">Manage user accounts, roles, and authentication metadata</p>
        </div>

        <button
          onClick={() => alert('Invite member link generated via Supabase Auth invite API.')}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
        >
          <UserPlus className="h-4 w-4" />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-4">
              <img
                src={member.avatar_url}
                alt={member.full_name}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-emerald-500/30"
              />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">{member.full_name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{member.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400">Role</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                member.role === 'admin' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                member.role === 'member' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                'bg-slate-800 text-slate-400'
              }`}>
                {member.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
