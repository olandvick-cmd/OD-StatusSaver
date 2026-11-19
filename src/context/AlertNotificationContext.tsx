import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import {
  AdminNotificationDoc,
  AlertRuleConfig,
  AlertSeverity,
  OWNER_BOOTSTRAP_EMAIL,
  TelemetryEventDoc,
  TelemetryEventType
} from '../services/firebase';
import {
  acknowledgeAdminNotificationInFirestore,
  createAdminNotificationInFirestore,
  DEFAULT_ALERT_RULES,
  deleteAdminNotificationInFirestore,
  logTelemetryEventToFirestore,
  saveAlertRules,
  subscribeToAdminNotifications,
  subscribeToAlertRules,
  subscribeToTelemetryEvents
} from '../services/notificationService';

export interface ToastAlertItem {
  id: string;
  eventType: TelemetryEventType;
  severity: AlertSeverity;
  title: string;
  message: string;
  eventCount: number;
  threshold: number;
  timestampMs: number;
}

interface CounterProgress {
  count: number;
  threshold: number;
  enabled: boolean;
  windowMinutes: number;
}

interface AlertNotificationContextType {
  telemetryEvents: TelemetryEventDoc[];
  alertRules: AlertRuleConfig;
  notifications: AdminNotificationDoc[];
  toastQueue: ToastAlertItem[];
  unreadCount: number;
  appOpenCounter: CounterProgress;
  crashReportedCounter: CounterProgress;
  isFirestoreLive: boolean;
  listenerError: string | null;
  updateAlertRules: (nextRules: AlertRuleConfig) => Promise<void>;
  dispatchTelemetryEvent: (
    eventType: TelemetryEventType,
    options?: {
      details?: string;
      source?: string;
      appVersion?: string;
      androidVersion?: string;
    }
  ) => Promise<void>;
  dispatchBatchEvents: (eventType: TelemetryEventType, count: number) => Promise<void>;
  acknowledgeNotification: (id: string) => Promise<void>;
  acknowledgeAll: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  resetCounter: (eventType: TelemetryEventType) => void;
  dismissToast: (id: string) => void;
}

const AlertNotificationContext = createContext<AlertNotificationContextType | undefined>(undefined);

const CHECKPOINT_STORAGE_KEY = 'od_alert_checkpoints_v1';

function loadInitialCheckpoints(): Record<TelemetryEventType, number> {
  if (typeof window === 'undefined') {
    return { app_open: 0, crash_reported: 0 };
  }
  try {
    const raw = localStorage.getItem(CHECKPOINT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        app_open: Number(parsed.app_open) || 0,
        crash_reported: Number(parsed.crash_reported) || 0
      };
    }
  } catch {
    // ignore storage errors
  }
  return { app_open: 0, crash_reported: 0 };
}

function playNotificationChime(severity: AlertSeverity) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === 'critical' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(severity === 'critical' ? 660 : 523.25, now);
    osc.frequency.setValueAtTime(severity === 'critical' ? 880 : 659.25, now + 0.12);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    // Audio playback blocked before user gesture
  }
}

export const AlertNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, adminProfile, loading: authLoading } = useAdminAuth();

  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEventDoc[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRuleConfig>(DEFAULT_ALERT_RULES);
  const [notifications, setNotifications] = useState<AdminNotificationDoc[]>([]);
  const [toastQueue, setToastQueue] = useState<ToastAlertItem[]>([]);
  const [listenerError, setListenerError] = useState<string | null>(null);
  const [checkpoints, setCheckpoints] = useState<Record<TelemetryEventType, number>>(loadInitialCheckpoints);

  const triggeredSignaturesRef = useRef<Set<string>>(new Set());
  const isFirestoreLive = Boolean(currentUser && !authLoading && !listenerError);

  const updateCheckpoints = useCallback((updater: (prev: Record<TelemetryEventType, number>) => Record<TelemetryEventType, number>) => {
    setCheckpoints((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore storage quota errors
        }
      }
      return next;
    });
  }, []);

  // Attach real-time Firestore onSnapshot listeners ONLY when authenticated
  useEffect(() => {
    if (authLoading || !currentUser) {
      return;
    }

    setListenerError(null);

    const unsubEvents = subscribeToTelemetryEvents(
      (events) => {
        setTelemetryEvents(events);
      },
      (err) => {
        setListenerError(err.message);
      }
    );

    const unsubRules = subscribeToAlertRules(
      (rules) => {
        setAlertRules(rules);
      },
      (err) => {
        setListenerError(err.message);
      }
    );

    const unsubAlerts = subscribeToAdminNotifications(
      (list) => {
        setNotifications(list);
      },
      (err) => {
        setListenerError(err.message);
      }
    );

    return () => {
      unsubEvents();
      unsubRules();
      unsubAlerts();
    };
  }, [authLoading, currentUser]);

  // Compute current matching events within window & since checkpoint
  const windowCutoffMs = Date.now() - alertRules.windowMinutes * 60_000;

  const matchingAppOpenEvents = useMemo(
    () =>
      telemetryEvents.filter(
        (e) =>
          e.eventType === 'app_open' &&
          e.createdAtMs >= Math.max(windowCutoffMs, checkpoints.app_open)
      ),
    [telemetryEvents, windowCutoffMs, checkpoints.app_open]
  );

  const matchingCrashEvents = useMemo(
    () =>
      telemetryEvents.filter(
        (e) =>
          e.eventType === 'crash_reported' &&
          e.createdAtMs >= Math.max(windowCutoffMs, checkpoints.crash_reported)
      ),
    [telemetryEvents, windowCutoffMs, checkpoints.crash_reported]
  );

  const pushToast = useCallback(
    (toast: ToastAlertItem, soundEnabled: boolean) => {
      setToastQueue((prev) => [toast, ...prev].slice(0, 4));
      if (soundEnabled) {
        playNotificationChime(toast.severity);
      }
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToastQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Evaluate threshold crossings in real time whenever events or rules update
  useEffect(() => {
    const evaluateThreshold = async (
      eventType: TelemetryEventType,
      matching: TelemetryEventDoc[],
      threshold: number,
      enabled: boolean
    ) => {
      if (!enabled || matching.length < threshold) return;

      const newestEvent = matching[0];
      if (!newestEvent) return;

      const deterministicId = `alert_${eventType}_${newestEvent.id}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
      if (triggeredSignaturesRef.current.has(deterministicId)) return;
      if (notifications.some((n) => n.id === deterministicId)) {
        triggeredSignaturesRef.current.add(deterministicId);
        return;
      }

      triggeredSignaturesRef.current.add(deterministicId);

      // Advance checkpoint past newest matching event so counter resets cleanly for the next batch
      const nextCheckpoint = newestEvent.createdAtMs + 1;
      updateCheckpoints((prev) => ({
        ...prev,
        [eventType]: Math.max(prev[eventType], nextCheckpoint)
      }));

      const isCrash = eventType === 'crash_reported';
      const severity: AlertSeverity = isCrash ? 'critical' : 'info';
      const title = isCrash
        ? `Crash Threshold Reached (${matching.length} new)`
        : `App Open Spike Alert (${matching.length} new)`;
      const message = isCrash
        ? `${matching.length} new 'crash_reported' events logged within ${alertRules.windowMinutes}m (threshold: ${threshold}). Latest: ${newestEvent.details || newestEvent.androidVersion}.`
        : `${matching.length} new 'app_open' events logged within ${alertRules.windowMinutes}m (threshold: ${threshold}). App v${newestEvent.appVersion} activity active.`;

      pushToast(
        {
          id: deterministicId,
          eventType,
          severity,
          title,
          message,
          eventCount: matching.length,
          threshold,
          timestampMs: Date.now()
        },
        alertRules.soundEnabled
      );

      if (currentUser) {
        await createAdminNotificationInFirestore({
          notificationId: deterministicId,
          eventType,
          severity,
          title,
          message,
          eventCount: matching.length,
          threshold
        }).catch((err) => {
          console.warn('Could not persist admin notification:', err);
        });
      } else {
        const localAlert: AdminNotificationDoc = {
          id: deterministicId,
          eventType,
          severity,
          title,
          message,
          eventCount: matching.length,
          threshold,
          acknowledged: false,
          acknowledgedBy: '',
          createdAtMs: Date.now()
        };
        setNotifications((prev) => [localAlert, ...prev]);
      }
    };

    evaluateThreshold(
      'app_open',
      matchingAppOpenEvents,
      alertRules.appOpenThreshold,
      alertRules.appOpenEnabled
    );
    evaluateThreshold(
      'crash_reported',
      matchingCrashEvents,
      alertRules.crashReportedThreshold,
      alertRules.crashReportedEnabled
    );
  }, [
    matchingAppOpenEvents,
    matchingCrashEvents,
    alertRules,
    currentUser,
    notifications,
    pushToast,
    updateCheckpoints
  ]);

  const updateAlertRules = useCallback(
    async (nextRules: AlertRuleConfig) => {
      const actorUid = adminProfile?.uid || currentUser?.uid || 'owner-bootstrap-root';
      const actorEmail = adminProfile?.email || currentUser?.email || OWNER_BOOTSTRAP_EMAIL;
      setAlertRules({
        ...nextRules,
        updatedAtMs: Date.now(),
        updatedBy: actorEmail
      });

      if (currentUser) {
        await saveAlertRules(nextRules, actorUid, actorEmail);
      }
    },
    [adminProfile, currentUser]
  );

  const dispatchTelemetryEvent = useCallback(
    async (
      eventType: TelemetryEventType,
      options?: {
        details?: string;
        source?: string;
        appVersion?: string;
        androidVersion?: string;
      }
    ) => {
      const appVersion = options?.appVersion || '1.0.0';
      const androidVersion =
        options?.androidVersion ||
        (eventType === 'crash_reported' ? 'Android 14 (API 34)' : 'Android 15 (API 35)');
      const source = options?.source || 'admin_console';
      const details =
        options?.details ||
        (eventType === 'crash_reported'
          ? 'SecurityException: SAF URI permission expired on resume'
          : 'Cold app launch - WhatsApp Status tab loaded');

      if (currentUser) {
        await logTelemetryEventToFirestore({
          eventType,
          appVersion,
          androidVersion,
          source,
          details
        });
      } else {
        const localEvent: TelemetryEventDoc = {
          id: `local_${eventType}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          eventType,
          appVersion,
          androidVersion,
          source,
          details,
          createdAtMs: Date.now()
        };
        setTelemetryEvents((prev) => [localEvent, ...prev].slice(0, 100));
      }
    },
    [currentUser]
  );

  const dispatchBatchEvents = useCallback(
    async (eventType: TelemetryEventType, count: number) => {
      const safeCount = Math.max(1, Math.min(25, count));
      for (let i = 0; i < safeCount; i++) {
        await dispatchTelemetryEvent(eventType, {
          source: currentUser ? 'firebase_test_emitter' : 'preview_simulator',
          details:
            eventType === 'crash_reported'
              ? `Non-fatal exception #${i + 1}: MediaStore IS_PENDING write interrupted`
              : `App foreground open #${i + 1} (Zero-PII telemetry)`
        });
      }
    },
    [currentUser, dispatchTelemetryEvent]
  );

  const acknowledgeNotification = useCallback(
    async (id: string) => {
      const actorEmail = adminProfile?.email || currentUser?.email || OWNER_BOOTSTRAP_EMAIL;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, acknowledged: true, acknowledgedBy: actorEmail } : n))
      );
      dismissToast(id);
      if (currentUser) {
        await acknowledgeAdminNotificationInFirestore(id, actorEmail);
      }
    },
    [adminProfile, currentUser, dismissToast]
  );

  const acknowledgeAll = useCallback(async () => {
    const unread = notifications.filter((n) => !n.acknowledged);
    const actorEmail = adminProfile?.email || currentUser?.email || OWNER_BOOTSTRAP_EMAIL;
    setNotifications((prev) =>
      prev.map((n) => (n.acknowledged ? n : { ...n, acknowledged: true, acknowledgedBy: actorEmail }))
    );
    setToastQueue([]);
    if (currentUser) {
      await Promise.all(
        unread.map((n) => acknowledgeAdminNotificationInFirestore(n.id, actorEmail).catch(() => {}))
      );
    }
  }, [adminProfile, currentUser, notifications]);

  const removeNotification = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      dismissToast(id);
      if (currentUser) {
        await deleteAdminNotificationInFirestore(id);
      }
    },
    [currentUser, dismissToast]
  );

  const resetCounter = useCallback(
    (eventType: TelemetryEventType) => {
      updateCheckpoints((prev) => ({
        ...prev,
        [eventType]: Date.now()
      }));
    },
    [updateCheckpoints]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.acknowledged).length,
    [notifications]
  );

  const appOpenCounter: CounterProgress = {
    count: matchingAppOpenEvents.length,
    threshold: alertRules.appOpenThreshold,
    enabled: alertRules.appOpenEnabled,
    windowMinutes: alertRules.windowMinutes
  };

  const crashReportedCounter: CounterProgress = {
    count: matchingCrashEvents.length,
    threshold: alertRules.crashReportedThreshold,
    enabled: alertRules.crashReportedEnabled,
    windowMinutes: alertRules.windowMinutes
  };

  return (
    <AlertNotificationContext.Provider
      value={{
        telemetryEvents,
        alertRules,
        notifications,
        toastQueue,
        unreadCount,
        appOpenCounter,
        crashReportedCounter,
        isFirestoreLive,
        listenerError,
        updateAlertRules,
        dispatchTelemetryEvent,
        dispatchBatchEvents,
        acknowledgeNotification,
        acknowledgeAll,
        removeNotification,
        resetCounter,
        dismissToast
      }}
    >
      {children}
    </AlertNotificationContext.Provider>
  );
};

export const useAlertNotifications = () => {
  const ctx = useContext(AlertNotificationContext);
  if (!ctx) {
    throw new Error('useAlertNotifications must be used within AlertNotificationProvider');
  }
  return ctx;
};
