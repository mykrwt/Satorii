import { initializeApp } from "firebase/app";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendEmailVerification
} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBdleSJnxH3DLe-eajThI8ULIhM7X46sdE",
    authDomain: "satorii-6a53e.firebaseapp.com",
    projectId: "satorii-6a53e",
    storageBucket: "satorii-6a53e.firebasestorage.app",
    messagingSenderId: "140779202916",
    appId: "1:140779202916:web:a331a63126850bce1ff271",
    measurementId: "G-YZ1H24CFDW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const authService = {
    subscribe: (callback) => {
        return onAuthStateChanged(auth, callback);
    },
    login: (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    },
    signup: async (email, password) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential;
    },
    logout: () => {
        return signOut(auth);
    },
    getCurrentUser: () => {
        return auth.currentUser;
    }
};
