import React, { useState } from 'react';
import { 
  ShieldCheck, Sliders, Bell, DollarSign,
  Activity, BarChart2, CheckCircle2, Save, Terminal
} from 'lucide-react';
import { RemoteConfigSettings } from '../data/mockAndroidData';

interface AdminConfigPanelProps {
  config: RemoteConfigSettings;
  onUpdateConfig: (newConfig: RemoteConfigSettings) => void;
  analyticsEvents?: Array<{ name: string; params: Record<string, any>; timestamp: number }>;
}

export const AdminConfigPanel: React.FC<AdminConfigPanelProps> = ({
  config,
  onUpdateConfig,
  analyticsEvents = []
}) => {
  const [localConfig, setLocalConfig] = useState<RemoteConfigSettings>(config);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    onUpdateConfig(localConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee Banner */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-emerald-300">Privacy & Architecture Verification</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            OD Status Saver strictly operates on-device. The backend admin console manages remote feature flags and release versions only. 
            No media bytes, personal contact numbers, or WhatsApp identifiers are ever received or stored on server infrastructure.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 0 Phone Numbers Stored
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 100% On-Device MediaStore
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Zero Account Sign-in
            </span>
          </div>
        </div>
      </div>

      {/* Live Firebase Analytics Event Stream (DebugView Simulation) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base text-white">Firebase Analytics Event Stream (DebugView)</h2>
          </div>
          <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Stream
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Events dispatched from the mobile application in accordance with the controlled parameter taxonomy. Notice that filenames, paths, and phone numbers are strictly prohibited and absent.
        </p>

        {analyticsEvents.length === 0 ? (
          <div className="bg-slate-950 rounded-xl p-6 text-center text-xs text-slate-500 border border-slate-800">
            <BarChart2 className="w-6 h-6 mx-auto mb-2 text-slate-600" />
            <span>Interact with the Phone Simulator (switch tabs, view statuses, save media) to see live Firebase Analytics events stream in real-time.</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {analyticsEvents.slice(-8).reverse().map((evt, idx) => (
              <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{evt.name}</span>
                  <span className="text-slate-500 text-[10px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-2">
                  {Object.entries(evt.params).map(([k, v]) => (
                    <span key={k} className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
                      <span className="text-slate-500">{k}:</span> <span className="text-emerald-300">{String(v)}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remote Configuration Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base text-white">Firebase Remote Config & AdMob Controls</h2>
          </div>
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-4 h-4" /> Parameters Synchronized
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* AdMob Configuration */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Google AdMob Integration</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-300">Smart Banner Ad</p>
                <p className="text-[11px] text-slate-500">Show bottom banner on main gallery</p>
              </div>
              <input
                type="checkbox"
                checked={localConfig.adMobBannerEnabled}
                onChange={(e) => setLocalConfig({ ...localConfig, adMobBannerEnabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Interstitial Frequency Cap</span>
                <span className="font-bold font-mono text-emerald-400">Every {localConfig.interstitialFrequencySaves} saves</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={localConfig.interstitialFrequencySaves}
                onChange={(e) => setLocalConfig({ ...localConfig, interstitialFrequencySaves: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Prevents spamming users by showing full-screen ad only once every N status downloads.
              </p>
            </div>
          </div>

          {/* Version & Client Health */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>App Version & Updates</span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Minimum Supported Version</label>
              <input
                type="text"
                value={localConfig.minSupportedVersion}
                onChange={(e) => setLocalConfig({ ...localConfig, minSupportedVersion: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Clients on older builds will be prompted with a non-blocking Play Store update dialog.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-300">WhatsApp Business Discovery</p>
                <p className="text-[11px] text-slate-500">Enable second source tab for business users</p>
              </div>
              <input
                type="checkbox"
                checked={localConfig.enableBusinessDetection}
                onChange={(e) => setLocalConfig({ ...localConfig, enableBusinessDetection: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* In-App Announcement Broadcast */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>Mobile In-App Notice Banner</span>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <span>Broadcast Active</span>
              <input
                type="checkbox"
                checked={localConfig.announcementActive}
                onChange={(e) => setLocalConfig({ ...localConfig, announcementActive: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </label>
          </div>

          <input
            type="text"
            value={localConfig.announcementText}
            onChange={(e) => setLocalConfig({ ...localConfig, announcementText: e.target.value })}
            placeholder="Type announcement message broadcast to all users..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Save Changes Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
          >
            <Save className="w-4 h-4" />
            Apply Remote Config
          </button>
        </div>
      </div>
    </div>
  );
};
