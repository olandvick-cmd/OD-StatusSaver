import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Clock, 
  Layers,
  Lock
} from 'lucide-react';
import { AppConfigDoc } from '../../services/firebase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { saveAppConfig } from '../../services/adminService';

interface AdSettingsSectionProps {
  config: AppConfigDoc;
  onRefreshConfig: () => void;
}

export const AdSettingsSection: React.FC<AdSettingsSectionProps> = ({
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
      console.error('Error saving ad settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Strict Policy Compliance Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-white">Google AdMob Compliance Guarantee</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Remote Config adjustments here only regulate pacing and format toggles. 
            Remote settings <b>can never bypass</b> Google User Messaging Platform (UMP) consent, GDPR/CCPA disclosures, or Google Play store policies.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Ad Configuration */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-white">Adaptive Anchor Banner</h3>
              <p className="text-xs text-slate-400 mt-1">
                Renders a single non-obtrusive adaptive banner anchored at the bottom with safe padding away from status action buttons.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={formData.adBannerEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, adBannerEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Interstitial Frequency & Cooldown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="font-bold text-sm text-white">Interstitial Ad Frequency & Pacing</h3>
            <p className="text-xs text-slate-400 mt-1">
              Controls the minimum number of save operations before displaying a full-screen interstitial ad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frequency Slider */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="text-slate-300 font-medium">Save Frequency Trigger</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                  Every {formData.adInterstitialFrequency} saves
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                disabled={!isAdmin}
                value={formData.adInterstitialFrequency}
                onChange={(e) => setFormData(prev => ({ ...prev, adInterstitialFrequency: parseInt(e.target.value, 10) }))}
                className="w-full accent-emerald-500 disabled:opacity-50"
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Recommended: 3 to 5 saves. Avoid interrupting every single save operation.
              </p>
            </div>

            {/* Cooldown Slider */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Minimum Cooldown Window
                </span>
                <span className="font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/40">
                  {formData.adCooldownMinutes} minutes
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                disabled={!isAdmin}
                value={formData.adCooldownMinutes}
                onChange={(e) => setFormData(prev => ({ ...prev, adCooldownMinutes: parseInt(e.target.value, 10) }))}
                className="w-full accent-amber-500 disabled:opacity-50"
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Guarantees users do not experience repeated interstitials during quick sequential saves.
              </p>
            </div>
          </div>
        </div>

        {/* Rewarded Ad Placement */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-white">Optional Rewarded Ads</h3>
              <p className="text-xs text-slate-400 mt-1">
                Allows users to voluntarily watch a video ad in exchange for a benefit (e.g. ad-free browsing for the day).
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={formData.rewardedAdEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, rewardedAdEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
          </div>
        </div>

        {/* Actions */}
        {isAdmin && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400 font-mono">
              Server-enforced update protection enabled
            </span>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Ad settings updated in Firestore!
                </span>
              )}

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Apply Ad Placement Settings'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
