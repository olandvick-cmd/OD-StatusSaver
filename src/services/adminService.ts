import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { 
  db, 
  handleFirestoreError, 
  OperationType, 
  AdminProfile, 
  AppConfigDoc, 
  AuditLogItem, 
  DailyAnalyticsDoc, 
  CrashReportDoc, 
  AdMobMetricDoc,
  OWNER_BOOTSTRAP_EMAIL
} from './firebase';

export const DEFAULT_APP_CONFIG: AppConfigDoc = {
  maintenanceMode: false,
  maintenanceMessage: 'OD Status Saver is briefly updating server metadata. Normal status saving continues uninterrupted.',
  announcementActive: false,
  announcementTitle: 'Welcome to OD Status Saver',
  announcementBody: 'Fast, secure on-device status saver for WhatsApp and WhatsApp Business.',
  adBannerEnabled: true,
  adInterstitialFrequency: 3,
  adCooldownMinutes: 4,
  rewardedAdEnabled: true,
  minAppVersion: '1.0.0',
  updatedAt: new Date().toISOString(),
  updatedBy: OWNER_BOOTSTRAP_EMAIL
};

// Log administrative action
export async function recordAuditLog(actorUid: string, actorEmail: string, action: string, details: string): Promise<void> {
  const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  try {
    await setDoc(doc(db, 'audit_logs', logId), {
      actorUid,
      actorEmail,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // If not authenticated or permission denied, handle gracefully
    console.warn('Could not persist audit log to Firestore:', err);
  }
}

// Fetch App Config
export async function fetchAppConfig(): Promise<AppConfigDoc> {
  try {
    const docRef = doc(db, 'app_config', 'global');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as AppConfigDoc;
    } else {
      return DEFAULT_APP_CONFIG;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'app_config/global');
  }
}

// Save App Config
export async function saveAppConfig(
  config: AppConfigDoc, 
  actorUid: string, 
  actorEmail: string
): Promise<void> {
  try {
    const docRef = doc(db, 'app_config', 'global');
    const payload = {
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: actorEmail
    };
    await setDoc(docRef, payload);
    await recordAuditLog(actorUid, actorEmail, 'UPDATE_CONFIG', `Updated global remote configuration and ad placement settings.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'app_config/global');
  }
}

// Fetch Admins list
export async function fetchAdminsList(): Promise<AdminProfile[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'admins'));
    const list: AdminProfile[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        uid: doc.id,
        email: data.email,
        displayName: data.displayName || 'Administrator',
        role: data.role,
        addedAt: data.addedAt,
        addedBy: data.addedBy
      });
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admins');
  }
}

// Add or update admin
export async function saveAdmin(
  admin: AdminProfile,
  actorUid: string,
  actorEmail: string
): Promise<void> {
  try {
    const docRef = doc(db, 'admins', admin.uid);
    await setDoc(docRef, {
      email: admin.email,
      displayName: admin.displayName || '',
      role: admin.role,
      addedAt: admin.addedAt || new Date().toISOString(),
      addedBy: actorEmail
    });
    await recordAuditLog(actorUid, actorEmail, 'SAVE_ADMIN', `Assigned role ${admin.role} to ${admin.email}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `admins/${admin.uid}`);
  }
}

// Remove Admin
export async function deleteAdmin(
  targetUid: string,
  targetEmail: string,
  actorUid: string,
  actorEmail: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'admins', targetUid));
    await recordAuditLog(actorUid, actorEmail, 'REVOKE_ADMIN', `Revoked administrative privileges for ${targetEmail}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `admins/${targetUid}`);
  }
}

// Fetch Audit Logs
export async function fetchAuditLogs(limitCount = 50): Promise<AuditLogItem[]> {
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const logs: AuditLogItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        actorUid: data.actorUid,
        actorEmail: data.actorEmail,
        action: data.action,
        details: data.details,
        timestamp: data.timestamp
      });
    });
    return logs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'audit_logs');
  }
}

// Fetch Daily Analytics
export async function fetchDailyAnalytics(): Promise<DailyAnalyticsDoc[]> {
  try {
    const q = query(collection(db, 'analytics_aggregates'), orderBy('date', 'desc'), limit(30));
    const snapshot = await getDocs(q);
    const results: DailyAnalyticsDoc[] = [];
    snapshot.forEach(doc => {
      results.push(doc.data() as DailyAnalyticsDoc);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'analytics_aggregates');
  }
}

// Fetch Crash Reports
export async function fetchCrashReports(): Promise<CrashReportDoc[]> {
  try {
    const snapshot = await getDocs(collection(db, 'crash_reports'));
    const reports: CrashReportDoc[] = [];
    snapshot.forEach(doc => {
      reports.push({
        id: doc.id,
        ...doc.data()
      } as CrashReportDoc);
    });
    return reports;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'crash_reports');
  }
}

// Update crash status
export async function updateCrashStatus(
  reportId: string, 
  status: 'open' | 'investigating' | 'resolved',
  actorUid: string,
  actorEmail: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'crash_reports', reportId), { status });
    await recordAuditLog(actorUid, actorEmail, 'UPDATE_CRASH_STATUS', `Updated crash report ${reportId} status to ${status}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `crash_reports/${reportId}`);
  }
}

// Fetch AdMob Metrics
export async function fetchAdMobMetrics(): Promise<AdMobMetricDoc[]> {
  try {
    const snapshot = await getDocs(collection(db, 'admob_reports'));
    const list: AdMobMetricDoc[] = [];
    snapshot.forEach(doc => {
      list.push({
        id: doc.id,
        ...doc.data()
      } as AdMobMetricDoc);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admob_reports');
  }
}

// Seed initial Firestore demo records if collections are empty (for instant verification)
export async function seedInitialAdminDataIfEmpty(actorUid: string, actorEmail: string): Promise<boolean> {
  try {
    // 1. Check App Config
    const configRef = doc(db, 'app_config', 'global');
    const configSnap = await getDoc(configRef);
    if (!configSnap.exists()) {
      await setDoc(configRef, {
        ...DEFAULT_APP_CONFIG,
        updatedBy: actorEmail,
        updatedAt: new Date().toISOString()
      });
    }

    // 2. Ensure Owner Admin Doc
    const ownerRef = doc(db, 'admins', actorUid);
    const ownerSnap = await getDoc(ownerRef);
    if (!ownerSnap.exists()) {
      await setDoc(ownerRef, {
        email: actorEmail,
        displayName: 'OD Status Saver Owner',
        role: 'owner',
        addedAt: new Date().toISOString(),
        addedBy: 'bootstrap'
      });
    }

    // 3. Seed aggregate daily analytics (last 7 days aggregate)
    const analyticsSnap = await getDocs(collection(db, 'analytics_aggregates'));
    if (analyticsSnap.empty) {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        await setDoc(doc(db, 'analytics_aggregates', dateStr), {
          date: dateStr,
          dau: 1240 + Math.floor(Math.sin(i) * 200 + i * 40),
          mau: 18500 + i * 150,
          newUsers: 140 + Math.floor(Math.random() * 30),
          sessions: 3100 + i * 90,
          avgEngagementSeconds: 145 + (i % 3) * 10,
          whatsappSelected: 1980 + i * 45,
          whatsappBusinessSelected: 1120 + i * 35,
          previewsCount: 4200 + i * 110,
          saveSuccess: 3850 + i * 95,
          saveErrors: 12 + (i % 4)
        });
      }
    }

    // 4. Seed Crash Reports if empty
    const crashSnap = await getDocs(collection(db, 'crash_reports'));
    if (crashSnap.empty) {
      await setDoc(doc(db, 'crash_reports', 'crash_saf_timeout_api33'), {
        appVersion: '1.0.0',
        androidVersion: 'Android 13 (API 33)',
        deviceModel: 'Samsung Galaxy A53',
        exceptionType: 'SecurityException: User cancelled Uri persist request',
        message: 'Permission prompt cancelled during DocumentTree selection',
        occurrences: 4,
        status: 'investigating',
        lastSeen: new Date().toISOString()
      });
      await setDoc(doc(db, 'crash_reports', 'crash_oom_large_video_thumb'), {
        appVersion: '1.0.0',
        androidVersion: 'Android 11 (API 30)',
        deviceModel: 'Xiaomi Redmi Note 9',
        exceptionType: 'OutOfMemoryError: Video thumbnail frame extraction',
        message: 'Bitmap memory allocation spike on 4K status video',
        occurrences: 2,
        status: 'open',
        lastSeen: new Date(Date.now() - 86400000).toISOString()
      });
    }

    // 5. Seed AdMob performance report if empty
    const admobSnap = await getDocs(collection(db, 'admob_reports'));
    if (admobSnap.empty) {
      const todayStr = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, 'admob_reports', todayStr), {
        date: todayStr,
        impressions: 4820,
        clicks: 86,
        estimatedEarnings: 14.85,
        ecpm: 3.08,
        adFormat: 'BANNER_AND_INTERSTITIAL'
      });
    }

    // Record audit log
    await recordAuditLog(actorUid, actorEmail, 'INITIALIZE_METRICS', 'Initial Firestore collections and zero-PII metrics seeded.');
    return true;
  } catch (err) {
    console.warn('Seeding check skipped or restricted:', err);
    return false;
  }
}
