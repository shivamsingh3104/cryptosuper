import admin from "firebase-admin";
import fs from "fs";

const serviceAccountPath = new URL("./serviceAccountKey.json", import.meta.url);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
export { admin }; 