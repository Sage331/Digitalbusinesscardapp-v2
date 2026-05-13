import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    getDocs,
    getDoc,
    onSnapshot,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Contact, UserProfile } from "../types";
import i18n from 'i18next'; // ✅ Added direct i18n import

export const ContactService = {

    addContact: async (myUid: string, contact: Contact): Promise<void> => {
        try {
            const contactId = contact.profile.id || contact.id;
            
            if (!contactId) {
                // ✅ SYNC: Translated backend error
                throw new Error(i18n.t('errors.contact.invalidId', "A valid Profile ID is required to save a contact."));
            }

            // Path: users (1) / {myUid} (2) / contacts (3) / {contactId} (4)
            const contactRef = doc(db, "users", myUid, "contacts", contactId);
            
            // ✅ FIX: Sanitize the profile fields to prevent 'undefined' crashes
            const contactData = {
                ...contact,
                profile: {
                    ...contact.profile,
                    title: contact.profile.title ?? "",
                    company: contact.profile.company ?? "",
                    email: contact.profile.email ?? "",
                    phone: contact.profile.phone ?? "",
                    bio: contact.profile.bio ?? "",
                },
                // lastMet ensures we can order the list by most recent interaction
                lastMet: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            
            // Remove the redundant ID from the document body
            delete (contactData as any).id; 

            // merge: true preserves existing fields (like private notes) during a rescan
            await setDoc(contactRef, contactData, { merge: true });
        } catch (error) {
            console.error("Error adding contact:", error);
            throw error;
        }
    },

    /**
     * 2. Get all contacts for a user
     * ORDERING: Uses 'lastMet' to ensure newest connections appear at the top.
     */
    getContacts: async (userId: string): Promise<Contact[]> => {
        try {
            const userContactsRef = collection(db, "users", userId, "contacts");
            // Sorting by lastMet (descending) puts the newest scans first
            const q = query(userContactsRef, orderBy("lastMet", "desc"));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                ...(doc.data() as Omit<Contact, 'id'>),
                id: doc.id 
            })) as Contact[];
        } catch (error) {
            console.error("Error getting contacts:", error);
            throw error;
        }
    },

    // 3. Update specific fields (like private notes)
    updateContact: async (userId: string, contact: Partial<Contact> & { id: string }): Promise<void> => {
        try {
            const contactRef = doc(db, "users", userId, "contacts", contact.id);
            const { id, ...updateData } = contact;
            
            await updateDoc(contactRef, {
                ...updateData,
                updatedAt: serverTimestamp()
            } as any);
        } catch (error) {
            console.error("Error updating contact:", error);
            throw error;
        }
    },

    updateProfileStatus: async (uid: string, isViewing: boolean) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        isViewingQR: isViewing,
        lastActive: serverTimestamp(), // Optional: helps for "Offline" cleanup later
      });
      console.log(`Presence Sync: ${isViewing ? 'LIVE' : 'AWAY'}`);
    } catch (error) {
      console.error("Error updating presence status:", error);
      // We don't "throw" here so the app doesn't crash if network blips
    }
  },

    // 4. Delete a contact manually from the list
    deleteContact: async (userId: string, contactId: string): Promise<void> => {
        try {
            const contactRef = doc(db, "users", userId, "contacts", contactId);
            await deleteDoc(contactRef);
        } catch (error) {
            console.error("Error deleting contact:", error);
            throw error;
        }
    },

    // 5. Fetch a specific user's live profile
    getProfileById: async (uid: string): Promise<UserProfile | null> => {
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { ...docSnap.data(), id: docSnap.id } as UserProfile;
            }
            return null;
        } catch (error) {
            console.error("Error fetching live profile:", error);
            throw error;
        }
    },

    // 6. Send a Connection Request (Handshake)
    async sendConnectionRequest(myId: string, myProfile: UserProfile, targetId: string) {
        try {
            const requestRef = doc(db, "users", targetId, "incoming_requests", myId);
            await setDoc(requestRef, { 
                ...myProfile, 
                id: myId, 
                timestamp: serverTimestamp() 
            });
        } catch (error) {
            console.error("Error sending connection request:", error);
            throw error;
        }
    },

    // 7. Listen for Pings (Real-time Handshake)
    listenForIncomingRequests(myId: string, callback: (profile: UserProfile) => void) {
        const requestsRef = collection(db, "users", myId, "incoming_requests");
        
        return onSnapshot(requestsRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data() as UserProfile;
                    callback(data);
                    
                    // Auto-delete ping so the popup doesn't re-trigger on refresh
                    deleteDoc(change.doc.ref);
                }
            });
        });
    }
};