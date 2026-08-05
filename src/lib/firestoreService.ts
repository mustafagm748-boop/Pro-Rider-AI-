import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, updateDoc, onSnapshot, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { UserProfile, DriverProfile, Ride, UserStatus } from '../types';

export const getUserByGoogleUid = async (googleUid: string): Promise<UserProfile | DriverProfile | null> => {
  const path = 'users';
  if (!db) return null;
  try {
    const q = query(collection(db, path), where('googleUid', '==', googleUid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as UserProfile | DriverProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
};

// Sync User Profile
export const saveUserToFirestore = async (user: UserProfile | DriverProfile) => {
  if (!user || !user.id || !db) return;
  const userPath = `users/${user.id}`;
  try {
    const userRef = doc(db, 'users', user.id);
    const payload: any = {
      id: user.id,
      name: user.name || 'User',
      phone: user.phone || '',
      email: user.email || '',
      role: user.role || 'passenger',
      language: user.language || 'en',
      theme: user.theme || 'light',
      createdAt: user.createdAt || Date.now(),
      walletBalance: user.walletBalance ?? 0,
      status: (user as any).status || 'approved'
    };
    if ((user as DriverProfile).selfieUrl) {
      payload.selfieUrl = (user as DriverProfile).selfieUrl;
    }
    if ((user as DriverProfile).vehicleType) {
      payload.vehicleType = (user as DriverProfile).vehicleType;
    }
    if ((user as DriverProfile).serviceType) {
      payload.serviceType = (user as DriverProfile).serviceType;
    }
    if ((user as DriverProfile).driveMode) {
      payload.driveMode = (user as DriverProfile).driveMode;
    }
    if ((user as DriverProfile).selectedCompany) {
      payload.selectedCompany = (user as DriverProfile).selectedCompany;
    }
    if ((user as DriverProfile).customTarget) {
      payload.customTarget = (user as DriverProfile).customTarget;
    }
    if ((user as DriverProfile).discountPercentage) {
      payload.discountPercentage = (user as DriverProfile).discountPercentage;
    }
    
    // Document URLs (Consistent with DriverProfile type)
    if ((user as DriverProfile).idCardFrontUrl) payload.idCardFrontUrl = (user as DriverProfile).idCardFrontUrl;
    if ((user as DriverProfile).idCardBackUrl) payload.idCardBackUrl = (user as DriverProfile).idCardBackUrl;
    if ((user as DriverProfile).licenseFrontUrl) payload.licenseFrontUrl = (user as DriverProfile).licenseFrontUrl;
    if ((user as DriverProfile).licenseBackUrl) payload.licenseBackUrl = (user as DriverProfile).licenseBackUrl;
    if ((user as DriverProfile).vehicleFrontUrl) payload.vehicleFrontUrl = (user as DriverProfile).vehicleFrontUrl;
    if ((user as DriverProfile).vehicleBackUrl) payload.vehicleBackUrl = (user as DriverProfile).vehicleBackUrl;
    if ((user as DriverProfile).vehicleBookFrontUrl) payload.vehicleBookFrontUrl = (user as DriverProfile).vehicleBookFrontUrl;
    if ((user as DriverProfile).vehicleBookBackUrl) payload.vehicleBookBackUrl = (user as DriverProfile).vehicleBookBackUrl;
    
    // Legacy mapping for Admin compatibility if needed
    if ((user as any).cnicFront) payload.cnicFront = (user as any).cnicFront;
    if ((user as any).cnicBack) payload.cnicBack = (user as any).cnicBack;
    if ((user as any).licenseFront) payload.licenseFront = (user as any).licenseFront;
    if ((user as any).vehiclePhoto) payload.vehiclePhoto = (user as any).vehiclePhoto;
    
    await setDoc(userRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
};

// Update User Profile in Firestore
export const updateUserInFirestore = async (userId: string, updates: Partial<UserProfile | DriverProfile>) => {
  if (!userId || !db) return;
  const userPath = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, updates as any, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, userPath);
  }
};

// Sync Ride to Firestore
export const saveRideToFirestore = async (ride: Ride) => {
  if (!ride || !ride.id || !db) return;
  const path = `rides/${ride.id}`;
  try {
    const rideRef = doc(db, 'rides', ride.id);
    await setDoc(rideRef, { ...ride }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

// Update Ride Status (safely handles document creation if doc doesn't exist yet)
export const updateRideInFirestore = async (rideId: string, updates: Partial<Ride>) => {
  if (!rideId || !db) return;
  const path = `rides/${rideId}`;
  try {
    const rideRef = doc(db, 'rides', rideId);
    await setDoc(rideRef, updates as any, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
};

// Subscribe to Active Rides
export const subscribeToRides = (onRidesUpdated: (rides: Ride[]) => void) => {
  const path = 'rides';
  if (!db) return () => {};
  try {
    const ridesRef = collection(db, path);
    return onSnapshot(ridesRef, (snapshot) => {
      const rides: Ride[] = [];
      snapshot.forEach((docSnap) => {
        rides.push(docSnap.data() as Ride);
      });
      rides.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onRidesUpdated(rides);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
};

// Subscribe to Active Rides for specific driver where driverId == currentDriver
export const subscribeToDriverRides = (driverId: string, onRidesUpdated: (rides: Ride[]) => void) => {
  const path = 'rides';
  if (!db) return () => {};
  try {
    const ridesRef = collection(db, path);
    return onSnapshot(ridesRef, (snapshot) => {
      const rides: Ride[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Ride;
        if (data.driverId === driverId) {
          rides.push(data);
        }
      });
      rides.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onRidesUpdated(rides);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
};

// Calls Firestore Structure & Real-time Subscription
export interface FirestoreCall {
  callId: string;
  from: string;
  to: string;
  status: 'ringing' | 'connected' | 'ended';
  createdAt?: number;
}

export const saveCallToFirestore = async (callData: FirestoreCall) => {
  if (!callData || !callData.callId || !db) return;
  const path = `calls/${callData.callId}`;
  try {
    const callRef = doc(db, 'calls', callData.callId);
    await setDoc(callRef, {
      ...callData,
      createdAt: callData.createdAt || Date.now()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const subscribeToCalls = (userId: string, onCallsUpdated: (calls: FirestoreCall[]) => void) => {
  const path = 'calls';
  if (!db) return () => {};
  try {
    const callsRef = collection(db, path);
    return onSnapshot(callsRef, (snapshot) => {
      const calls: FirestoreCall[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as FirestoreCall;
        if (data.from === userId || data.to === userId) {
          calls.push(data);
        }
      });
      onCallsUpdated(calls);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
};

// Fetch Rides Once
export const fetchRidesOnce = async (): Promise<Ride[]> => {
  const path = 'rides';
  if (!db) return [];
  try {
    const ridesRef = collection(db, path);
    const snapshot = await getDocs(ridesRef);
    const rides: Ride[] = [];
    snapshot.forEach((docSnap) => {
      rides.push(docSnap.data() as Ride);
    });
    rides.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return rides;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
};

// Clear All Rides (Admin Only Tool)
export const deleteAllRidesFromFirestore = async () => {
  const path = 'rides';
  if (!db) return;
  try {
    const ridesRef = collection(db, path);
    const snapshot = await getDocs(ridesRef);
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

// Sync Status/Story
export const saveStatusToFirestore = async (status: UserStatus) => {
  if (!status || !status.id || !db) return;
  const path = `statuses/${status.id}`;
  try {
    const statusRef = doc(db, 'statuses', status.id);
    const payload = {
      id: status.id,
      userId: status.userId || 'anon',
      userName: status.userName || 'Anonymous',
      type: status.type || 'text',
      content: status.content || status.text || '',
      timestamp: status.timestamp || Date.now()
    };
    await setDoc(statusRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

// Subscribe to Statuses
export const subscribeToStatuses = (onStatusesUpdated: (statuses: UserStatus[]) => void) => {
  const path = 'statuses';
  if (!db) return () => {};
  try {
    const ref = collection(db, path);
    return onSnapshot(ref, (snapshot) => {
      const list: UserStatus[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: data.id,
          userId: data.userId,
          userName: data.userName,
          type: data.type,
          text: data.content,
          content: data.content,
          timestamp: data.timestamp
        } as UserStatus);
      });
      list.sort((a, b) => b.timestamp - a.timestamp);
      onStatusesUpdated(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
};

// Group Settings Sync
export const saveGroupConfigToFirestore = async (config: any) => {
  const path = 'groupSettings/default';
  if (!db) return;
  try {
    const ref = doc(db, 'groupSettings', 'default');
    await setDoc(ref, {
      id: 'default',
      ...config,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const subscribeToGroupConfig = (onConfigUpdated: (config: any) => void) => {
  const path = 'groupSettings/default';
  if (!db) return () => {};
  try {
    const ref = doc(db, 'groupSettings', 'default');
    return onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        onConfigUpdated(docSnap.data());
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
};

// Subscribe to Users
export const subscribeToUsers = (onUsersUpdated: (users: (UserProfile | DriverProfile)[]) => void) => {
  const path = 'users';
  if (!db) return () => {};
  try {
    const ref = collection(db, path);
    return onSnapshot(ref, (snapshot) => {
      const users: (UserProfile | DriverProfile)[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as (UserProfile | DriverProfile));
      });
      onUsersUpdated(users);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
};
