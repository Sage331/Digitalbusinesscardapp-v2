import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut as firebaseSignOut,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword as firebaseUpdatePassword,
    getAuth, 
    deleteUser,
    GoogleAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp, runTransaction, getDoc } from 'firebase/firestore'; 
import { UserProfile } from '../types';
import i18n from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '967986320464-o8q55kjmtl1slthp7vktidaj6djlf70t.apps.googleusercontent.com',
  // @ts-ignore - Force account selection prompt where supported by the SDK version
  prompt: 'select_account',
});

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    profileLoading: boolean; 
    language: string; 
    setLanguage: (lang: string) => void; 
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (profile: UserProfile, password?: string) => Promise<User>; 
    signInWithGoogle: () => Promise<void>; 
    signOut: () => Promise<void>;
    updateProfile: (profile: UserProfile, manualUid?: string) => Promise<void>; 
    resetPassword: (email: string) => Promise<void>;
    reauthenticate: (currentPassword: string) => Promise<void>;
    changePassword: (newPassword: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🛠️ HELPER: Generate clean base username
const generateBaseUsername = (firstName?: string, lastName?: string) => {
    const cleanFirst = (firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = (lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const base = `${cleanFirst}${cleanLast}`;
    return base || `user${Math.floor(Math.random() * 10000)}`;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true); 
    const [language, setLanguageState] = useState<string>('en');

    // 🚀 SIGN IN WITH GOOGLE
    const signInWithGoogle = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            
            try {
                await GoogleSignin.signOut();
            } catch (e) {
                // Ignore errors if no user was currently signed in
            }

            const response = await GoogleSignin.signIn();
            const idToken = response.data?.idToken;

            // ✅ SILENT FIX: Handle user cancellation gracefully
            if (!idToken) {
                console.log("Google Sign-In: No ID Token (User likely cancelled).");
                return;
            }

            const credential = GoogleAuthProvider.credential(idToken);
            const result = await signInWithCredential(auth, credential);
            const uid = result.user.uid;

            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // 🚀 NEW USER LOGIC: Extract names for pre-filling Onboarding
                const displayName = result.user.displayName || '';
                const nameParts = displayName.split(' ');
                const firstName = nameParts[0] || 'User';
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                const googlePhoto = result.user.photoURL || '';
                
                const baseUsername = generateBaseUsername(firstName, lastName);

                await runTransaction(db, async (transaction) => {
                    let finalUsername = baseUsername;
                    let suffix = 1;
                    let nameTaken = true;

                    while (nameTaken) {
                        const nameRef = doc(db, "usernames", finalUsername);
                        const nameSnap = await transaction.get(nameRef);
                        if (!nameSnap.exists()) {
                            nameTaken = false;
                            transaction.set(nameRef, { uid });
                        } else {
                            finalUsername = `${baseUsername}${suffix}`;
                            suffix++;
                        }
                    }

                    const initialCard = {
                        id: uid,
                        profileImage: googlePhoto, 
                        hasSeenTour: false,
                        cardId: `card_${Date.now()}`,
                        cardName: "Primary Identity",
                        firstName,
                        lastName,
                        email: result.user.email || '',
                        emails: [{ address: result.user.email || '', type: 'work' }],
                        links: [],
                        phone: '',
                        company: '',
                        title: '',
                        bio: ''
                    } as unknown as UserProfile;

                    transaction.set(userRef, {
                        firstName,
                        lastName,
                        email: result.user.email,
                        username: finalUsername,
                        id: uid,
                        createdAt: serverTimestamp(),
                        // 🛑 Locked for OnboardingFlow
                        onboardingComplete: false, 
                        cards: [initialCard]
                    }, { merge: true });
                });
            }
        } catch (error: any) {
            // ✅ Only log/throw actual errors, ignore standard cancellation codes
            if (error.code !== 'ASYNC_OP_IN_PROGRESS' && error.code !== '-3' && error.message !== 'Sign in cancelled') {
                console.error("Google Sign-In technical error:", error);
                throw error;
            }
        }
    };

    // 🌍 LOAD SAVED LANGUAGE
    useEffect(() => {
        const loadSavedLanguage = async () => {
            try {
                const saved = await AsyncStorage.getItem('connectme_lang');
                if (saved) {
                    setLanguageState(saved);
                    i18n.changeLanguage(saved);
                }
            } catch (e) {
                console.error("Failed to load language", e);
            }
        };
        loadSavedLanguage();
    }, []);

    // 🗑️ DELETE AUTH ACCOUNT
    const deleteAccount = async () => {
        if (auth.currentUser) {
            try {
                await deleteUser(auth.currentUser);
            } catch (error) {
                throw error; 
            }
        }
    };

    // 🌐 UPDATE LANGUAGE
    const setLanguage = async (lang: string) => {
        setLanguageState(lang);
        try {
            await AsyncStorage.setItem('connectme_lang', lang);
            i18n.changeLanguage(lang);
            if (user && userProfile) {
                updateProfile({ ...userProfile, language: lang });
            }
        } catch (e) {
            console.error("Failed to save language", e);
        }
    };

    // 🕵️ AUTH & PROFILE LISTENER
    useEffect(() => {
        let unsubscribeProfile: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            
            if (currentUser) {
                setProfileLoading(true); 
                const docRef = doc(db, 'users', currentUser.uid);
                
                unsubscribeProfile = onSnapshot(docRef, 
                    async (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data() as UserProfile;
                            setUserProfile(data);
                            
                            if (data.language && data.language !== language) {
                                setLanguageState(data.language);
                                await AsyncStorage.setItem('connectme_lang', data.language);
                                i18n.changeLanguage(data.language);
                            }
                        } else {
                            setUserProfile(null);
                        }
                        setProfileLoading(false);
                        setLoading(false);
                    }, 
                    (error) => {
                        console.error("Firestore Listener Error:", error);
                        setProfileLoading(false);
                        setLoading(false);
                    }
                );
            } else {
                if (unsubscribeProfile) unsubscribeProfile();
                setUserProfile(null);
                setProfileLoading(false);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, [language, user]); 

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (profile: UserProfile, password?: string) => {
        if (!password || !profile.email) throw new Error("Email and password are required.");

        const result = await createUserWithEmailAndPassword(auth, profile.email, password);
        const uid = result.user.uid;
        const baseUsername = generateBaseUsername(profile.firstName, profile.lastName);
        
        let finalProfileToSet: UserProfile | null = null;

        await runTransaction(db, async (transaction) => {
            let finalUsername = baseUsername;
            let suffix = 1;
            let nameTaken = true;

            while (nameTaken) {
                const nameRef = doc(db, "usernames", finalUsername);
                const nameSnap = await transaction.get(nameRef);
                
                if (!nameSnap.exists()) {
                    nameTaken = false;
                    transaction.set(nameRef, { uid: uid }); 
                } else {
                    finalUsername = `${baseUsername}${suffix}`;
                    suffix++;
                }
            }

            const initialCard = {
                id: uid,
                profileImage: profile.profileImage || '',
                hasSeenTour: profile.hasSeenTour || false,
                cardId: `card_${Date.now()}`,
                cardName: "Primary Identity",
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                emails: [{ address: profile.email, type: 'work' }],
                phone: profile.phone || '',
                company: profile.company || '',
                title: profile.title || '',
                links: profile.links || [],
                bio: profile.bio || ''
            } as unknown as UserProfile;

            const fullProfile = {
                ...profile,
                id: uid,
                username: finalUsername, 
                language: profile.language || language, 
                createdAt: serverTimestamp(),
                onboardingComplete: true,
                cards: [initialCard] 
            };

            const userRef = doc(db, 'users', uid);
            transaction.set(userRef, fullProfile, { merge: true });
            
            finalProfileToSet = fullProfile as UserProfile;
        });

        if (finalProfileToSet) {
            setUserProfile(finalProfileToSet);
        }

        return result.user;
    };

    const signOut = async () => {
        try {
            const lang = await AsyncStorage.getItem('connectme_lang');
            
            try {
                await GoogleSignin.signOut();
            } catch (googleError) {
                console.log("Google session clear skipped or failed", googleError);
            }

            await firebaseSignOut(auth);
            await AsyncStorage.clear(); 
            if (lang) await AsyncStorage.setItem('connectme_lang', lang);
        } catch (e) {
            console.error("Sign out error", e);
        }
    };

    const updateProfile = async (profile: UserProfile, manualUid?: string) => {
        const uid = manualUid || user?.uid;
        if (!uid) return;

        const updatedProfile = { 
            ...profile, 
            id: uid, 
            language: profile.language || language, 
            onboardingComplete: true 
        };

        if (uid === user?.uid) {
            setUserProfile(updatedProfile);
        }

        await setDoc(doc(db, 'users', uid), updatedProfile, { merge: true });
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const reauthenticate = async (currentPassword: string) => {
        if (!user || !user.email) throw new Error("No user logged in");
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
    };

    const changePassword = async (newPassword: string) => {
        if (!user) throw new Error("No user logged in");
        await firebaseUpdatePassword(user, newPassword);
    };

    return (
        <AuthContext.Provider value={{ 
            user, userProfile, loading, profileLoading,
            language, setLanguage, deleteAccount,
            signIn, signUp, signOut, updateProfile, resetPassword, reauthenticate, changePassword,
            signInWithGoogle 
        }}>
            {children}
        </AuthContext.Provider>
    );
} 

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}