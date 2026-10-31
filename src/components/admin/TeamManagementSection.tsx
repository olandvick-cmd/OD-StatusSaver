import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { AdminProfile } from '../../services/firebase';

interface TeamManagementSectionProps { admins: AdminProfile[]; onRefresh: () => void; }

export const TeamManagementSection: React.FC<TeamManagementSectionProps> = ({ admins }) => (
  <div className="space-y-6">
    <div className="bg-slate-900/60 border border-amber-700/40 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-amber-300 font-bold text-sm"><Lock className="w-4 h-4" /> Team changes are temporarily locked</div>
      <p className="text-xs text-slate-300 mt-2">Administrator provisioning is not enabled yet. New team members must be added through a trusted Firebase Admin SDK workflow. This console will not create administrator records from email addresses or guessed user IDs.</p>
    </div>
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2 text-white font-bold text-sm"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Authorized administrators</div>
      <div className="overflow-x-auto"><table className="w-full text-left text-xs">
        <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px]"><tr><th className="py-3 px-4">Account</th><th className="py-3 px-4">Role</th><th className="py-3 px-4">Added</th></tr></thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-300">
          {admins.map(admin => <tr key={admin.uid}><td className="py-3 px-4"><div className="font-semibold text-white">{admin.email}</div><div className="text-[10px] text-slate-500 font-mono">{admin.uid}</div></td><td className="py-3 px-4 uppercase font-mono">{admin.role}</td><td className="py-3 px-4 text-slate-400">{admin.addedAt ? new Date(admin.addedAt).toLocaleDateString() : 'Initial'}</td></tr>)}
          {admins.length === 0 && <tr><td colSpan={3} className="py-6 px-4 text-center text-slate-500">No administrator records available.</td></tr>}
        </tbody></table></div>
    </div>
  </div>
);
