/**
 * Firebase auth error codes ko user-friendly message me badalta hai.
 *
 * Pehle `err.message` seedha render hota tha, jiski wajah se screen par raw
 * "Firebase: Error (auth/invalid-credential)." dikhta tha. Ye koi help nahi
 * karta — user ko pata hi nahi chalta ki password galat hai ya account Google
 * se bana tha ya account exist hi nahi karta.
 *
 * `auth/invalid-credential` jaanbujh kar "email ya password galat" bolta hai
 * (user enumeration rokne ke liye Firebase ye karta hai) — isliye message me
 * dono possibilities de di gayi hain.
 */
export function authErrorMessage(err) {
  const code = err?.code || "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/email-already-in-use":
      return "Email ya password galat hai. Agar aapne Google se sign up kiya tha, to neeche 'Continue with Google' use karein.";

    case "auth/invalid-email":
      return "Email address sahi nahi hai.";

    case "auth/too-many-requests":
      return "Bahut zyada try ho chuke hain. Thodi der baad dobara koshish karein.";

    case "auth/network-request-failed":
      return "Network error. Internet check karke dobara koshish karein.";

    case "auth/user-disabled":
      return "Yeh account disable kar diya gaya hai. Admin se contact karein.";

    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in cancel kar diya gaya.";

    case "auth/popup-blocked":
      return "Popup block ho gaya. Popups allow karke dobara koshish karein.";

    case "auth/operation-not-allowed":
      return "Ye login method (Email/Password ya Google) Firebase console me enable nahi hai.";

    default:
      return err?.message?.replace(/^Firebase:\s*Error\s*\(auth\/[\w-]+\)\.\s*/, "")
        || "Login fail ho gaya. Dobara koshish karein.";
  }
}
