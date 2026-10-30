import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleProvider, 
  AdminProfile, 
  AdminRole, 
  OWNER_BOOTSTRAP_EMAIL,
  OperationType,
  handleFirestoreError
} from '../services/firebase';

interface AdminAuthContextType {
  currentUser: User | null;
  adminProfile: AdminProfile | null;
  role: AdminRole | null;
  loading: boolean;
  error: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isAnalyst: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  bootstrapOwnerProfile: () => Promise<void>;
  loginAsSimulatedAdmin: (role: AdminRole, email: string) => void;
  isSimulatedSession: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulatedSession, setIsSimulatedSession] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setError(null);

      if (!user) {
        if (!isSimulatedSession) {
          setAdminProfile(null);
        }
        setLoading(false);
        return;
      }

      try {
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminSnapshot = await getDoc(adminDocRef);

        if (adminSnapshot.exists()) {
          const data = adminSnapshot.data();
          setAdminProfile({
            uid: user.uid,
            email: data.email || user.email || '',
            displayName: data.displayName || user.displayName || 'Administrator',
            role: data.role as AdminRole,
            addedAt: data.addedAt || new Date().toISOString(),
            addedBy: data.addedBy || 'system'
          });
        } else {
          // Check if this is the bootstrapped owner
          if (user.email?.toLowerCase() === OWNER_BOOTSTRAP_EMAIL.toLowerCase()) {
            // Auto-provision initial Owner profile
            const newProfile: AdminProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'OD Status Saver Owner',
              role: 'owner',
              addedAt: new Date().toISOString(),
              addedBy: 'bootstrap'
            };
            await setDoc(adminDocRef, newProfile);
            setAdminProfile(newProfile);
          } else {
            // User is signed in with Firebase, but NOT an approved administrator
            setAdminProfile(null);
            setError('Access Denied: Your account is not authorized as an administrator. Public registration is prohibited.');
          }
        }
      } catch (err) {
        console.error('Error fetching admin profile:', err);
        setError('Error validating administrator credentials. Please check network connectivity or security rules.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isSimulatedSession]);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Google sign-in popup error:', err);
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        setError('Popup blocked by browser. Please allow popups or use the developer owner session toggle below for testing.');
      } else {
        setError(err?.message || 'Authentication failed. Please retry.');
      }
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setIsSimulatedSession(false);
    try {
      await fbSignOut(auth);
      setAdminProfile(null);
      setCurrentUser(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  const bootstrapOwnerProfile = async () => {
    if (!currentUser) return;
    try {
      const adminDocRef = doc(db, 'admins', currentUser.uid);
      const newProfile: AdminProfile = {
        uid: currentUser.uid,
        email: currentUser.email || OWNER_BOOTSTRAP_EMAIL,
        displayName: currentUser.displayName || 'OD Status Saver Owner',
        role: 'owner',
        addedAt: new Date().toISOString(),
        addedBy: 'bootstrap'
      };
      await setDoc(adminDocRef, newProfile);
      setAdminProfile(newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `admins/${currentUser.uid}`);
    }
  };

  // Safe developer sandbox session toggle for inspecting the 3 distinct roles in preview
  const loginAsSimulatedAdmin = (role: AdminRole, email: string) => {
    setIsSimulatedSession(true);
    setAdminProfile({
      uid: `simulated-${role}-${Date.now()}`,
      email,
      displayName: role === 'owner' ? 'OD Owner (Olandvick)' : role === 'administrator' ? 'Lead Admin' : 'Security Analyst',
      role,
      addedAt: new Date().toISOString(),
      addedBy: 'local-test-harness'
    });
    setLoading(false);
  };

  const role = adminProfile?.role || null;
  const isOwner = role === 'owner';
  const isAdmin = role === 'owner' || role === 'administrator';
  const isAnalyst = role === 'owner' || role === 'administrator' || role === 'analyst';

  return (
    <AdminAuthContext.Provider
      value={{
        currentUser,
        adminProfile,
        role,
        loading,
        error,
        isOwner,
        isAdmin,
        isAnalyst,
        signInWithGoogle,
        signOut,
        bootstrapOwnerProfile,
        loginAsSimulatedAdmin,
        isSimulatedSession
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
