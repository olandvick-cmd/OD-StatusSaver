import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Flame,
  Activity,
  X,
  ArrowRight,
  Radio,
  ShieldAlert
} from 'lucide-react';
import { useAlertNotifications } from '../../context/AlertNotificationContext';

interface NotificationBellProps {
  onOpenAlertsTab: () => void;
}

export const NotificationBellButton: React.FC<NotificationBellProps> = ({ onOpenAlertsTab }) => {
  const {
    notifications,
    unreadCount,
    appOpenCounter,
    crashReportedCounter,
    isFirestoreLive,
    acknowledgeNotification,
    acknowledgeAll
  } = useAlertNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recentNotifications = notifications.slice(0, 8);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
          unreadCount > 0
            ? 'bg-rose-950/60 border-rose-500/50 text-rose-200 hover:bg-rose-900/60'
            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
        }`}
        title="Real-Time Threshold Alerts"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-rose-400 animate-pulse" />
        ) : (
          <Bell className="w-4 h-4 text-emerald-400" />
        )}
        {unreadCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 ${isFirestoreLive ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <div>
                <h3 className="text-xs font-extrabold text-white">Real-Time Alert Center</h3>
                <p className="text-[10px] font-mono text-slate-400">
                  {isFirestoreLive ? 'Firestore onSnapshot Active' : 'Local Preview Buffer'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => acknowledgeAll()}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Live Threshold Counters Summary */}
          <div className="p-3 bg-slate-950/40 border-b border-slate-800 grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span className="flex items-center gap-1 text-sky-300 font-bold">
                  <Activity className="w-3 h-3" /> app_open
                </span>
                <span>
                  {appOpenCounter.count}/{appOpenCounter.threshold}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((appOpenCounter.count / Math.max(1, appOpenCounter.threshold)) * 100))}%`
                  }}
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span className="flex items-center gap-1 text-rose-300 font-bold">
                  <Flame className="w-3 h-3" /> crash_reported
                </span>
                <span>
                  {crashReportedCounter.count}/{crashReportedCounter.threshold}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((crashReportedCounter.count / Math.max(1, crashReportedCounter.threshold)) * 100))}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Alert Items */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/70">
            {recentNotifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No threshold alerts triggered yet. Counters are monitoring incoming events.
              </div>
            ) : (
              recentNotifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 transition ${
                    item.acknowledged ? 'bg-slate-900/40 opacity-75' : 'bg-slate-900 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          item.eventType === 'crash_reported'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-sky-500/20 text-sky-400'
                        }`}
                      >
                        {item.eventType === 'crash_reported' ? (
                          <Flame className="w-3.5 h-3.5" />
                        ) : (
                          <Activity className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{item.title}</span>
                          {!item.acknowledged && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{item.message}</p>
                        <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                          {new Date(item.createdAtMs).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {!item.acknowledged && (
                      <button
                        onClick={() => acknowledgeNotification(item.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition shrink-0 cursor-pointer"
                        title="Acknowledge alert"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-3 bg-slate-950/70 border-t border-slate-800">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAlertsTab();
              }}
              className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>Configure Thresholds & Live Stream</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface AlertToastStackProps {
  onInspectAlerts: () => void;
}

export const AlertToastStack: React.FC<AlertToastStackProps> = ({ onInspectAlerts }) => {
  const { toastQueue, dismissToast, acknowledgeNotification } = useAlertNotifications();

  if (toastQueue.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
      {toastQueue.map((toast) => {
        const isCrash = toast.eventType === 'crash_reported';
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all ${
              isCrash
                ? 'bg-rose-950/95 border-rose-500/60 text-rose-100'
                : 'bg-slate-900/95 border-sky-500/50 text-slate-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isCrash ? 'bg-rose-500/20 text-rose-300' : 'bg-sky-500/20 text-sky-300'
                  }`}
                >
                  {isCrash ? <ShieldAlert className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        isCrash ? 'bg-rose-500 text-white' : 'bg-sky-500 text-slate-950'
                      }`}
                    >
                      {isCrash ? 'CRITICAL' : 'THRESHOLD'}
                    </span>
                    <span className="text-[10px] font-mono opacity-75">
                      {new Date(toast.timestampMs).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-white mt-1">{toast.title}</h4>
                  <p className="text-[11px] opacity-90 mt-0.5 leading-snug">{toast.message}</p>

                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => {
                        acknowledgeNotification(toast.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Acknowledge</span>
                    </button>
                    <button
                      onClick={() => {
                        dismissToast(toast.id);
                        onInspectAlerts();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-black/30 hover:bg-black/45 text-white/90 text-[11px] font-semibold transition cursor-pointer"
                    >
                      Open Alerts
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
                aria-label="Dismiss alert toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
