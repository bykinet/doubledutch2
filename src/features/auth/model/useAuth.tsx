import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import { auth } from "@/shared/config/firebase";
import { getUserProfile, saveUserProfile } from "@/entities/user/api/userApi";
import { UserProfile } from "@/entities/user/model/types";
import { syncCharactersWithFirestore } from "@/entities/character/characterRoster";

export type FirebaseUser = any;

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string) => Promise<void>;
  loginPhone: (phoneE164: string, pass: string) => Promise<void>;
  registerPhone: (phoneE164: string, pass: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginGuest: () => Promise<void>;
  logout: () => Promise<void>;
  setNickname: (nickname: string) => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(async () => {
      if (auth.currentUser) {
        console.log("30 minutes inactivity timeout reached. Logging out...");
        await signOut(auth);
      }
    }, IDLE_TIMEOUT_MS);
  }, []);

  // Listen to user interactions to reset idle timer
  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("click", handleActivity);

    resetIdleTimer();

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("click", handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  const loadUserProfile = async (currentUser: FirebaseUser) => {
    let p = await getUserProfile(currentUser.uid);
    if (!p) {
      // Determine provider
      let provider: UserProfile["provider"] = "password";
      if (currentUser.isAnonymous) {
        provider = "anonymous";
      } else if (currentUser.providerData.some((pd) => pd.providerId === "google.com")) {
        provider = "google.com";
      } else if (currentUser.email?.endsWith("@phone.doubledutch.invalid")) {
        provider = "phone-virtual";
      }

      p = {
        uid: currentUser.uid,
        nickname: "",
        provider,
        email: currentUser.email?.endsWith("@phone.doubledutch.invalid") ? null : currentUser.email || null,
        phoneE164: currentUser.email?.endsWith("@phone.doubledutch.invalid")
          ? currentUser.email.replace("@phone.doubledutch.invalid", "")
          : null,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };
      await saveUserProfile(p);
    }
    setProfile(p);

    // Check custom claims
    try {
      const tokenResult = await currentUser.getIdTokenResult();
      setIsAdmin(!!tokenResult.claims.admin);
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser);
        syncCharactersWithFirestore(currentUser.uid).catch((e) => console.error(e));
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerEmail = async (email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await loadUserProfile(cred.user);
  };

  const toVirtualEmail = (phoneE164: string) => `${phoneE164}@phone.doubledutch.invalid`;

  const loginPhone = async (phoneE164: string, pass: string) => {
    const virtualEmail = toVirtualEmail(phoneE164);
    await signInWithEmailAndPassword(auth, virtualEmail, pass);
  };

  const registerPhone = async (phoneE164: string, pass: string) => {
    const virtualEmail = toVirtualEmail(phoneE164);
    const cred = await createUserWithEmailAndPassword(auth, virtualEmail, pass);
    await loadUserProfile(cred.user);
  };

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await loadUserProfile(cred.user);
  };

  const loginGuest = async () => {
    const cred = await signInAnonymously(auth);
    await loadUserProfile(cred.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const setNickname = async (nickname: string) => {
    if (!user || !profile) return;
    const updated = { ...profile, nickname };
    await saveUserProfile(updated);
    setProfile(updated);
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!user || !user.email) throw new Error("No user email");
    const cred = EmailAuthProvider.credential(user.email, currentPass);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPass);
  };

  const deleteAccount = async () => {
    if (!user) return;
    // Delete profile doc
    try {
      // In a real cloud backend, functions anonymize sessions
      await deleteUser(user);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        loginEmail,
        registerEmail,
        loginPhone,
        registerPhone,
        loginGoogle,
        loginGuest,
        logout,
        setNickname,
        changePassword,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
