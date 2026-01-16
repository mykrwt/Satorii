import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

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
    signup: (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    },
    logout: () => {
        return signOut(auth);
    },
    loginWithGoogle: () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    },
    getCurrentUser: () => {
        return auth.currentUser;
    }
};
