import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCUyFDEBA1lZ9MFNaeIPxYDf5O4ddJfxQ",
  authDomain: "bizguard-app.firebaseapp.com",
  projectId: "bizguard-app",
  storageBucket: "bizguard-app.firebasestorage.app",
  messagingSenderId: "149197794964",
  appId: "1:149197794964:web:b4002035928b0ac4034e81",
  measurementId: "G-TWLRPDBVHB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

export default app;