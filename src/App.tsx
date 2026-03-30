import { useState, useEffect } from "react";
import "./i18n/config"; // Initialize i18n

import { LandingPage as Landing } from "./components/LandingPage";
import { SignInPage as SignIn } from "./components/SignInPage";
import { OnboardingFlow as Onboarding } from "./components/OnboardingFlow";
import { HomePage as Home } from "./components/HomePage";
import { QuickShare } from "./components/QuickShare";
import { QRDisplayPage as QRDisplay } from "./components/QRDisplayPage";
import { QRScannerPage as QRScanner } from "./components/QRScannerPage";
import { ContactCard } from "./components/ContactCard";
import { ContactsListPage as ContactsList } from "./components/ContactsListPage";
import { ContactDetailPage as ContactDetail } from "./components/ContactDetailPage";
import { ProfileEditPage as EditProfile } from "./components/ProfileEditPage";
import { Contact, UserProfile } from "./types";
import { useAuth } from "./contexts/AuthContext";

import { ContactService } from "./services/contactService";

// ... existing imports ...

export default function App() {
  const { user, userProfile: authUserProfile, signIn, signUp, signOut, updateProfile, loading } = useAuth();

  // Local state for UI navigation
  const [authScreen, setAuthScreen] = useState<"landing" | "signin" | "onboarding">("landing");
  const [currentScreen, setCurrentScreen] = useState<
    | "quick-share"
    | "home"
    | "qr-display"
    | "qr-scanner"
    | "contact-card"
    | "contacts-list"
    | "contact-detail"
    | "edit-profile"
  >("quick-share");

  const [scannedContact, setScannedContact] = useState<Contact | null>(null);
  const [scannedLocation, setScannedLocation] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Load contacts from Firestore
  useEffect(() => {
    if (user) {
      const loadContacts = async () => {
        setContactsLoading(true);
        try {
          const loadedContacts = await ContactService.getContacts(user.uid);
          setContacts(loadedContacts);
        } catch (error) {
          console.error("Failed to load contacts", error);
        } finally {
          setContactsLoading(false);
        }
      };
      loadContacts();
    } else {
      setContacts([]);
    }
  }, [user]);

  const [hasExistingAccount] = useState(() => {
    return localStorage.getItem("hasCreatedAccount") === "true";
  });

  // Handle language from profile
  useEffect(() => {
    if (authUserProfile?.language) {
      i18n.changeLanguage(authUserProfile.language);
    }
  }, [authUserProfile]);

  // ... Handlers ...

  const handleSignIn = async (email: string, password: string, rememberMe: boolean) => {
    try {
      await signIn(email, password);
    } catch (error) {
      console.error("Sign in failed", error);
      alert("Sign in failed: " + (error as any).message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setAuthScreen("landing");
  };

  const handleOnboardingComplete = async (profile: UserProfile, password?: string) => {
    try {
      if (!user && password) {
        // Sign up new user
        await signUp(profile.email, password);
      }
      await updateProfile(profile);
      localStorage.setItem("hasCreatedAccount", "true");
    } catch (error) {
      console.error("Failed to save profile", error);
      alert("Failed to create account: " + (error as any).message);
    }
  };

  const handleUpdateProfile = async (profile: UserProfile) => {
    try {
      await updateProfile(profile);
      setCurrentScreen("quick-share");
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  const handleScan = (contactData: Partial<Contact>) => {
    // QR data might be flat (legacy) or nested. Cast to any to safely access potential flat props.
    const rawData = contactData as any;

    const newContact: Contact = {
      id: contactData.id || Date.now().toString(),
      profile: contactData.profile || {
        id: rawData.id || 'unknown',
        firstName: rawData.firstName || 'Unknown',
        lastName: rawData.lastName || '',
        title: rawData.title || '',
        company: rawData.company || '',
        email: rawData.email || '',
        phone: rawData.phone || '',
        linkedinUrl: rawData.linkedinUrl || '',
        profileImage: rawData.profileImage || null,
      },
      notes: contactData.notes || "",
      placeMet: contactData.placeMet || "",
      placeMetAuto: contactData.placeMetAuto || (rawData.location?.latitude ? `${rawData.location.latitude}, ${rawData.location.longitude}` : ""),
      dateMet: contactData.dateMet || new Date().toISOString(),
      tags: contactData.tags || [],
      location: contactData.location,
    };

    setScannedContact(newContact);
    setScannedLocation(newContact.placeMetAuto);
    setCurrentScreen("contact-card");
  };

  const handleSaveContact = async (partialContact: Partial<Contact>) => {
    if (scannedContact && user) {
      try {
        const finalContact = { ...scannedContact, ...partialContact } as Contact;
        // Optimistic update
        setContacts([finalContact, ...contacts]);
        setScannedContact(null);
        setCurrentScreen("contacts-list");

        // Save to Firestore
        await ContactService.addContact(user.uid, finalContact);
        // Reload to get server timestamp/ID if needed, or trust optimistic
        // Ideally we update the ID from the result call, but for now this is fine.
        const updatedContacts = await ContactService.getContacts(user.uid);
        setContacts(updatedContacts);
      } catch (error) {
        console.error("Failed to save contact", error);
        alert("Failed to save contact. Please try again.");
      }
    }
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContactId(contact.id);
    setCurrentScreen("contact-detail");
  };

  const handleUpdateNotes = async (contactId: string, notes: string) => {
    if (!user) return;
    try {
      // Optimistic update
      setContacts(contacts.map((c) => c.id === contactId ? { ...c, notes } : c));

      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        await ContactService.updateContact(user.uid, { ...contact, notes });
      }
    } catch (error) {
      console.error("Failed to update notes", error);
    }
  };


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const renderScreen = () => {
    if (!user) {
      switch (authScreen) {
        case "landing":
          return <Landing onGetStarted={() => setAuthScreen("onboarding")} onSignIn={() => setAuthScreen("signin")} />;
        case "signin":
          return <SignIn onSignIn={handleSignIn} onBack={() => setAuthScreen("landing")} onSignUp={() => setAuthScreen("onboarding")} />;
        case "onboarding":
          return <Onboarding onComplete={handleOnboardingComplete} onSignOut={handleSignOut} />;
      }
    }

    // If user is logged in but has no profile, show onboarding?
    // Actually AuthContext loads profile. If new user, profile might be null.
    // We should treat null profile as "needs onboarding" if not already covered.
    // For now, assume if user exists, we show app, unless we want to enforce profile creation.
    // The OnboardingFlow handles profile creation.
    // If authUserProfile is null, maybe redirect to Onboarding?
    if (!authUserProfile) {
      // Ideally we should show onboarding if profile is missing
      return <Onboarding onComplete={handleOnboardingComplete} onSignOut={handleSignOut} />;
    }

    switch (currentScreen) {
      case "quick-share":
        return <QuickShare profile={authUserProfile} onScanQR={() => setCurrentScreen("qr-scanner")} onViewContacts={() => setCurrentScreen("contacts-list")} onEditProfile={() => setCurrentScreen("edit-profile")} onSignOut={handleSignOut} />;
      case "home":
        return <Home profile={authUserProfile} contacts={contacts} onNavigate={(page) => {
          if (page === 'profile') setCurrentScreen('edit-profile');
          else if (page === 'contacts') setCurrentScreen('contacts-list');
          else if (page === 'qr-display') setCurrentScreen('qr-display');
          else if (page === 'qr-scanner') setCurrentScreen('qr-scanner');
          else if (page === 'home') setCurrentScreen('home');
        }} />;
      case "qr-display":
        return <QRDisplay profile={authUserProfile} onBack={() => setCurrentScreen("quick-share")} />;
      case "qr-scanner":
        return <QRScanner onScan={handleScan} onBack={() => setCurrentScreen("quick-share")} />;
      case "contact-card":
        // Fix props: onCancel instead of onBack, remove autoLocation/profile, pass contact
        return scannedContact ? <ContactCard contact={scannedContact} onSave={handleSaveContact} onCancel={() => setCurrentScreen("quick-share")} /> : null;
      case "contacts-list":
        return <ContactsList contacts={contacts} onContactSelect={handleViewContact} onBack={() => setCurrentScreen("quick-share")} />; // Fixed prop name
      case "contact-detail":
        const contact = contacts.find((c) => c.id === selectedContactId);
        return contact ? <ContactDetail contact={contact} onBack={() => setCurrentScreen("contacts-list")} onUpdateNotes={handleUpdateNotes} /> : null;
      case "edit-profile":
        return <EditProfile profile={authUserProfile} onSave={handleUpdateProfile} onBack={() => setCurrentScreen("quick-share")} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-blue-50 via-blue-100 to-amber-50 rounded-3xl shadow-xl overflow-y-auto" style={{ minHeight: "812px", maxHeight: "90vh" }}>
        {renderScreen()}
      </div>
    </div>
  );
}