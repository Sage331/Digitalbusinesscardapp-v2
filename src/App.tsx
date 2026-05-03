import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, BackHandler, Platform, Alert, Animated } from 'react-native';
import i18n from 'i18next';
import "./i18n/config";
import { useTranslation } from 'react-i18next';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Components
import { LandingPage as Landing } from "./components/LandingPage";
import { SignInPage as SignIn } from "./components/SignInPage";
import { OnboardingFlow as Onboarding } from "./components/OnboardingFlow";
import { IdentityHub } from "./components/IdentityHub"; 
import { QRDisplayPage as QRDisplay } from "./components/QRDisplayPage";
import { QRScannerPage as QRScanner } from "./components/QRScannerPage";
import { ContactCard } from "./components/ContactCard";
import { ContactsListPage as ContactsList } from "./components/ContactsListPage";
import { ContactDetailPage as ContactDetail } from "./components/ContactDetailPage";
import { ProfileEditPage as EditProfile } from "./components/ProfileEditPage";
import { ScannerService } from './services/ScannerService';
import { SettingsPage as Settings } from "./components/SettingsPage";

// Icons & Types
import { QrCode } from "lucide-react-native";
import { Contact, UserProfile } from "./types";
import { LocationService } from "./services/locationService";
import { ContactService } from "./services/contactService";

import { collection, onSnapshot, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { BottomNav } from "./components/BottomNav";

// Contexts
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { UIProvider, useUI } from "./contexts/UIContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

function AppContent() {
  const { 
    user, userProfile: authUserProfile, profileLoading, deleteAccount,
    signIn, signUp, signOut, updateProfile, resetPassword, loading, reauthenticate, changePassword 
  } = useAuth();
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const { showToast, showConfirm } = useUI();
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  const [authScreen, setAuthScreen] = useState<"landing" | "signin" | "onboarding">("landing");
  const [currentScreen, setCurrentScreen] = useState<any>("identity-hub"); 
  
  const [scannedContact, setScannedContact] = useState<Contact | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);

  // --- 🎨 PULSING ANIMATION LOGIC ---
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // ✅ ENHANCED LOADING STATE: Keeps shield up if profile is fetching during Google Auth
  const isAppLoading = loading || (user && profileLoading) || !minLoadingTimePassed;

  useEffect(() => {
    if (isAppLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    }
  }, [isAppLoading, pulseAnim]);

  // --- IDENTITY LOGIC ---
  const handleAddNewCard = async (mode: 'fresh' | 'duplicate' = 'duplicate', sourceIndex = 0) => {
    if (!user || !authUserProfile) return;
    
    const currentCards = authUserProfile.cards || [authUserProfile];
    if (currentCards.length >= 5) {
      showToast(t('hub.limitReached', "Limit reached: 5 cards max"), "error");
      return;
    }

    if (mode === 'fresh') {
      setCurrentScreen('create-profile');
      return;
    }

    const sourceCard = currentCards[sourceIndex] || currentCards[0];
    const newCard = {
      ...sourceCard, 
      cardId: `card_${Date.now()}`, 
      cardName: `IDENTITY ${currentCards.length + 1}`,
    };

    try {
      const newCardsArray = [...currentCards, newCard];
      await updateProfile({
        ...authUserProfile,
        cards: newCardsArray
      });
      
      const newCardIndex = newCardsArray.length - 1;
      setActiveIndex(newCardIndex);
      showToast(t('hub.cloned', "Identity duplicated!"), "success");
    } catch (error) {
      showToast(t('common.error'), "error");
    }
  };

  const navigateTo = (screen: string, contactId: string | null = null) => {
    setCurrentScreen(screen);
    setSelectedContactId(contactId);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setAuthScreen("landing");
      setCurrentScreen("identity-hub"); 
    } catch (error) {}
  };

  const handleOnboardingComplete = async (profile: UserProfile, password?: string) => {
    if (!password && !user) {
      showToast(t('errors.auth.generic', 'Password is required'), "error");
      return;
    }
    try {
      if (user) {
        await updateProfile(profile);
      } else {
        await signUp(profile, password!);
      }
      showToast(t('onboarding.notifications.welcome', 'Welcome aboard!'), "success");
      navigateTo("identity-hub"); 
    } catch (error: any) {
      throw error; 
    }
  };

  // --- QR & SCANNER LOGIC ---
  const handleScan = async (rawData: any, resetScanner: () => void) => {
    try {
      const dataString = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);
      const result = ScannerService.parse(dataString);

      if (!result.isValid) {
        showToast(t('qr.scanner.noReachMethod'), "error");
        setTimeout(() => resetScanner(), 5000);
        return; 
      }

      let finalProfile = { ...result.profile };
      let targetUid = result.connectMeId; 

      // 🛑 SUSPENDED: Location fetching removed to ensure instant scanning
      // LocationService.getCurrentLocationName().then(...) 

      if (result.connectMeId) {
        try {
          const usernameRef = doc(db, "usernames", result.connectMeId);
          const usernameSnap = await getDoc(usernameRef);
          
          if (usernameSnap.exists()) {
            targetUid = usernameSnap.data().uid; 
          }

          if (targetUid) {
            // Scanner fetches Owner's live profile to get missing data (like image)
            const liveProfile = await ContactService.getProfileById(targetUid);
            if (liveProfile && liveProfile.profileImage) {
              finalProfile.profileImage = liveProfile.profileImage;
            }
            
            if (user && authUserProfile) {
              // Scanner sends their ACTIVE CARD as the handshake
              const myActiveCard = authUserProfile.cards?.[activeIndex] || authUserProfile;
              const myProfilePayload = { ...myActiveCard, id: user.uid } as UserProfile;
              await ContactService.sendConnectionRequest(user.uid, myProfilePayload, targetUid);
            }
          }
        } catch (fetchError) {
          console.error("Error during live fetch/handshake:", fetchError);
        }
      }

      finalizeScan(finalProfile, targetUid);
    } catch (error) {
      showToast(t('qr.scanner.invalid'), "error");
      setTimeout(() => resetScanner(), 5000);
    }
  };

  const finalizeScan = (parsedProfile: any, id: string | null) => {
    const finalId = id || `ext-${Date.now()}`;
    const initialContact: Contact = {
      id: finalId,
      profile: { 
        ...parsedProfile, 
        id: finalId,
        firstName: parsedProfile.firstName || "New",
        lastName: parsedProfile.lastName || "Contact"
      } as UserProfile,
      dateMet: new Date().toISOString(),
      notes: "", 
      placeMetAuto: "", // 🛑 Location Hidden
      tags: id && !id.startsWith('ext-') ? ["ConnectMe"] : ["External"],
    } as any;

    setScannedContact(initialContact);
    navigateTo("identity-hub"); 
  };

  const handleUpdateContactNotes = async (contactId: string, notes: string) => {
    if (!user) return;
    try {
      setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, notes } : c)));
      await ContactService.updateContact(user.uid, { id: contactId, notes } as any);
    } catch (error) { console.error("Failed to sync notes:", error); }
  };

  const handleDeleteContact = (contactId: string) => {
    showConfirm(t('contacts.deleteConfirmTitle'), t('contacts.deleteConfirmMessage'), async () => {
      try {
        await ContactService.deleteContact(user!.uid, contactId);
        setContacts(prev => prev.filter(c => c.id !== contactId));
        showToast(t('contacts.deleteSuccess'), "success");
        navigateTo("contacts-list");
      } catch (e) { showToast(t('common.error'), "error"); }
    });
  };

  // --- EFFECT LISTENERS ---
  useEffect(() => {
    const backAction = () => {
      if (currentScreen === "identity-hub" || !user) return false; 
      navigateTo("identity-hub"); 
      return true; 
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [currentScreen, user]);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingTimePassed(true), 3000);
    if (user) ContactService.getContacts(user.uid).then(setContacts).catch(console.error);
    return () => clearTimeout(timer);
  }, [user]);

  // ✅ SILENT AUTO-SYNC + DEEP FETCH LOGIC (Location Removed)
  useEffect(() => {
    if (!user) return;

    const requestsRef = collection(db, "users", user.uid, "incoming_requests");
    
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const scannerProfileData = change.doc.data() as UserProfile;
          
          // 🛑 SUSPENDED: Current location fetching removed
          
          let finalScannerProfile = { ...scannerProfileData };

          // Deep Fetch logic to guarantee image and socials parity
          try {
            if (scannerProfileData.id) {
              const liveProfile = await ContactService.getProfileById(scannerProfileData.id);
              if (liveProfile && liveProfile.profileImage && !finalScannerProfile.profileImage) {
                finalScannerProfile.profileImage = liveProfile.profileImage;
              }
            }
          } catch (fetchErr) {
            console.log("Auto-sync deep fetch skipped or failed", fetchErr);
          }
          
          const newContact: Contact = {
            id: finalScannerProfile.id,
            profile: finalScannerProfile,
            dateMet: new Date().toISOString(),
            placeMetAuto: "", // 🛑 Location Hidden
            tags: ["Synced"],
          } as any;

          try {
            // 1. Permanently save to Firestore
            await ContactService.addContact(user.uid, newContact);
            
            // 2. Update local state immediately
            setContacts(prev => {
              if (prev.some(c => c.id === newContact.id)) return prev;
              return [...prev, newContact];
            });

            // 3. Notify the user
            setNotificationCount(prev => prev + 1);
            showToast(`${finalScannerProfile.firstName} was automatically added to your contacts!`, "success");

            // 4. Delete the temporary request document
            await deleteDoc(change.doc.ref);
          } catch (error) {
            console.error("Auto-sync failed:", error);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdatePassword = async (currentPass: string, newPass: string) => {
    if (!user) return;
    try {
      await reauthenticate(currentPass); 
      await changePassword(newPass); 
    } catch (error: any) {
      let cleanMessage = t('errors.auth.generic');
      if (error.code === 'auth/wrong-password') {
        cleanMessage = t('errors.auth.wrongPassword');
      }
      return Promise.reject(new Error(cleanMessage));
    }
  };

  const handleDeleteAccount = () => {
    if (!user) return;
    showConfirm(
      t('settings.deleteTitle', 'Delete Account'), 
      t('settings.deleteConfirm', 'This is permanent and will wipe all your data. Proceed?'), 
      async () => {
        try {
          await deleteDoc(doc(db, "users", user.uid));
          await deleteAccount(); 
          setAuthScreen("landing");
          showToast(t('settings.deleteSuccess', 'Account fully deleted'), "success");
        } catch (error: any) {
          await signOut(); 
          setAuthScreen("landing");
          showToast(t('settings.deletePartial', 'Data wiped. Email will clear on next login.'), "success");
        }
      }
    );
  };

  // ✅ Extracted profile completeness check so the whole component can use it
  const isProfileIncomplete = user && (!authUserProfile || authUserProfile.onboardingComplete === false);

  // --- 🛑 FULL SCREEN LOADING ---
  if (isAppLoading) {
    return (
      <View style={[styles.fullScreenLoading, { backgroundColor: theme.bg }]}>
        <Animated.View style={[styles.iconBox, { backgroundColor: theme.cardBg, transform: [{ scale: pulseAnim }] }]}>
          <QrCode size={70} color={theme.primary} strokeWidth={2.5} />
        </Animated.View>
        <Text style={styles.logoText}>
          <Text style={{ color: theme.textMain }}>{t('landing.title', 'Connect')}</Text>
          <Text style={{ color: theme.primary }}>{t('landing.titleSuffix', 'Me.')}</Text>
        </Text>
        <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  // --- RENDER ROUTING ---
  const renderScreen = () => {
    // If there is no user OR the profile is incomplete, render the auth/onboarding screens
    if (!user || isProfileIncomplete) {
      // If the profile is incomplete, force the 'onboarding' screen. Otherwise, use the selected authScreen (landing or signin)
      const activeAuthScreen = isProfileIncomplete ? "onboarding" : authScreen;

      switch (activeAuthScreen) {
        case "landing": return <Landing onGetStarted={() => setAuthScreen("onboarding")} onSignIn={() => setAuthScreen("signin")} />;
        case "signin": return <SignIn onSignIn={signIn} onForgotPassword={resetPassword} onBack={() => setAuthScreen("landing")} onSignUp={() => setAuthScreen("onboarding")} />;
        case "onboarding": return <Onboarding onComplete={handleOnboardingComplete} onSignOut={handleSignOut} onSignIn={() => setAuthScreen('signin')} />;
      }
    }

    const fullProfile = { ...authUserProfile, id: user?.uid } as UserProfile;

    switch (currentScreen) {
      case "identity-hub": 
        return (
          <IdentityHub 
            profile={fullProfile}
            onEditCard={(index: number) => { setActiveIndex(index); navigateTo("edit-profile"); }}
            onPreviewCard={(index: number) => { setActiveIndex(index); navigateTo("qr-display"); }}
            onAddCard={handleAddNewCard}
            onScanQR={() => navigateTo("qr-scanner")}
            onViewContacts={() => { setNotificationCount(0); navigateTo("contacts-list"); }}
            onOpenSettings={() => navigateTo("settings")}
            notificationCount={notificationCount}
            onDeleteCard={async (index: number) => {
              if (!authUserProfile || !authUserProfile.cards) return;
              try {
                const newCardsArray = authUserProfile.cards.filter((_, i) => i !== index);
                await updateProfile({ ...authUserProfile, cards: newCardsArray });
                showToast('Identity deleted successfully', "success");
                setActiveIndex(Math.max(0, newCardsArray.length - 1));
              } catch (error) { showToast('Error deleting card', "error"); }
            }}
          />
        );

      case "settings": 
        return (
          <Settings 
            user={fullProfile} 
            onBack={() => navigateTo("identity-hub")}  
            onUpdatePassword={handleUpdatePassword} 
            onUpdateProfile={(p) => updateProfile(p)}
            onLogout={handleSignOut} 
            onDeleteAccount={handleDeleteAccount} 
          />
        );

      // 🚀 CREATE PROFILE (DRAFT MODE)
      case "create-profile": {
        const blankCard = {
          id: `draft_${Date.now()}`,
          hasSeenTour: true,
          cardId: `card_${Date.now()}`,
          cardName: `IDENTITY ${(authUserProfile?.cards?.length || 1) + 1}`,
          firstName: '', lastName: '', email: '', emails: [], phone: '', company: '', title: '', links: [], bio: '', profileImage: ''
        } as unknown as UserProfile;
        
        return (
          <EditProfile 
            profile={blankCard} 
            onSave={async (updatedCardData) => {
              if (!authUserProfile) return;
              
              const primaryEmail = updatedCardData.email?.trim() || updatedCardData.emails?.[0]?.address?.trim();
              
              if (!updatedCardData.firstName?.trim() || !updatedCardData.lastName?.trim() || !primaryEmail) {
                showToast("First name, last name, and email are required to save a card.", "error");
                return;
              }

              try {
                const currentCards = authUserProfile.cards || [authUserProfile as UserProfile];
                const newCardsArray = [...currentCards, { ...blankCard, ...updatedCardData }];
                await updateProfile({ ...authUserProfile, cards: newCardsArray });
                showToast(t('profile.edit.success', 'New identity created!'), "success");
                setActiveIndex(newCardsArray.length - 1);
                navigateTo("identity-hub"); 
              } catch (error) { showToast(t('common.error'), "error"); }
            }} 
            onBack={() => navigateTo("identity-hub")} 
            canDelete={false} 
          />
        );
      }

      case "edit-profile": 
        return (
          <EditProfile 
            profile={fullProfile.cards ? fullProfile.cards[activeIndex] : fullProfile} 
            onSave={async (updatedCardData) => {
              if (!authUserProfile) return;

              const primaryEmail = updatedCardData.email?.trim() || updatedCardData.emails?.[0]?.address?.trim();

              if (!updatedCardData.firstName?.trim() || !updatedCardData.lastName?.trim() || !primaryEmail) {
                showToast("First name, last name, and email are required.", "error");
                return;
              }

              try {
                const currentCards: UserProfile[] = authUserProfile.cards || [authUserProfile as UserProfile];
                const newCardsArray = [...currentCards];
                newCardsArray[activeIndex] = { ...newCardsArray[activeIndex], ...updatedCardData };
                await updateProfile({ ...authUserProfile, cards: newCardsArray });
                showToast(t('profile.edit.success', 'Identity updated!'), "success");
                navigateTo("identity-hub"); 
              } catch (error) { showToast(t('common.error'), "error"); }
            }} 
            onBack={() => navigateTo("identity-hub")} 
            canDelete={!!fullProfile.cards && fullProfile.cards.length > 1}
            onDelete={async () => {
              if (!authUserProfile || !authUserProfile.cards) return;
              try {
                const newCardsArray = authUserProfile.cards.filter((_, index) => index !== activeIndex);
                await updateProfile({ ...authUserProfile, cards: newCardsArray });
                if (activeIndex >= newCardsArray.length) setActiveIndex(Math.max(0, newCardsArray.length - 1));
                showToast(t('profile.edit.deleteSuccess', 'Identity deleted successfully'), "success");
                navigateTo("identity-hub"); 
              } catch (error) { showToast(t('common.error'), "error"); }
            }}
          />
        );

      case "qr-display": 
        return <QRDisplay fullProfile={fullProfile} activeIndex={activeIndex} onSwitchCard={(index: number) => setActiveIndex(index)} />;

      case "qr-scanner": return <QRScanner onScan={handleScan} onBack={() => navigateTo("identity-hub")} />; 
      case "contacts-list": return <ContactsList contacts={contacts} onContactSelect={(c) => navigateTo("contact-detail", c.id)} onBack={() => navigateTo("identity-hub")} />; 
      
      case "contact-detail":
        const contact = contacts.find((c) => c.id === selectedContactId);
        return contact ? (
          <ContactDetail contact={contact} onBack={() => navigateTo("contacts-list")} onUpdateNotes={handleUpdateContactNotes} onDelete={handleDeleteContact} />
        ) : (
          <IdentityHub 
            profile={fullProfile} 
            onEditCard={(i: number) => { setActiveIndex(i); navigateTo("edit-profile"); }} 
            onPreviewCard={(i: number) => { setActiveIndex(i); navigateTo("qr-display"); }} 
            onAddCard={handleAddNewCard} 
            onScanQR={() => navigateTo("qr-scanner")} 
            onViewContacts={() => navigateTo("contacts-list")} 
            onOpenSettings={() => navigateTo("settings")} 
            notificationCount={notificationCount} 
            onDeleteCard={async (index: number) => {
              if (!authUserProfile || !authUserProfile.cards) return;
              try {
                const newCardsArray = authUserProfile.cards.filter((_, i) => i !== index);
                await updateProfile({ ...authUserProfile, cards: newCardsArray });
                showToast('Identity deleted successfully', "success");
              } catch (error) { showToast('Error deleting card', "error"); }
            }}
          />
        );

      default: 
        return (
          <IdentityHub 
            profile={fullProfile} 
            onEditCard={(i: number) => { setActiveIndex(i); navigateTo("edit-profile"); }} 
            onPreviewCard={(i: number) => { setActiveIndex(i); navigateTo("qr-display"); }} 
            onAddCard={handleAddNewCard} 
            onScanQR={() => navigateTo("qr-scanner")} 
            onViewContacts={() => navigateTo("contacts-list")} 
            onOpenSettings={() => navigateTo("settings")} 
            notificationCount={notificationCount} 
            onDeleteCard={async (index: number) => {
              if (!authUserProfile || !authUserProfile.cards) return;
              try {
                const newCardsArray = authUserProfile.cards.filter((_, i) => i !== index);
                await updateProfile({ ...authUserProfile, cards: newCardsArray });
                showToast('Identity deleted successfully', "success");
              } catch (error) { showToast('Error deleting card', "error"); }
            }}
          />
        );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      {renderScreen()}
      {/* ✅ NAVIGATION LOCK: The !isProfileIncomplete flag completely hides the bar during onboarding */}
      {!isProfileIncomplete && user && ['identity-hub', 'contacts-list', 'qr-scanner', 'settings', 'qr-display'].includes(currentScreen) && (
        <BottomNav 
          activeTab={
            currentScreen === 'identity-hub' ? 'cards' : 
            currentScreen === 'qr-scanner' ? 'scan' :
            currentScreen === 'qr-display' ? 'preview' :
            currentScreen === 'settings' ? 'settings' : 'connections'
          }
          onNavigate={(screen) => navigateTo(screen)}
          notificationCount={notificationCount}
        />
      )}
      {scannedContact && (
        <ContactCard 
          isVisible={!!scannedContact}
          contact={scannedContact}
          contacts={contacts}
          onCancel={() => setScannedContact(null)}
          onSave={async (updatedContact) => {
            if (!user) return;
            try {
              await ContactService.addContact(user.uid, updatedContact as Contact);
              setContacts(prev => {
                const combined = [...prev, updatedContact as Contact];
                return Array.from(new Map(combined.map(item => [item.id, item])).values());
              });
              setScannedContact(null);
              showToast(t('contacts.addSuccess'), "success");
              navigateTo("contacts-list");
            } catch (e) { showToast(t('common.error'), "error"); }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreenLoading: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  iconBox: { 
    padding: 32, 
    borderRadius: 32, 
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    marginBottom: 30 
  },
  logoText: { 
    fontSize: 48, 
    fontWeight: '900', 
    letterSpacing: -1,
    marginBottom: 10
  }
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UIProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </UIProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}