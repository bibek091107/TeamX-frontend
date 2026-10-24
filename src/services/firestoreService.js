// src/services/firestoreService.js
import { firestoreDb } from "./firebase";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

/**
 * Retrieves all team memberships for a user from Firestore by their verified Firebase UID or registered email.
 */
export async function fetchUserMembershipsFromFirestore(firebaseUid, email) {
  if (!firestoreDb) return [];
  const results = new Map();
  const normEmail = (email || "").trim().lower();

  try {
    if (firebaseUid) {
      const qUid = query(collection(firestoreDb, "team_members"), where("firebaseUid", "==", firebaseUid));
      const snapUid = await getDocs(qUid);
      snapUid.forEach(docSnap => {
        const data = docSnap.data();
        if (data.teamId) results.set(data.teamId, data);
      });
    }

    if (normEmail) {
      const qEmail = query(collection(firestoreDb, "team_members"), where("email", "==", normEmail));
      const snapEmail = await getDocs(qEmail);
      snapEmail.forEach(docSnap => {
        const data = docSnap.data();
        if (data.teamId && !results.has(data.teamId)) {
          results.set(data.teamId, data);
        }
      });
    }
  } catch (err) {
    console.warn("Firestore fetchUserMemberships error:", err.message);
  }

  return Array.from(results.values());
}

/**
 * Persists a team document directly to Firestore.
 */
export async function persistTeamToFirestore(team, user) {
  if (!firestoreDb || !team?.id) return;
  try {
    const teamRef = doc(firestoreDb, "teams", team.id);
    await setDoc(teamRef, {
      id: team.id,
      name: team.name,
      description: team.description || "",
      inviteCode: team.inviteCode,
      requireApproval: Boolean(team.requireApproval),
      createdBy: user?.id || team.createdBy,
      creatorEmail: (user?.email || "").trim().toLowerCase(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore persistTeam error:", err.message);
  }
}

/**
 * Persists a user-to-team membership to Firestore.
 */
export async function persistMembershipToFirestore(team, user, role = "member", status = "active") {
  if (!firestoreDb || !team?.id || !user?.id) return;
  try {
    const docId = `${team.id}_${user.id}`;
    const memberRef = doc(firestoreDb, "team_members", docId);
    await setDoc(memberRef, {
      id: docId,
      teamId: team.id,
      teamName: team.name,
      teamInviteCode: team.inviteCode,
      userId: user.id,
      firebaseUid: user.firebaseUid || user.id,
      email: (user.email || "").trim().toLowerCase(),
      displayName: user.displayName || user.email?.split("@")[0],
      role: role || "member",
      status: status || "active",
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore persistMembership error:", err.message);
  }
}
