import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup, fbSignOut } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { SAMPLE_USERS } from '../lib/sampleData';

interface RegistrationData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  organization?: string;
  phone?: string;
  address?: string;
  capacityKg?: number;
  vehicleType?: 'car' | 'van' | 'bicycle' | 'on_foot';
}

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isDemoUser: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  setAuthModalOpen: (open: boolean) => void;
  setAuthModalMode: (mode: 'login' | 'register') => void;
  openAuthModal: (mode?: 'login' | 'register') => void;
  registerWithEmailPassword: (data: RegistrationData) => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (targetRole?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'foodshare_demo_user_uid';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);

  // Modal state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Helper to load or create profile in Firestore
  const syncUserProfile = async (user: User, fallbackRole: UserRole = 'donor', additionalFields?: Partial<UserProfile>) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        setCurrentUser(data);
        return data;
      } else {
        const isAdminEmail = user.email === 'saahmad81879@gmail.com';
        const role: UserRole = isAdminEmail ? 'admin' : fallbackRole;
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || additionalFields?.displayName || 'FoodShare User',
          role,
          organization: additionalFields?.organization || (isAdminEmail ? 'Platform Administration' : 'Community Partner'),
          phone: additionalFields?.phone || user.phoneNumber || '',
          address: additionalFields?.address || 'New York, NY',
          capacityKg: additionalFields?.capacityKg || (role === 'ngo' ? 250 : undefined),
          vehicleType: additionalFields?.vehicleType || (role === 'volunteer' ? 'car' : undefined),
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newProfile);
        setCurrentUser(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn('Firestore profile sync fallback:', err);
      const fallback: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Authenticated User',
        role: user.email === 'saahmad81879@gmail.com' ? 'admin' : fallbackRole,
        isVerified: true,
      };
      setCurrentUser(fallback);
      return fallback;
    }
  };

  // Initialize Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsDemoUser(false);
        await syncUserProfile(user);
        setLoading(false);
      } else {
        const savedDemoUid = localStorage.getItem(DEMO_USER_STORAGE_KEY);
        const demoMatch = SAMPLE_USERS.find((u) => u.uid === savedDemoUid) || SAMPLE_USERS[0];
        setCurrentUser(demoMatch);
        setIsDemoUser(true);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const registerWithEmailPassword = async (data: RegistrationData) => {
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (data.displayName && cred.user) {
        await updateProfile(cred.user, { displayName: data.displayName });
      }
      await syncUserProfile(cred.user, data.role, {
        displayName: data.displayName,
        organization: data.organization,
        phone: data.phone,
        address: data.address,
        capacityKg: data.capacityKg,
        vehicleType: data.vehicleType,
      });
      setAuthModalOpen(false);
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmailPassword = async (email: string, password: string) => {
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await syncUserProfile(cred.user);
      setAuthModalOpen(false);
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (targetRole: UserRole = 'donor') => {
    try {
      setLoading(true);
      const cred = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(cred.user, targetRole);
      setAuthModalOpen(false);
    } catch (err) {
      console.error('Google Sign In Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (firebaseUser) {
        await fbSignOut(auth);
      }
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      setCurrentUser(SAMPLE_USERS[0]);
      setIsDemoUser(true);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  const switchDemoRole = (role: UserRole) => {
    const match = SAMPLE_USERS.find((u) => u.role === role) || SAMPLE_USERS[0];
    localStorage.setItem(DEMO_USER_STORAGE_KEY, match.uid);
    setCurrentUser(match);
    setIsDemoUser(true);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated: UserProfile = { ...currentUser, ...data, updatedAt: new Date().toISOString() };
    setCurrentUser(updated);

    if (!isDemoUser && firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, updated, { merge: true });
      } catch (err) {
        console.error('Error updating profile in Firestore:', err);
      }
    }
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!currentUser) return false;
    // Admins have access to everything
    if (currentUser.role === 'admin') return true;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        isDemoUser,
        authModalOpen,
        authModalMode,
        setAuthModalOpen,
        setAuthModalMode,
        openAuthModal,
        registerWithEmailPassword,
        loginWithEmailPassword,
        signInWithGoogle,
        signOut,
        switchDemoRole,
        updateProfileData,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
