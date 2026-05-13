import { initializeApp, getApp, getApps } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import { getStorage } from "firebase/storage";
import { 
  initializeFirestore, 
  memoryLocalCache // ✅ FIXED: Using memory cache for React Native
} from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Your Project Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9AQfHSPwOy_R8SMAZDb_uasbyyQ2wP5U",
  authDomain: "samuel-e8a4b.firebaseapp.com",
  projectId: "samuel-e8a4b",
  storageBucket: "samuel-e8a4b.firebasestorage.app",
  messagingSenderId: "967986320464",
  appId: "1:967986320464:android:cdd95783a5a410179ead55",
};

// 2. Initialize App safely for Hot-Reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 3. Auth: Using your existing Native Persistence logic
let firebaseAuth;
try {
  // @ts-ignore
  const persistence = FirebaseAuth.getReactNativePersistence(AsyncStorage);
  firebaseAuth = FirebaseAuth.initializeAuth(app, { persistence });
} catch (e) {
  firebaseAuth = FirebaseAuth.getAuth(app);
}

export const auth = firebaseAuth;

// 4. Firestore: Synced for Stability & Performance on Mobile
export const db = initializeFirestore(app, {
  // ✅ STABILITY: Prevents the "RPC Write stream" transport errors
  experimentalAutoDetectLongPolling: true, 
  
  // ✅ FIX: This stops the "Falling back to memory cache" warning.
  // React Native doesn't have 'IndexedDB', so we use memoryLocalCache.
  localCache: memoryLocalCache({}) 
});

// 5. Storage & Exports
export const storage = getStorage(app);
export default app;
