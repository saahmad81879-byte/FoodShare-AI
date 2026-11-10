import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { FoodDonation, ImpactLog, UserProfile } from '../types';
import { INITIAL_SAMPLE_DONATIONS, SAMPLE_USERS } from '../lib/sampleData';
import { useAuth } from './AuthContext';

interface DonationContextType {
  donations: FoodDonation[];
  impactLogs: ImpactLog[];
  registeredUsers: UserProfile[];
  loading: boolean;
  createDonation: (payload: Omit<FoodDonation, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<FoodDonation>;
  updateDonation: (id: string, updates: Partial<FoodDonation>) => Promise<void>;
  requestDonation: (donationId: string) => Promise<{ success: boolean; message: string }>;
  updateCollectionStatus: (
    donationId: string,
    collectionStatus: 'pending' | 'scheduled' | 'in_transit' | 'collected' | 'distributed',
    notes?: string
  ) => Promise<{ success: boolean; message: string }>;
  confirmDistribution: (
    donationId: string,
    beneficiariesServed: number,
    notes?: string
  ) => Promise<{ success: boolean; message: string }>;
  acceptPickup: (donationId: string) => Promise<{ success: boolean; message: string }>;
  markDelivered: (donationId: string) => Promise<{ success: boolean; message: string }>;
  cancelDonation: (donationId: string, reason?: string) => Promise<void>;
  deleteDonation: (donationId: string) => Promise<void>;
  toggleUserVerification: (userId: string, status: boolean) => Promise<void>;
  resetToSampleData: () => Promise<void>;
}

const DonationContext = createContext<DonationContextType | undefined>(undefined);

const LOCAL_DONATIONS_KEY = 'foodshare_local_donations_india_v1';
const LOCAL_USERS_KEY = 'foodshare_local_users_india_v1';
const LOCAL_IMPACT_KEY = 'foodshare_local_impact_india_v1';

export const DonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isDemoUser, firebaseUser } = useAuth();
  const [donations, setDonations] = useState<FoodDonation[]>(() => {
    const saved = localStorage.getItem(LOCAL_DONATIONS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_SAMPLE_DONATIONS;
  });

  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(LOCAL_USERS_KEY);
    return saved ? JSON.parse(saved) : SAMPLE_USERS;
  });

  const [impactLogs, setImpactLogs] = useState<ImpactLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_IMPACT_KEY);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'impact-init-1',
        donationId: 'donation-dairy-yogurt',
        donorId: 'donor-sweet-grain',
        ngoId: 'ngo-city-harvest',
        volunteerId: 'volunteer-alex',
        kgRescued: 20,
        co2AvoidedKg: 50,
        mealsProvided: 45,
        waterSavedLiters: 5800,
        completedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Sync to localStorage as backup/demo cache
  useEffect(() => {
    localStorage.setItem(LOCAL_DONATIONS_KEY, JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem(LOCAL_IMPACT_KEY, JSON.stringify(impactLogs));
  }, [impactLogs]);

  // Real-time Firestore sync when user is authenticated with Firebase
  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    const donationsQuery = query(collection(db, 'donations'), orderBy('createdAt', 'desc'));
    const unsubscribeDonations = onSnapshot(
      donationsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: FoodDonation[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ ...(docSnap.data() as FoodDonation), id: docSnap.id });
          });
          setDonations(list);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore onSnapshot donations warning (using local synced state):', error.message);
        setLoading(false);
      }
    );

    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          const ulist: UserProfile[] = [];
          snapshot.forEach((docSnap) => {
            ulist.push(docSnap.data() as UserProfile);
          });
          setRegisteredUsers((prev) => {
            const map = new Map<string, UserProfile>();
            SAMPLE_USERS.forEach((u) => map.set(u.uid, u));
            ulist.forEach((u) => map.set(u.uid, u));
            return Array.from(map.values());
          });
        }
      },
      (error) => {
        console.warn('Firestore users listener warning:', error.message);
      }
    );

    return () => {
      unsubscribeDonations();
      unsubscribeUsers();
    };
  }, [firebaseUser]);

  // Create Donation
  const createDonation = async (
    payload: Omit<FoodDonation, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<FoodDonation> => {
    const newId = `donation-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    let aiPriorityScore = 75;
    let aiUrgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STANDARD' = 'MEDIUM';
    let aiPriorityReason = 'Standard priority food rescue item.';
    let aiSummary = `${payload.quantityKg}kg of ${payload.title} ready for dispatch.`;

    // Enrich with server-side AI evaluation
    try {
      const priorityRes = await fetch('/api/ai/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title,
          category: payload.category,
          quantityKg: payload.quantityKg,
          storageCondition: payload.storageCondition,
          preparationTime: payload.preparationTime,
          expiryWindow: payload.expiryWindow,
          allergens: payload.allergens,
          handlingNotes: payload.handlingNotes,
        }),
      });

      if (priorityRes.ok) {
        const pData = await priorityRes.json();
        aiPriorityScore = pData.priorityScore || 75;
        aiUrgencyLevel = pData.urgencyLevel || 'MEDIUM';
        aiPriorityReason = pData.priorityReason || aiPriorityReason;
      }

      const summaryRes = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donation: { ...payload, id: newId } }),
      });

      if (summaryRes.ok) {
        const sData = await summaryRes.json();
        aiSummary = sData.executiveSummary || aiSummary;
      }
    } catch (aiErr) {
      console.warn('AI enrichment fallback used:', aiErr);
    }

    const newDonation: FoodDonation = {
      ...payload,
      id: newId,
      status: 'available',
      collectionStatus: 'pending',
      aiPriorityScore,
      aiUrgencyLevel,
      aiPriorityReason,
      aiSummary,
      createdAt: now,
      updatedAt: now,
    };

    // Update local state immediately for responsive UX
    setDonations((prev) => [newDonation, ...prev]);

    // Persist to Firestore if authenticated
    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'donations', newId), newDonation);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `donations/${newId}`);
      }
    }

    return newDonation;
  };

  // Update Donation
  const updateDonation = async (id: string, updates: Partial<FoodDonation>) => {
    const now = new Date().toISOString();
    const updatedFields = { ...updates, updatedAt: now };

    setDonations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updatedFields } : d))
    );

    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'donations', id), updatedFields);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `donations/${id}`);
      }
    }
  };

  // Claim / Request donation (NGO only, enforces strict atomic single-claim constraint)
  const requestDonation = async (donationId: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Must be logged in to request food.' };
    }

    const target = donations.find((d) => d.id === donationId);
    if (!target) {
      return { success: false, message: 'Donation record not found.' };
    }

    // Atomic rule in local memory first:
    if (target.status !== 'available') {
      return {
        success: false,
        message: `Claim Rejected: This donation has already been claimed by another organization (current status: ${target.status}).`,
      };
    }

    const updates: Partial<FoodDonation> = {
      status: 'requested',
      collectionStatus: 'pending',
      requestedByNgoId: currentUser.uid,
      requestedByNgoName: currentUser.organization || currentUser.displayName,
      updatedAt: new Date().toISOString(),
    };

    // If authenticated with Firestore, run transaction to prevent race conditions
    if (firebaseUser) {
      try {
        const donationDocRef = doc(db, 'donations', donationId);
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(donationDocRef);
          if (!snap.exists()) {
            throw new Error('Donation record does not exist.');
          }
          const currentData = snap.data() as FoodDonation;
          if (currentData.status !== 'available') {
            throw new Error('This donation was already claimed by another organization.');
          }
          transaction.update(donationDocRef, updates);
        });
      } catch (err: any) {
        console.error('Firestore transaction claiming error:', err);
        return {
          success: false,
          message: err.message || 'Another NGO has already claimed this donation.',
        };
      }
    }

    setDonations((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, ...updates } : d))
    );

    return {
      success: true,
      message: `Successfully requested "${target.title}". A volunteer will be dispatched for pickup.`,
    };
  };

  // NGO Updates Collection Status (scheduled, collected, etc.)
  const updateCollectionStatus = async (
    donationId: string,
    collectionStatus: 'pending' | 'scheduled' | 'in_transit' | 'collected' | 'distributed',
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) return { success: false, message: 'Donation not found' };

    const updates: Partial<FoodDonation> = {
      collectionStatus,
      collectionTime: new Date().toISOString(),
      distributionNotes: notes || target.distributionNotes,
      updatedAt: new Date().toISOString(),
    };

    if (collectionStatus === 'collected' || collectionStatus === 'in_transit') {
      updates.status = 'in_transit';
    }

    setDonations((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, ...updates } : d))
    );

    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'donations', donationId), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `donations/${donationId}`);
      }
    }

    return {
      success: true,
      message: `Collection status updated to "${collectionStatus}".`,
    };
  };

  // NGO Confirms Actual Distribution
  const confirmDistribution = async (
    donationId: string,
    beneficiariesServed: number,
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) return { success: false, message: 'Donation not found' };

    const now = new Date().toISOString();
    const kg = target.quantityKg || 10;
    const meals = beneficiariesServed || target.estimatedServings || Math.round(kg * 2.2);
    const co2 = Math.round(kg * 2.5);
    const water = Math.round(kg * 290);

    const updates: Partial<FoodDonation> = {
      status: 'delivered',
      collectionStatus: 'distributed',
      actualDistributionConfirmed: true,
      beneficiariesServed: meals,
      distributionNotes: notes || 'Delivered directly to community beneficiaries.',
      updatedAt: now,
    };

    const newLog: ImpactLog = {
      id: `impact-${Date.now()}`,
      donationId,
      donorId: target.donorId,
      ngoId: target.requestedByNgoId || currentUser?.uid,
      volunteerId: target.volunteerId,
      kgRescued: kg,
      co2AvoidedKg: co2,
      mealsProvided: meals,
      waterSavedLiters: water,
      completedAt: now,
    };

    setDonations((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, ...updates } : d))
    );
    setImpactLogs((prev) => [newLog, ...prev]);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d399', '#f59e0b', '#3b82f6'],
      });
    } catch {
      // non-fatal
    }

    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'donations', donationId), updates);
        await setDoc(doc(db, 'impact_logs', newLog.id), newLog);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `donations/${donationId}`);
      }
    }

    return {
      success: true,
      message: `Distribution verified! Provided ${meals} meals to beneficiaries and diverted ${kg}kg from landfill.`,
    };
  };

  // Volunteer accepts pickup
  const acceptPickup = async (donationId: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Must be logged in.' };
    }

    const target = donations.find((d) => d.id === donationId);
    if (!target) {
      return { success: false, message: 'Donation not found.' };
    }

    const updates: Partial<FoodDonation> = {
      status: 'in_transit',
      collectionStatus: 'in_transit',
      volunteerId: currentUser.uid,
      volunteerName: currentUser.displayName,
      updatedAt: new Date().toISOString(),
    };

    setDonations((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, ...updates } : d))
    );

    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'donations', donationId), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `donations/${donationId}`);
      }
    }

    return {
      success: true,
      message: `Pickup confirmed! You are now en route to deliver to ${target.requestedByNgoName || 'the recipient NGO'}.`,
    };
  };

  // Mark delivered
  const markDelivered = async (donationId: string): Promise<{ success: boolean; message: string }> => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) {
      return { success: false, message: 'Donation not found.' };
    }

    if (target.status === 'delivered') {
      return { success: false, message: 'This donation is already marked as delivered.' };
    }

    return confirmDistribution(donationId, target.estimatedServings);
  };

  // Cancel donation
  const cancelDonation = async (donationId: string) => {
    const updates: Partial<FoodDonation> = {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };

    setDonations((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, ...updates } : d))
    );

    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'donations', donationId), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `donations/${donationId}`);
      }
    }
  };

  // Delete donation
  const deleteDonation = async (donationId: string) => {
    setDonations((prev) => prev.filter((d) => d.id !== donationId));

    if (firebaseUser) {
      try {
        await deleteDoc(doc(db, 'donations', donationId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `donations/${donationId}`);
      }
    }
  };

  // Toggle user verification (admin functionality)
  const toggleUserVerification = async (userId: string, status: boolean) => {
    setRegisteredUsers((prev) =>
      prev.map((u) => (u.uid === userId ? { ...u, isVerified: status } : u))
    );

    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          isVerified: status,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not update user doc verification in firestore:', err);
      }
    }
  };

  // Reset to sample data (Idempotent seed preventing duplicates)
  const resetToSampleData = async () => {
    setDonations(INITIAL_SAMPLE_DONATIONS);
    setRegisteredUsers(SAMPLE_USERS);
    localStorage.setItem(LOCAL_DONATIONS_KEY, JSON.stringify(INITIAL_SAMPLE_DONATIONS));
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(SAMPLE_USERS));

    if (firebaseUser) {
      try {
        // Upsert deterministic sample donations into Firestore without duplicates
        for (const donation of INITIAL_SAMPLE_DONATIONS) {
          await setDoc(doc(db, 'donations', donation.id), donation, { merge: true });
        }
        // Upsert deterministic sample users
        for (const user of SAMPLE_USERS) {
          await setDoc(doc(db, 'users', user.uid), user, { merge: true });
        }
      } catch (err) {
        console.warn('Could not sync sample records to Firestore (running in local mode):', err);
      }
    }
  };

  return (
    <DonationContext.Provider
      value={{
        donations,
        impactLogs,
        registeredUsers,
        loading,
        createDonation,
        updateDonation,
        requestDonation,
        updateCollectionStatus,
        confirmDistribution,
        acceptPickup,
        markDelivered,
        cancelDonation,
        deleteDonation,
        toggleUserVerification,
        resetToSampleData,
      }}
    >
      {children}
    </DonationContext.Provider>
  );
};

export const useDonations = () => {
  const context = useContext(DonationContext);
  if (!context) {
    throw new Error('useDonations must be used within a DonationProvider');
  }
  return context;
};
