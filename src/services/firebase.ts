import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Error handling types required by Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Evict stale or unrefreshable cached tokens to prevent token-service-api loop
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await user.getIdToken();
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (msg.includes('token-service-api') || msg.includes('disabled')) {
          console.warn('Clearing stale auth session for unpropagated project token service.');
          await fbSignOut(auth).catch(() => {});
        }
      }
    }
  });
}

// Test connection on boot per Firebase skill guidelines
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes('the client is offline') || msg.includes('token-service-api') || msg.includes('Could not reach Cloud Firestore')) {
      console.warn('Firestore backend connection pending or operating in offline mode.');
    }
  }
}
testFirestoreConnection();

export type AdminRole = 'owner' | 'administrator' | 'analyst';

export interface AdminProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: AdminRole;
  addedAt: string;
  addedBy: string;
}

export interface AuditLogItem {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AppConfigDoc {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementActive: boolean;
  announcementTitle: string;
  announcementBody: string;
  adBannerEnabled: boolean;
  adInterstitialFrequency: number;
  adCooldownMinutes: number;
  rewardedAdEnabled: boolean;
  minAppVersion: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DailyAnalyticsDoc {
  date: string;
  dau: number;
  mau: number;
  newUsers: number;
  sessions: number;
  avgEngagementSeconds: number;
  whatsappSelected: number;
  whatsappBusinessSelected: number;
  previewsCount: number;
  saveSuccess: number;
  saveErrors: number;
  appVersions?: Record<string, number>;
}

export interface CrashReportDoc {
  id: string;
  appVersion: string;
  androidVersion: string;
  deviceModel: string;
  exceptionType: string;
  message: string;
  occurrences: number;
  status: 'open' | 'investigating' | 'resolved';
  lastSeen: string;
}

export interface AdMobMetricDoc {
  id: string;
  date: string;
  impressions: number;
  clicks: number;
  estimatedEarnings: number;
  ecpm: number;
  adFormat: string;
}

export const OWNER_BOOTSTRAP_EMAIL = 'Olandvick@gmail.com';
