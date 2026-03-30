import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBM_2TbgPbGJKqZYvOsYe1LleQuTqFHq8A",
    authDomain: "digitalbusinesscard-ab6c8.firebaseapp.com",
    projectId: "digitalbusinesscard-ab6c8",
    storageBucket: "digitalbusinesscard-ab6c8.firebasestorage.app",
    messagingSenderId: "75857211562",
    appId: "1:75857211562:web:0429362ea3350a3b6a60d3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
