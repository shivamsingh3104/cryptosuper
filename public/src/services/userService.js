import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const saveUser = async (user, method = "email") => {
  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    name: user.displayName || user.email.split("@")[0],
    photo: user.photoURL || null,
    loginMethod: method,
    createdAt: new Date()
  }, { merge: true });
};