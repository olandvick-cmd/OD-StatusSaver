import React, { useEffect, useState } from 'react';
import {
  Activity,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  CheckCircle2,
  Flame,
  Lock,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAlertNotifications } from '../../context/AlertNotificationContext';
import { AlertRuleConfig } from '../../services/firebase';

export const RealtimeAlertsSection: React.FC = () => {
  const { isAdmin, isOwner, currentUser, signInWithGoogle } = useAdminAuth();
  const {
    telemetryEvents,
    alertRules,
    notifications,
    unreadCount,
    appOpenCounter,
    crashReportedCounter,
    isFirestoreLive,
    listenerError,
    updateAlertRules,
    dispatchBatchEvents,
    acknowledgeNotification,
    acknowledgeAll,
    removeNotification,
    resetCounter
  } = useAlertNotifications();

  const [formRules, setFormRules] = useState<AlertRuleConfig>(alertRules);
  const [savingRules, setSavingRules] = useState(false);
  const [saveBanner, setSaveBanner] = useState(false);
  const [emittingType, setEmittingType] = useState<string | null>(null);
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'UNREAD' | 'app_open' | 'crash_reported'>('ALL');

  useEffect(() => {
    setFormRules(alertRules);
  }, [alertRules]);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSavingRules(true);
    setSaveBanner(false);
    try {
      await updateAlertRules(formRules);
      setSaveBanner(true);
      setTimeout(() => setSaveBanner(false), 3000);
    } catch (err) {
      console.error('Failed to save alert threshold rules:', err);
    } finally {
      setSavingRules(false);
    }
  };

  const handleEmit = async (eventType: 'app_open' | 'crash_reported', count: number) => {
    const key = `${eventType}_${count}`;
    setEmittingType(key);
    try {
      await dispatchBatchEvents(eventType, count);
    } catch (err) {
      console.error('Failed to emit telemetry event:', err);
    } finally {
      setEmittingType(null);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (alertFilter === 'UNREAD') return !n.acknowledged;
    if (alertFilter === 'app_open') return n.eventType === 'app_open';
    if (alertFilter === 'crash_reported') return n.eventType === 'crash_reported';
    return true;
  });

  const appOpenPercent = Math.min(
    100,
    Math.round((appOpenCounter.count / Math.max(1, appOpenCounter.threshold)) * 100)
  );
  const crashPercent = Math.min(
    100,
    Math.round((crashReportedCounter.count / Math.max(1, crashReportedCounter.threshold)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Live Stream Status Banner */}
      <div
        className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isFirestoreLive
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : 'bg-amber-950/25 border-amber-500/40'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isFirestoreLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            <Radio className={`w-5 h-5 ${isFirestoreLive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-white">
                {isFirestoreLive
                  ? 'Firebase Real-Time Notification Listener Active'
                  : 'Preview Mode: Sign In with Google for Live Cloud Firestore Sync'}
              </h2>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isFirestoreLive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-200 border-amber-500/30'
                }`}
              >
                {isFirestoreLive ? 'onSnapshot Connected' : 'Local Event Buffer'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {isFirestoreLive
                ? 'Listening to Firestore collections telemetry_events, alert_rules, and admin_notifications in real time.'
                : 'To stream real Firestore documents across browser tabs and persist alert rules in Cloud Firestore, connect your authorized Google account.'}
            </p>
            {listenerError && (
              <p className="text-[11px] font-mono text-rose-300 mt-1">Listener notice: {listenerError}</p>
            )}
          </div>
        </div>

        {!currentUser && (
          <button
            onClick={() => signInWithGoogle()}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shrink-0 transition shadow-lg cursor-pointer"
          >
            Connect Google Auth
          </button>
        )}
      </div>

      {/* Live Threshold Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* app_open Monitor */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white font-mono">app_open</h3>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      appOpenCounter.enabled
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {appOpenCounter.enabled ? 'ARMED' : 'PAUSED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Triggers alert every {appOpenCounter.threshold} new events within {appOpenCounter.windowMinutes}m
                </p>
              </div>
            </div>

            <button
              onClick={() => resetCounter('app_open')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
              title="Reset current batch counter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-black text-white font-mono">
                {appOpenCounter.count}{' '}
                <span className="text-sm font-semibold text-slate-400">/ {appOpenCounter.threshold}</span>
              </span>
              <span className="text-xs font-mono text-sky-400">{appOpenPercent}% to alert</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-300"
                style={{ width: `${appOpenPercent}%` }}
              />
            </div>
          </div>

          {isAdmin && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-mono">Test Event Dispatch:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEmit('app_open', 1)}
                  disabled={emittingType !== null}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" /> 1 app_open
                </button>
                <button
                  onClick={() => handleEmit('app_open', appOpenCounter.threshold)}
                  disabled={emittingType !== null}
                  className="px-2.5 py-1 rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" /> {appOpenCounter.threshold} (Trigger Alert)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* crash_reported Monitor */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white font-mono">crash_reported</h3>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      crashReportedCounter.enabled
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {crashReportedCounter.enabled ? 'ARMED' : 'PAUSED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Triggers critical alert every {crashReportedCounter.threshold} new crashes within{' '}
                  {crashReportedCounter.windowMinutes}m
                </p>
              </div>
            </div>

            <button
              onClick={() => resetCounter('crash_reported')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
              title="Reset current batch counter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-black text-white font-mono">
                {crashReportedCounter.count}{' '}
                <span className="text-sm font-semibold text-slate-400">/ {crashReportedCounter.threshold}</span>
              </span>
              <span className="text-xs font-mono text-rose-400">{crashPercent}% to critical alert</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
                style={{ width: `${crashPercent}%` }}
              />
            </div>
          </div>

          {isAdmin && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-mono">Test Event Dispatch:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEmit('crash_reported', 1)}
                  disabled={emittingType !== null}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" /> 1 crash_reported
                </button>
                <button
                  onClick={() => handleEmit('crash_reported', crashReportedCounter.threshold)}
                  disabled={emittingType !== null}
                  className="px-2.5 py-1 rounded-lg bg-rose-500 text-white hover:bg-rose-400 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" /> {crashReportedCounter.threshold} (Trigger Alert)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Threshold Configuration + Triggered Alert History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Alert Rule Configuration */}
        <form
          onSubmit={handleSaveRules}
          className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 self-start"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-emerald-400" />
                Notification Threshold Rules
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure exact event volume triggers stored in Firestore.
              </p>
            </div>
            {!isAdmin && (
              <span className="flex items-center gap-1 text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-1 rounded-lg">
                <Lock className="w-3 h-3" /> Read-Only
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* app_open Threshold */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-sky-300 font-mono">app_open Threshold</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={formRules.appOpenEnabled}
                    onChange={(e) =>
                      setFormRules((prev) => ({ ...prev, appOpenEnabled: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={10000}
                  disabled={!isAdmin || !formRules.appOpenEnabled}
                  value={formRules.appOpenThreshold}
                  onChange={(e) =>
                    setFormRules((prev) => ({
                      ...prev,
                      appOpenThreshold: Math.max(1, parseInt(e.target.value || '1', 10))
                    }))
                  }
                  className="w-28 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
                />
                <span className="text-xs text-slate-400">new app_open events</span>
              </div>
            </div>

            {/* crash_reported Threshold */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-300 font-mono">crash_reported Threshold</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={formRules.crashReportedEnabled}
                    onChange={(e) =>
                      setFormRules((prev) => ({ ...prev, crashReportedEnabled: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  disabled={!isAdmin || !formRules.crashReportedEnabled}
                  value={formRules.crashReportedThreshold}
                  onChange={(e) =>
                    setFormRules((prev) => ({
                      ...prev,
                      crashReportedThreshold: Math.max(1, parseInt(e.target.value || '1', 10))
                    }))
                  }
                  className="w-28 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-rose-500 disabled:opacity-50"
                />
                <span className="text-xs text-slate-400">new crash_reported events</span>
              </div>
            </div>

            {/* Rolling Time Window & Audio Chime */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Rolling Window
                </label>
                <select
                  disabled={!isAdmin}
                  value={formRules.windowMinutes}
                  onChange={(e) =>
                    setFormRules((prev) => ({
                      ...prev,
                      windowMinutes: parseInt(e.target.value, 10)
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={360}>6 hours</option>
                  <option value={1440}>24 hours</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-300">Alert Chime</span>
                  <span className="text-[10px] text-slate-500">Audio tone on trigger</span>
                </div>
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() =>
                    setFormRules((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
                  }
                  className={`p-2 rounded-lg border transition cursor-pointer disabled:opacity-50 ${
                    formRules.soundEnabled
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  {formRules.soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between gap-2 pt-1">
              {saveBanner ? (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Rules saved
                </span>
              ) : (
                <span className="text-[11px] font-mono text-slate-500 truncate">
                  Updated by {alertRules.updatedBy}
                </span>
              )}
              <button
                type="submit"
                disabled={savingRules}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingRules ? 'Saving...' : 'Save Thresholds'}</span>
              </button>
            </div>
          )}
        </form>

        {/* Right: Triggered Alerts Feed */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-sm text-white">Triggered Administrator Alerts</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
                {(['ALL', 'UNREAD', 'crash_reported', 'app_open'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAlertFilter(tab)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      alertFilter === tab
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab === 'ALL' ? 'All' : tab === 'UNREAD' ? 'Unread' : tab}
                  </button>
                ))}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={() => acknowledgeAll()}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Acknowledge All</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-500">
                No alerts match the current filter. Dispatch test events above or wait for incoming Firebase telemetry.
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isCrash = item.eventType === 'crash_reported';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                      item.acknowledged
                        ? 'bg-slate-950/50 border-slate-800/80 opacity-75'
                        : isCrash
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : 'bg-sky-950/25 border-sky-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isCrash ? 'bg-rose-500/20 text-rose-400' : 'bg-sky-500/20 text-sky-400'
                        }`}
                      >
                        {isCrash ? <ShieldAlert className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{item.title}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                              isCrash
                                ? 'bg-rose-950 text-rose-300 border-rose-500/30'
                                : 'bg-sky-950 text-sky-300 border-sky-500/30'
                            }`}
                          >
                            {item.eventCount}/{item.threshold}
                          </span>
                          {item.acknowledged ? (
                            <span className="text-[10px] font-mono text-emerald-400">
                              Acknowledged by {item.acknowledgedBy}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-amber-300 font-bold">NEW</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{item.message}</p>
                        <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                          {new Date(item.createdAtMs).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!item.acknowledged && (
                        <button
                          onClick={() => acknowledgeNotification(item.id)}
                          className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 transition cursor-pointer"
                          title="Acknowledge alert"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => removeNotification(item.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                          title="Delete alert (Owner only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Live Incoming Telemetry Stream Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isFirestoreLive ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <h3 className="font-bold text-sm text-white">Live Telemetry Event Stream</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing latest {telemetryEvents.length} events
          </span>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">App / OS</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Sanitized Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {telemetryEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans text-xs">
                    Waiting for incoming <code className="text-sky-400">app_open</code> or{' '}
                    <code className="text-rose-400">crash_reported</code> events...
                  </td>
                </tr>
              ) : (
                telemetryEvents.slice(0, 30).map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(evt.createdAtMs).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          evt.eventType === 'crash_reported'
                            ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                            : 'bg-sky-950 text-sky-300 border-sky-500/40'
                        }`}
                      >
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-slate-300 whitespace-nowrap">
                      v{evt.appVersion} • {evt.androidVersion}
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-slate-400">{evt.source}</td>
                    <td className="py-2.5 px-4 text-slate-300 font-sans text-xs">{evt.details}</td>
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
