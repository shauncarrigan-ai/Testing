/**
 * Firebase / Firestore cloud sync (optional).
 *
 * To enable cloud sync:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Add a web app and copy the config
 * 3. Create firebase.config.ts from the example file and paste your config
 * 4. Uncomment the import below
 *
 * The app works fully offline without Firebase.
 */

// import { initializeApp } from 'firebase/app';
// import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
// import { firebaseConfig } from '../../firebase.config';

// const app = initializeApp(firebaseConfig);
// export const db = getFirestore(app);

export const isFirebaseEnabled = false;

/**
 * Sync local store state to Firestore for a given user.
 * Called after any significant state change.
 */
export const syncToCloud = async (
  _userId: string,
  _data: Record<string, unknown>
): Promise<void> => {
  if (!isFirebaseEnabled) return;
  // const ref = doc(db, 'users', userId);
  // await setDoc(ref, data, { merge: true });
};

/**
 * Fetch latest cloud state for a user on first launch.
 */
export const fetchFromCloud = async (
  _userId: string
): Promise<Record<string, unknown> | null> => {
  if (!isFirebaseEnabled) return null;
  // const ref = doc(db, 'users', userId);
  // const snap = await getDoc(ref);
  // return snap.exists() ? snap.data() : null;
  return null;
};
