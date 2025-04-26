// src/utils/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
 apiKey: "AIzaSyB6Tw1iQnU5Wy-75wktGgTElp5qLKPOReA",
  authDomain: "farmersmarket-c89ba.firebaseapp.com",
  projectId: "farmersmarket-c89ba",
  storageBucket: "farmersmarket-c89ba.firebasestorage.app",
  messagingSenderId: "372753875377",
  appId: "1:372753875377:web:acbcdfb0f13d0776623d90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
