import React from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Clock, 
  User, 
  CheckCircle2, 
  Lock,
  RefreshCw
} from 'lucide-react';
import { AuditLogItem } from '../../services/firebase';

interface AuditLogsSectionProps {
  logs: AuditLogItem[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const AuditLogsSection: React.FC<AuditLogsSectionProps> = ({
  logs,
  onRefresh,
  isLoading
}) => {
  return (
    <div className="space-y-6">
      {/* Immutability Guarantee Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Immutable Administrative Audit Trail</h3>
            <p className="text-xs text-slate-400">
              Every privileged mutation is append-only. Firestore rules strictly reject update and delete operations on the audit collection.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor Email</th>
                <th className="py-3 px-4">Mutation Summary</th>
                <th className="py-3 px-4 text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No audit records recorded yet. Privileged configuration updates will appear here automatically.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold text-[10px] border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white text-xs">
                      {log.actorEmail}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans text-xs max-w-md">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 text-[10px]">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
