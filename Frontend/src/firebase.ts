// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const VITE_apiKey = import.meta.env.VITE_FIREBASE_apiKey;
const VITE_authDomain = import.meta.env.VITE_FIREBASE_authDomain;
const VITE_projectId = import.meta.env.VITE_FIREBASE_projectId;
// const VITE_storageBucket = import.meta.env.VITE_FIREBASE_VITE_FIREBASE_storageBucket;
const VITE_messagingSenderId = import.meta.env.VITE_FIREBASE_messagingSenderId;
const VITE_appId = import.meta.env.VITE_FIREBASE_appId;
const VITE_measurementId = import.meta.env.VITE_FIREBASE_measurementId;

const firebaseConfig = {
  apiKey: VITE_apiKey,
  authDomain: VITE_authDomain,
  projectId: VITE_projectId,
  storageBucket: "cv-on-blockchain.appspot.com",
  messagingSenderId: VITE_messagingSenderId,
  appId: VITE_appId,
  measurementId: VITE_measurementId,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
