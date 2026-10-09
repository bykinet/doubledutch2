import { db } from "@/shared/config/firebase";
import { collection, doc, setDoc, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { GameSessionRecord } from "../model/types";
import { GameDifficulty, GameSpeed } from "@/game/logic/types";

export async function saveGameSession(session: GameSessionRecord): Promise<string> {
  try {
    const colRef = collection(db, "sessions");
    const docRef = doc(colRef);
    const sessionData = {
      ...session,
      id: docRef.id,
    };
    await setDoc(docRef, sessionData);
    return docRef.id;
  } catch (err) {
    console.error("Failed to save game session:", err);
    return "";
  }
}

export async function fetchLeaderboard(
  duration: number,
  speed: GameSpeed,
  difficulty: GameDifficulty
): Promise<GameSessionRecord[]> {
  try {
    const colRef = collection(db, "sessions");
    const q = query(
      colRef,
      where("duration", "==", duration),
      where("speed", "==", speed),
      where("difficulty", "==", difficulty),
      where("completed", "==", true),
      orderBy("score", "desc"),
      limit(20)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as GameSessionRecord);
  } catch (err) {
    console.warn("Leaderboard fetch error (index may be building or offline):", err);
    return [];
  }
}
