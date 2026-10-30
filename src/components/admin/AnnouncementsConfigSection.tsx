import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Smartphone, 
  Layers,
  Lock
} from 'lucide-react';
import { AppConfigDoc } from '../../services/firebase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { saveAppConfig } from '../../services/adminService';

interface AnnouncementsConfigSectionProps {
  config: AppConfigDoc;
  onRefreshConfig: () => void;
}

export const AnnouncementsConfigSection: React.FC<AnnouncementsConfigSectionProps> = ({
  config,
  onRefreshConfig
}) => {
  const { isAdmin, currentUser, adminProfile } = useAdminAuth();
  const [formData, setFormData] = useState<AppConfigDoc>(config);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      const actorEmail = adminProfile?.email || currentUser?.email || 'admin';
      const actorUid = adminProfile?.uid || currentUser?.uid || 'uid';
      await saveAppConfig(formData, actorUid, actorEmail);
      setSaveSuccess(true);
      onRefreshConfig();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving app configuration:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">In-App Announcements & Maintenance</h2>
          <p className="text-xs text-slate-400">
            Publish urgent notices or configure maintenance windows remotely via Firebase Firestore without releasing a new APK.
          </p>
        </div>

        {!isAdmin && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs font-mono">
            <Lock className="w-3.5 h-3.5" /> Read-Only Mode
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Maintenance Mode Card */}
        <div className={`p-6 rounded-2xl border transition ${
          formData.maintenanceMode 
            ? 'bg-rose-950/30 border-rose-500/50' 
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                formData.maintenanceMode ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Emergency Maintenance Mode</h3>
                <p className="text-xs text-slate-400">
                  When enabled, shows a non-intrusive warning notice inside the mobile app.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={formData.maintenanceMode}
                onChange={(e) => setFormData(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Maintenance Message (Displayed on mobile client)
            </label>
            <input
              type="text"
              disabled={!isAdmin || !formData.maintenanceMode}
              value={formData.maintenanceMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
              maxLength={500}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-rose-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* In-App Announcement Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">In-App Announcement Banner</h3>
                <p className="text-xs text-slate-400">
                  Displays a dismissible bulletin banner at the top of the Status Saver mobile feed.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={formData.announcementActive}
                onChange={(e) => setFormData(prev => ({ ...prev, announcementActive: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.announcementTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, announcementTitle: e.target.value }))}
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Announcement Message
              </label>
              <textarea
                disabled={!isAdmin}
                value={formData.announcementBody}
                onChange={(e) => setFormData(prev => ({ ...prev, announcementBody: e.target.value }))}
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Minimum Supported App Version */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Smartphone className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm text-white">Minimum Supported Version</h3>
              <p className="text-xs text-slate-400">
                Older app versions below this semantic tag will prompt users to update from Google Play Store.
              </p>
            </div>
          </div>

          <div className="max-w-xs">
            <input
              type="text"
              disabled={!isAdmin}
              value={formData.minAppVersion}
              onChange={(e) => setFormData(prev => ({ ...prev, minAppVersion: e.target.value }))}
              placeholder="1.0.0"
              className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Action Button */}
        {isAdmin && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400 font-mono">
              Last saved: {new Date(config.updatedAt).toLocaleString()} by {config.updatedBy}
            </span>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Changes synced to Firestore!
                </span>
              )}

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Syncing...' : 'Publish Configuration'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
