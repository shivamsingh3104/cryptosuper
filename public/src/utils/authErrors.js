/**
 * Maps Firebase auth error codes to user-friendly messages.
 *
 * Previously `err.message` was rendered directly, which put a raw
 * "Firebase: Error (auth/invalid-credential)." on screen. That is not
 * helpful — users cannot tell whether the password is wrong, or the account
 * was created with Google, or the account does not exist at all.
 *
 * `auth/invalid-credential` intentionally reports "email or password is
 * incorrect" (Firebase does this to prevent user enumeration), so both
 * possibilities are covered in the message.
 */
export function authErrorMessage(err) {
  const code = err?.code || "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/email-already-in-use":
      return "Incorrect email or password. If you signed up with Google, use 'Continue with Google' below.";

    case "auth/invalid-email":
      return "The email address is not valid.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again after a short wait.";

    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";

    case "auth/user-disabled":
      return "This account has been disabled. Please contact the administrator.";

    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";

    case "auth/popup-blocked":
      return "The popup was blocked. Allow popups and try again.";

    case "auth/operation-not-allowed":
      return "This login method (Email/Password or Google) is not enabled in the Firebase console.";

    default:
      return err?.message?.replace(/^Firebase:\s*Error\s*\(auth\/[\w-]+\)\.\s*/, "")
        || "Login failed. Please try again.";
  }
}
