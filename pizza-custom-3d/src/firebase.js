import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKpNMl1u_Xwo3F_DTb2UVDLLQ82uXh3Aw",
  authDomain: "configurador-marcoalpoim.firebaseapp.com",
  projectId: "configurador-marcoalpoim",
  storageBucket: "configurador-marcoalpoim.firebasestorage.app",
  messagingSenderId: "1081031597895",
  appId: "1:1081031597895:web:bb5cf3cdf9658251acf662",
  measurementId: "G-H46T9ML7LF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Erro ao autenticar:", error);
    return null;
  }
};

export const logout = () => signOut(auth);

export { auth };