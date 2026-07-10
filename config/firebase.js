import admin from "firebase-admin";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getFirebaseCredentials() {
  // Priority 1: Environment variables (production — Render, etc.)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      type: "service_account",
      project_id: projectId,
      private_key: privateKey.replace(/\\n/g, "\n"),
      client_email: clientEmail,
    };
  }

  // Priority 2: Local service account file (development)
  const filePath = join(__dirname, "serviceAccountKey.json");
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  throw new Error(
    "Firebase credentials not found. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, " +
    "and FIREBASE_PRIVATE_KEY env vars, or place serviceAccountKey.json in config/."
  );
}

if (!admin.apps.length) {
  const credentials = getFirebaseCredentials();
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

export const db = admin.firestore();
export { admin }; 