import { db } from "@/shared/config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { CharacterItem } from "../types";

const COLLECTION_NAME = "users";

/**
 * Saves user's custom characters (max 4 jumpers, max 2 turners) to Firestore
 */
export async function saveUserCharactersToFirestore(
  uid: string,
  customCharacters: CharacterItem[]
): Promise<void> {
  if (!uid) return;
  try {
    const userDocRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(
      userDocRef,
      {
        customCharacters,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to save custom characters to Firestore:", error);
  }
}

/**
 * Loads user's custom characters from Firestore
 */
export async function loadUserCharactersFromFirestore(
  uid: string
): Promise<CharacterItem[]> {
  if (!uid) return [];
  try {
    const userDocRef = doc(db, COLLECTION_NAME, uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.customCharacters)) {
        return data.customCharacters as CharacterItem[];
      }
    }
    return [];
  } catch (error) {
    console.error("Failed to load custom characters from Firestore:", error);
    return [];
  }
}
