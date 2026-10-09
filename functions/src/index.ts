import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Helper to generate 16-character managementId: starts with uppercase letter, followed by 15 uppercase letters/numbers
function generateManagementId(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const alphanum = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 15; i++) {
    id += alphanum.charAt(Math.floor(Math.random() * alphanum.length));
  }
  return id;
}

// 1. On user creation: Generate managementId and write to privateProfiles/{uid}
export const onUserCreated = functions.region("asia-northeast3").auth.user().onCreate(async (user) => {
  const managementId = generateManagementId();
  await db.collection("privateProfiles").doc(user.uid).set({
    managementId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

// 2. On session creation: Validate theoretical score cap, attach managementId
export const verifyAndFinalizeSession = functions.region("asia-northeast3").firestore
  .document("sessions/{sessionId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const sessionId = context.params.sessionId;

    if (!data) return;

    const duration = data.duration || 60;
    const speed = data.speed || 1;
    const difficulty = data.difficulty || 1;
    const maxJumpers = data.maxJumpers || 1;
    const submittedScore = data.score || 0;

    // Calculate theoretical maximum score
    const speedVelocities: Record<number, number> = { 1: 180, 2: 270, 3: 360, 4: 480, 5: 600 };
    const speedScores: Record<number, number> = { 1: 5, 2: 10, 3: 15, 4: 20, 5: 25 };
    const diffScores: Record<number, number> = { 1: 10, 2: 20, 3: 30 };

    const normalSpeed = speedVelocities[speed] || 180;
    const rushSpeed = normalSpeed * 1.15;
    const normalRounds = Math.floor((duration * 0.8 * normalSpeed) / 360);
    const rushRounds = Math.floor((duration * 0.2 * rushSpeed) / 360);
    const totalRounds = normalRounds + rushRounds;

    const sScore = speedScores[speed] || 5;
    const dScore = diffScores[difficulty] || 10;

    let theoreticalMax = 0;
    for (let r = 0; r < totalRounds; r++) {
      const comboMult = Math.min(2.0, 1.0 + Math.floor(r / 5) * 0.1);
      theoreticalMax += Math.floor(maxJumpers * sScore * dScore * comboMult);
    }
    theoreticalMax = Math.min(999999, Math.max(100, theoreticalMax));

    let finalScore = submittedScore;
    let capped = false;

    if (submittedScore > theoreticalMax) {
      finalScore = theoreticalMax;
      capped = true;
      // Log anomaly to auditLogs
      await db.collection("auditLogs").add({
        type: "SCORE_CAPPED_ANOMALY",
        sessionId,
        uid: data.uid,
        submittedScore,
        cappedScore: finalScore,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Attach managementId if user is registered
    let managementId: string | null = null;
    if (data.uid) {
      const privDoc = await db.collection("privateProfiles").doc(data.uid).get();
      if (privDoc.exists) {
        managementId = privDoc.data()?.managementId || null;
      }
    }

    const updates: Record<string, any> = {
      score: finalScore,
      completed: true,
    };
    if (capped) {
      updates.scoreCapped = true;
    }
    if (managementId) {
      updates.managementId = managementId;
    }

    await snap.ref.update(updates);
  });

// 3. Admin: Set or revoke admin custom claim
export const setAdminRole = functions.region("asia-northeast3").https.onCall(async (data, context) => {
  // Caller must be an admin
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Only administrators can grant admin roles.");
  }

  const { targetUid, isAdmin } = data;
  if (!targetUid) {
    throw new functions.https.HttpsError("invalid-argument", "Target UID must be provided.");
  }

  await admin.auth().setCustomUserClaims(targetUid, { admin: !!isAdmin });

  // Record in auditLogs
  await db.collection("auditLogs").add({
    type: isAdmin ? "GRANT_ADMIN" : "REVOKE_ADMIN",
    performedBy: context.auth.uid,
    targetUid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

// 4. Anonymize user account and delete profile
export const anonymizeUserAccount = functions.region("asia-northeast3").https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const uid = context.auth.uid;

  // Retrieve user's managementId
  const privDoc = await db.collection("privateProfiles").doc(uid).get();
  const managementId = privDoc.exists ? privDoc.data()?.managementId : null;

  // 1. Remove uid from user's sessions, keep managementId and score stats
  const sessionsSnap = await db.collection("sessions").where("uid", "==", uid).get();
  const batch = db.batch();
  sessionsSnap.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      uid: null,
      nickname: "Anonymized Player",
      ...(managementId ? { managementId } : {}),
    });
  });

  // 2. Delete user and privateProfile documents
  batch.delete(db.collection("users").doc(uid));
  batch.delete(db.collection("privateProfiles").doc(uid));

  await batch.commit();

  // 3. Delete Firebase Auth user
  await admin.auth().deleteUser(uid);

  return { success: true };
});
