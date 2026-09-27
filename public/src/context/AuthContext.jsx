import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { API } from "../config/api";

const AuthContext = createContext(null);

// 🔽 Backend sync function
async function syncUserToBackend(firebaseUser, loginMethod) {
  try {
    await fetch(`${API}/api/users/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
        photo: firebaseUser.photoURL || null,
        loginMethod: loginMethod || "email"
      })
    });
  } catch (e) {
    console.warn("Backend sync failed:", e.message);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const providerIds =
        firebaseUser.providerData?.map((p) => p.providerId) || [];

      const loginMethod = providerIds.includes("google.com")
        ? "google"
        : "email";

      await syncUserToBackend(firebaseUser, loginMethod);

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name:
          firebaseUser.displayName ||
          firebaseUser.email?.split("@")[0],
        photo: firebaseUser.photoURL || null,
        loginMethod
      });

    } else {
      setUser(null);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);

  // 🔽 FIXED LOGIN FUNCTION
  const login = async (email) => {
    const fakeUser = {
      uid: email,
      email: email,
      displayName: email.split("@")[0],
      photoURL: null
    };

    await syncUserToBackend(fakeUser, "email");

    setUser({
      uid: fakeUser.uid,
      email: fakeUser.email,
      name: fakeUser.displayName,
      photo: fakeUser.photoURL,
      loginMethod: "email"
    });

    return fakeUser;
  };

  // 🔽 Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // 🔽 Get profile
  const getProfile = async () => {
    if (!user?.uid) return null;
    try {
      const res = await fetch(`${API}/api/users/me?uid=${user.uid}`);
      return res.ok ? res.json() : null;
    } catch {
      return null;
    }
  };

  // 🔽 Update profile
  const updateProfile = async (data) => {
    if (!user?.uid) return null;
    try {
      const res = await fetch(`${API}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          uid: user.uid,
          ...data
        })
      });

      return res.ok ? res.json() : null;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login, 
        logout,
        getProfile,
        updateProfile,
        isLoggedIn: !!user,
        loading
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 🔽 Hook
export const useAuth = () => useContext(AuthContext);