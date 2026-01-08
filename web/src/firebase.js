import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCbQxVW3g6a5SM08k7sN5rDjCm4j_w7hsc",
  authDomain: "zapcore-581b0.firebaseapp.com",
  projectId: "zapcore-581b0",
  storageBucket: "zapcore-581b0.firebasestorage.app",
  messagingSenderId: "311090831020",
  appId: "1:311090831020:web:86ae9d29bc8421d8968909",
  measurementId: "G-PE587EKV4P",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
