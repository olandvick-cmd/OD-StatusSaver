import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc
} from 'firebase/firestore';
import {
  AdminNotificationDoc,
  AlertRuleConfig,
  AlertSeverity,
  db,
  handleFirestoreError,
  OperationType,
  OWNER_BOOTSTRAP_EMAIL,
  TelemetryEventDoc,
  TelemetryEventType
} from './firebase';
import { recordAuditLog } from './adminService';

export const DEFAULT_ALERT_RULES: AlertRuleConfig = {
  appOpenThreshold: 5,
  crashReportedThreshold: 2,
  windowMinutes: 60,
  appOpenEnabled: true,
  crashReportedEnabled: true,
  soundEnabled: true,
  updatedAtMs: Date.now(),
  updatedBy: OWNER_BOOTSTRAP_EMAIL
};

function toMillis(val: unknown): number {
  if (val instanceof Timestamp) {
    return val.toMillis();
  }
  if (val && typeof val === 'object' && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }
  return Date.now();
}

function makeValidDocId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

export function subscribeToTelemetryEvents(
  onData: (events: TelemetryEventDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'telemetry_events';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: TelemetryEventDoc[] = snapshot.docs.map((d) => {
        const data = d.data({ serverTimestamps: 'estimate' });
        return {
          id: d.id,
          eventType: (data.eventType === 'crash_reported' ? 'crash_reported' : 'app_open') as TelemetryEventType,
          appVersion: String(data.appVersion || '1.0.0'),
          androidVersion: String(data.androidVersion || 'Android 14 (API 34)'),
          source: String(data.source || 'android'),
          details: String(data.details || ''),
          createdAtMs: toMillis(data.createdAt)
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeToAlertRules(
  onData: (rules: AlertRuleConfig) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'alert_rules/global';
  const docRef = doc(db, 'alert_rules', 'global');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(DEFAULT_ALERT_RULES);
        return;
      }
      const data = snapshot.data({ serverTimestamps: 'estimate' });
      onData({
        appOpenThreshold: Math.max(1, Math.min(10000, Number(data.appOpenThreshold) || 5)),
        crashReportedThreshold: Math.max(1, Math.min(1000, Number(data.crashReportedThreshold) || 2)),
        windowMinutes: Math.max(1, Math.min(1440, Number(data.windowMinutes) || 60)),
        appOpenEnabled: data.appOpenEnabled !== false,
        crashReportedEnabled: data.crashReportedEnabled !== false,
        soundEnabled: data.soundEnabled !== false,
        updatedAtMs: toMillis(data.updatedAt),
        updatedBy: String(data.updatedBy || OWNER_BOOTSTRAP_EMAIL)
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeToAdminNotifications(
  onData: (notifications: AdminNotificationDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'admin_notifications';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AdminNotificationDoc[] = snapshot.docs.map((d) => {
        const data = d.data({ serverTimestamps: 'estimate' });
        return {
          id: d.id,
          eventType: (data.eventType === 'crash_reported' ? 'crash_reported' : 'app_open') as TelemetryEventType,
          severity: (['info', 'warning', 'critical'].includes(data.severity) ? data.severity : 'info') as AlertSeverity,
          title: String(data.title || 'Threshold Alert'),
          message: String(data.message || ''),
          eventCount: Number(data.eventCount || 1),
          threshold: Number(data.threshold || 1),
          acknowledged: Boolean(data.acknowledged),
          acknowledgedBy: String(data.acknowledgedBy || ''),
          createdAtMs: toMillis(data.createdAt)
        };
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function saveAlertRules(
  rules: AlertRuleConfig,
  actorUid: string,
  actorEmail: string
): Promise<void> {
  const path = 'alert_rules/global';
  const sanitized = {
    appOpenThreshold: Math.max(1, Math.min(10000, Math.round(rules.appOpenThreshold))),
    crashReportedThreshold: Math.max(1, Math.min(1000, Math.round(rules.crashReportedThreshold))),
    windowMinutes: Math.max(1, Math.min(1440, Math.round(rules.windowMinutes))),
    appOpenEnabled: Boolean(rules.appOpenEnabled),
    crashReportedEnabled: Boolean(rules.crashReportedEnabled),
    soundEnabled: Boolean(rules.soundEnabled),
    updatedAt: serverTimestamp(),
    updatedBy: (actorEmail || OWNER_BOOTSTRAP_EMAIL).slice(0, 128)
  };
  try {
    await setDoc(doc(db, 'alert_rules', 'global'), sanitized);
    await recordAuditLog(
      actorUid,
      actorEmail,
      'UPDATE_ALERT_RULES',
      `Set thresholds: app_open=${sanitized.appOpenThreshold} (${sanitized.appOpenEnabled ? 'on' : 'off'}), crash_reported=${sanitized.crashReportedThreshold} (${sanitized.crashReportedEnabled ? 'on' : 'off'}), window=${sanitized.windowMinutes}m`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function logTelemetryEventToFirestore(input: {
  eventType: TelemetryEventType;
  appVersion?: string;
  androidVersion?: string;
  source?: string;
  details?: string;
}): Promise<string> {
  const eventId = makeValidDocId(input.eventType);
  const path = `telemetry_events/${eventId}`;
  const payload = {
    eventType: input.eventType,
    appVersion: (input.appVersion || '1.0.0').slice(0, 20),
    androidVersion: (input.androidVersion || 'Android 14 (API 34)').slice(0, 40),
    source: (input.source || 'android').slice(0, 32),
    details: (input.details || '').slice(0, 300),
    createdAt: serverTimestamp()
  };
  try {
    await setDoc(doc(db, 'telemetry_events', eventId), payload);
    return eventId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createAdminNotificationInFirestore(input: {
  notificationId?: string;
  eventType: TelemetryEventType;
  severity: AlertSeverity;
  title: string;
  message: string;
  eventCount: number;
  threshold: number;
}): Promise<string> {
  const id = input.notificationId ? input.notificationId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128) : makeValidDocId('alert');
  const path = `admin_notifications/${id}`;
  const payload = {
    eventType: input.eventType,
    severity: input.severity,
    title: input.title.slice(0, 120),
    message: input.message.slice(0, 400),
    eventCount: Math.max(1, Math.min(100000, Math.round(input.eventCount))),
    threshold: Math.max(1, Math.min(100000, Math.round(input.threshold))),
    acknowledged: false,
    acknowledgedBy: '',
    createdAt: serverTimestamp()
  };
  try {
    await setDoc(doc(db, 'admin_notifications', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function acknowledgeAdminNotificationInFirestore(
  notificationId: string,
  actorEmail: string
): Promise<void> {
  const path = `admin_notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'admin_notifications', notificationId), {
      acknowledged: true,
      acknowledgedBy: (actorEmail || OWNER_BOOTSTRAP_EMAIL).slice(0, 128)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAdminNotificationInFirestore(notificationId: string): Promise<void> {
  const path = `admin_notifications/${notificationId}`;
  try {
    await deleteDoc(doc(db, 'admin_notifications', notificationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
