import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Activity, 
  DollarSign, 
  Bell, 
  Sliders, 
  Users, 
  FileText, 
  Download, 
  LogOut, 
  ShieldCheck, 
  Crown, 
  RefreshCw, 
  ExternalLink,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileCode2,
  ChevronRight
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLoginView } from './AdminLoginView';
import { OverviewSection } from './OverviewSection';
import { UsageAnalyticsSection } from './UsageAnalyticsSection';
import { CrashlyticsSection } from './CrashlyticsSection';
import { AdMobSection } from './AdMobSection';
import { AnnouncementsConfigSection } from './AnnouncementsConfigSection';
import { AdSettingsSection } from './AdSettingsSection';
import { TeamManagementSection } from './TeamManagementSection';
import { AuditLogsSection } from './AuditLogsSection';
import { ExportCsvModal } from './ExportCsvModal';
import { 
  fetchAppConfig, 
  fetchDailyAnalytics, 
  fetchCrashReports, 
  fetchAdMobMetrics, 
  fetchAdminsList, 
  fetchAuditLogs,
  DEFAULT_APP_CONFIG
} from '../../services/adminService';
import { 
  AppConfigDoc, 
  DailyAnalyticsDoc, 
  CrashReportDoc, 
  AdMobMetricDoc, 
  AdminProfile, 
  AuditLogItem 
} from '../../services/firebase';
import firebaseConfig from '../../../firebase-applet-config.json';

type AdminTab = 
  | 'OVERVIEW' 
  | 'USAGE' 
  | 'CRASHLYTICS' 
  | 'ADMOB' 
  | 'ANNOUNCEMENTS' 
  | 'AD_SETTINGS' 
  | 'TEAM' 
  | 'AUDIT_LOGS';

export const WebAdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    adminProfile, 
    role, 
    loading: authLoading, 
    signOut, 
    isOwner, 
    isAdmin, 
    isAnalyst,
  } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [config, setConfig] = useState<AppConfigDoc>(DEFAULT_APP_CONFIG);
  const [analytics, setAnalytics] = useState<DailyAnalyticsDoc[]>([]);
  const [crashes, setCrashes] = useState<CrashReportDoc[]>([]);
  const [admobMetrics, setAdmobMetrics] = useState<AdMobMetricDoc[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [cfg, anl, crs, adm, admList, logs] = await Promise.all([
        fetchAppConfig().catch(() => DEFAULT_APP_CONFIG),
        fetchDailyAnalytics().catch(() => []),
        fetchCrashReports().catch(() => []),
        fetchAdMobMetrics().catch(() => []),
        fetchAdminsList().catch(() => []),
        fetchAuditLogs().catch(() => [])
      ]);

      setConfig(cfg || DEFAULT_APP_CONFIG);
      setAnalytics(anl || []);
      setCrashes(crs || []);
      setAdmobMetrics(adm || []);
      setAdmins(admList || []);
      setAuditLogs(logs || []);
    } catch (err) {
      console.warn('Dashboard data fetch partial failure:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminProfile) {
      loadAllData();
    }
  }, [adminProfile]);



  // If auth is loading, render clean spinner
  if (authLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="text-xs font-mono text-slate-400">Verifying administrator authorization...</span>
      </div>
    );
  }

  // If not authenticated or not in an admin role, show Login Gate
  if (!adminProfile) {
    return <AdminLoginView />;
  }

  return (
    <div className="space-y-6">
      {/* Top Admin Identity & Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20 shrink-0">
            OD
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-white">OD Status Saver Admin Console</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wide border ${
                role === 'owner' 
                  ? 'bg-purple-950 text-purple-300 border-purple-500/40' 
                  : role === 'administrator'
                  ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
              }`}>
                Role: {role?.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-mono">
              <span>Account: <b className="text-slate-200">{adminProfile.email}</b></span>
              <span>•</span>
              <span className="truncate max-w-[220px]">DB: {firebaseConfig.firestoreDatabaseId}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start lg:self-center flex-wrap">


          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={signOut}
            className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>



      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('USAGE')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'USAGE'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Usage Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('CRASHLYTICS')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'CRASHLYTICS'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-400" />
          <span>Crashlytics</span>
        </button>

        <button
          onClick={() => setActiveTab('ADMOB')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'ADMOB'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span>AdMob Performance</span>
        </button>

        <button
          onClick={() => setActiveTab('ANNOUNCEMENTS')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'ANNOUNCEMENTS'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Announcements & Flags</span>
        </button>

        <button
          onClick={() => setActiveTab('AD_SETTINGS')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'AD_SETTINGS'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ad Placement Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('TEAM')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'TEAM'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === 'OVERVIEW' && (
          <OverviewSection
            analytics={analytics}
            onRefresh={loadAllData}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'USAGE' && (
          <UsageAnalyticsSection analytics={analytics} />
        )}

        {activeTab === 'CRASHLYTICS' && (
          <CrashlyticsSection reports={crashes} onRefresh={loadAllData} />
        )}

        {activeTab === 'ADMOB' && (
          <AdMobSection metrics={admobMetrics} />
        )}

        {activeTab === 'ANNOUNCEMENTS' && (
          <AnnouncementsConfigSection config={config} onRefreshConfig={loadAllData} />
        )}

        {activeTab === 'AD_SETTINGS' && (
          <AdSettingsSection config={config} onRefreshConfig={loadAllData} />
        )}

        {activeTab === 'TEAM' && (
          <TeamManagementSection admins={admins} onRefresh={loadAllData} />
        )}

        {activeTab === 'AUDIT_LOGS' && (
          <AuditLogsSection
            logs={auditLogs}
            onRefresh={loadAllData}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* CSV Export Dialog */}
      <ExportCsvModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        analytics={analytics}
      />
    </div>
  );
};
