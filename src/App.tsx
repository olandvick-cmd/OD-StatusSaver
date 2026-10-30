import React, { useState } from 'react';
import { 
  Smartphone, Sliders, FileCode, HardDrive, 
  CheckCircle, ShieldCheck, Download, ExternalLink,
  Layers, Sparkles, Terminal
} from 'lucide-react';
import { AndroidSimulator } from './components/AndroidSimulator';
import { WebAdminDashboard } from './components/admin/WebAdminDashboard';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CodeExplorer } from './components/CodeExplorer';
import { StorageMatrix } from './components/StorageMatrix';
import { INITIAL_STATUSES, DEFAULT_CONFIG, SimulatedStatus, RemoteConfigSettings } from './data/mockAndroidData';

interface AnalyticsEventRecord {
  name: string;
  params: Record<string, any>;
  timestamp: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'ADMIN' | 'CODE' | 'STORAGE'>('SIMULATOR');
  const [statuses, setStatuses] = useState<SimulatedStatus[]>(INITIAL_STATUSES);
  const [config, setConfig] = useState<RemoteConfigSettings>(DEFAULT_CONFIG);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEventRecord[]>([
    {
      name: 'app_open',
      params: { platform: 'android', app_version: '1.0.0' },
      timestamp: Date.now() - 120000
    },
    {
      name: 'source_selected',
      params: { source: 'whatsapp' },
      timestamp: Date.now() - 60000
    },
    {
      name: 'status_list_viewed',
      params: { source: 'whatsapp', item_count: 4, media_filter: 'all' },
      timestamp: Date.now() - 30000
    }
  ]);

  const handleTrackEvent = (name: string, params: Record<string, any>) => {
    setAnalyticsEvents(prev => [...prev, { name, params, timestamp: Date.now() }]);
  };

  const handleSaveStatus = (id: string) => {
    setStatuses(prev => prev.map(s => s.id === id ? { ...s, isSaved: true } : s));
  };

  const handleDeleteStatus = (id: string) => {
    setStatuses(prev => prev.map(s => s.id === id ? { ...s, isSaved: false } : s));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-extrabold flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20">
              OD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-white">OD Status Saver</h1>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Firebase Analytics & Crashlytics Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Native Kotlin Android Project & Companion Web Admin Console
              </p>
            </div>
          </div>

          {/* Navigation Pill */}
          <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('SIMULATOR')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'SIMULATOR'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Live App Simulation</span>
            </button>
            <button
              onClick={() => setActiveTab('ADMIN')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'ADMIN'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Web Admin Console</span>
            </button>
            <button
              onClick={() => setActiveTab('CODE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'CODE'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Kotlin Sources</span>
            </button>
            <button
              onClick={() => setActiveTab('STORAGE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'STORAGE'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Release Audit & QA</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full flex-1 p-6">
        {activeTab === 'SIMULATOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Phone Simulator Frame */}
            <div className="lg:col-span-5 flex justify-center">
              <AndroidSimulator
                statuses={statuses}
                onSaveStatus={handleSaveStatus}
                onDeleteStatus={handleDeleteStatus}
                config={config}
                onTrackEvent={handleTrackEvent}
              />
            </div>

            {/* Architecture Highlights & Guide */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  Firebase Analytics & Crashlytics Integration
                </div>
                <h2 className="text-xl font-extrabold text-white mb-3">
                  Privacy-First Analytics Without PII or Media Exposure
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Integrated with Firebase BoM 33.5.1 using controlled event parameters. Analytics and Crashlytics are fully decoupled from the core media discovery and saving engine.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <p className="font-bold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      Zero PII / Filenames
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1">
                      No phone numbers, contacts, media filenames, or file paths are ever passed to Firebase.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <p className="font-bold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      User Consent Control
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Users can disable analytics in Settings, immediately silencing collection.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <p className="font-bold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      Controlled Source Enum
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Sources strictly tracked as <code className="text-emerald-400">whatsapp</code> or <code className="text-emerald-400">whatsapp_business</code>.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <p className="font-bold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      Graceful Offline Fallback
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1">
                      If Firebase or Google Play Services is absent, status discovery works without disruption.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Details Overview */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-3">
                <h3 className="font-bold text-sm text-slate-200">Interactive Simulation & Event Dispatch</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Switching tabs dispatches <code className="text-emerald-400 font-mono text-[11px]">source_selected</code>.</li>
                  <li>Clicking a status card dispatches <code className="text-emerald-400 font-mono text-[11px]">media_previewed</code>.</li>
                  <li>Saving single or multiple statuses dispatches <code className="text-emerald-400 font-mono text-[11px]">save_completed</code> or <code className="text-emerald-400 font-mono text-[11px]">bulk_save_completed</code>.</li>
                  <li>Click the <b>Web Admin Console</b> tab above to view the live event stream in real-time.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ADMIN' && (
          <AdminAuthProvider>
            <WebAdminDashboard />
          </AdminAuthProvider>
        )}

        {activeTab === 'CODE' && (
          <CodeExplorer />
        )}

        {activeTab === 'STORAGE' && (
          <StorageMatrix />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        OD Status Saver • Firebase BoM 33.5.1 • Analytics & Crashlytics • Kotlin 2.0.21 • Jetpack Compose
      </footer>
    </div>
  );
}
