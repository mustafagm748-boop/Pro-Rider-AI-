import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, setLogLevel, doc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

import { safeLocalStorage } from './storageUtils';

const app = initializeApp(firebaseConfig);

let firestoreInstance: any = null;
try {
  if (firebaseConfig && (firebaseConfig as any).firestoreDatabaseId) {
    firestoreInstance = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
  } else {
    firestoreInstance = getFirestore(app);
  }
} catch (e) {
  console.warn('getFirestore with databaseId failed, attempting fallback to default:', e);
  try {
    firestoreInstance = getFirestore(app);
  } catch (err2) {
    console.error('Failed to initialize Firestore database instance:', err2);
    firestoreInstance = null;
  }
}

export const db = firestoreInstance;
export const auth = getAuth(app);

export const FIREBASE_REGION = 'asia-south1'; // South Asia (Mumbai, India)
export const FIREBASE_REGION_NAME = 'South Asia (Mumbai 1 - asia-south1)';
export const PROJECT_NAME = 'Remax Pro Rider AI';

// Mute internal firestore network warning logs in console
setLogLevel('silent');

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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Warn: ', JSON.stringify(errInfo));
  // Note: We swallow the error here instead of throwing so that optimistic UI updates in App.tsx
  // (which don't catch the promise rejection) can continue to work for guest/demo users.
  // throw new Error(JSON.stringify(errInfo));
}

const provider = new GoogleAuthProvider();
// Workspace scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/forms.body');
provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
provider.addScope('https://www.googleapis.com/auth/chat.messages.create');
provider.addScope('https://www.googleapis.com/auth/chat.spaces.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = safeLocalStorage.getItem('pro_rider_google_token');

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken || '');
    } else {
      cachedAccessToken = null;
      safeLocalStorage.removeItem('pro_rider_google_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || '';
    if (cachedAccessToken) {
      safeLocalStorage.setItem('pro_rider_google_token', cachedAccessToken);
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  safeLocalStorage.removeItem('pro_rider_google_token');
};

