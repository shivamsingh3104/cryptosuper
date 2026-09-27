import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage"; 

const firebaseConfig = {
  apiKey: "AIzaSyBOpvWLHJC2N5d0BKOm1WxSNSh07VneH7E",
  authDomain: "crypto-bc2f4.firebaseapp.com",
  projectId: "crypto-bc2f4",
  storageBucket: "crypto-bc2f4.appspot.com",
  messagingSenderId: "51164245086",
  appId: "1:51164245086:web:28db3358ce0fd0778818cf",
  measurementId: "G-Y92M9XR20Z"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app); 
export const storage = getStorage(app);