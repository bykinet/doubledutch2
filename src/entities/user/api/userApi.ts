import { db } from "@/shared/config/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { UserProfile } from "../model/types";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error("Failed to get user profile:", err);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, "users", profile.uid), profile, { merge: true });
  } catch (err) {
    console.error("Failed to save user profile:", err);
  }
}

export async function updateUserNickname(uid: string, nickname: string): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), { nickname });
  } catch (err) {
    console.error("Failed to update nickname:", err);
    throw err;
  }
}
