import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  ExternalLink,
  Flame,
  Check,
  RotateCw
} from 'lucide-react';
import { CrashReportDoc } from '../../services/firebase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { updateCrashStatus } from '../../services/adminService';

interface CrashlyticsSectionProps {
  reports: CrashReportDoc[];
  onRefresh: () => void;
}

export const CrashlyticsSection: React.FC<CrashlyticsSectionProps> = ({ reports, onRefresh }) => {
  const { isAdmin, currentUser, adminProfile } = useAdminAuth();

  const handleStatusChange = async (reportId: string, status: 'open' | 'investigating' | 'resolved') => {
    if (!isAdmin) return;
    const actorEmail = adminProfile?.email || currentUser?.email || 'admin';
    const actorUid = adminProfile?.uid || currentUser?.uid || 'uid';
    await updateCrashStatus(reportId, status, actorUid, actorEmail);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* App Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Crash-Free Users</span>
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">99.85%</div>
          <p className="text-[11px] text-slate-400 mt-1">Benchmark &gt; 99.5% met</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Crash-Free Sessions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">99.92%</div>
          <p className="text-[11px] text-slate-400 mt-1">Over 21,700 clean sessions</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Open Non-Fatal Issues</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">
            {reports.filter(r => r.status !== 'resolved').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Actively triaged by engineering</p>
        </div>
      </div>

      {/* Crashlytics Privacy Policy Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white">Zero Sensitive Data Exposure</h4>
            <p className="text-slate-400 mt-0.5">
              Crashlytics custom keys capture only technical exception types and Android API versions. Never attaches WhatsApp phone numbers, contact strings, or media paths.
            </p>
          </div>
        </div>
        <a 
          href="https://console.firebase.google.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
        >
          <span>Firebase Console</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-400" />
          Logged Crash & Non-Fatal Exceptions
        </h3>

        {reports.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-500">
            No active crashes reported. The mobile application is performing within healthy baseline thresholds.
          </div>
        ) : (
          reports.map((report) => (
            <div 
              key={report.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    report.status === 'open' 
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                      : report.status === 'investigating'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                  }`}>
                    {report.status}
                  </span>
                  <span className="text-white font-mono font-bold text-xs">
                    {report.exceptionType}
                  </span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-slate-400 text-xs font-mono">
                    {report.occurrences} occurrence{report.occurrences > 1 ? 's' : ''}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-sans">
                  {report.message}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                  <span>App: v{report.appVersion}</span>
                  <span>OS: {report.androidVersion}</span>
                  <span>Device: {report.deviceModel}</span>
                  <span>Last Seen: {new Date(report.lastSeen).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Status Action Buttons (Role-gated) */}
              {isAdmin && (
                <div className="flex items-center gap-1.5 self-start md:self-center shrink-0">
                  <button
                    onClick={() => handleStatusChange(report.id, 'open')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      report.status === 'open' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleStatusChange(report.id, 'investigating')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      report.status === 'investigating' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Investigating
                  </button>
                  <button
                    onClick={() => handleStatusChange(report.id, 'resolved')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      report.status === 'resolved' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
