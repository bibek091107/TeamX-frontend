import test from "node:test";
import assert from "node:assert/strict";
import { exchangeFirebaseUserForSession, signInWithEmail, signUpWithEmail } from "../src/services/emailAuthFlow.js";

test("signup still creates a Firebase email account and sends verification", async () => {
  const auth = { app: { options: { projectId: "teamcollab-9b857" } } };
  const user = { uid: "new-user" };
  const calls = [];
  const result = await signUpWithEmail(
    auth,
    "new@example.com",
    "correct-horse",
    async (...args) => { calls.push(["create", ...args]); return { user }; },
    async (verifiedUser) => calls.push(["verify", verifiedUser]),
  );
  assert.equal(result, user);
  assert.deepEqual(calls, [["create", auth, "new@example.com", "correct-horse"], ["verify", user]]);
});

test("existing user login uses the same Firebase auth instance and exchanges its ID token", async () => {
  const auth = { app: { options: { projectId: "teamcollab-9b857" } } };
  const user = { uid: "returning-user", emailVerified: true, getIdToken: async () => "signed-firebase-id-token" };
  let sentToken;
  const signedIn = await signInWithEmail(auth, "returning@example.com", "password", async (...args) => {
    assert.deepEqual(args, [auth, "returning@example.com", "password"]);
    return { user };
  });
  const session = await exchangeFirebaseUserForSession(signedIn, async (token) => {
    sentToken = token;
    return { data: { user: { id: "existing-profile" }, teams: [{ id: "existing-team" }] } };
  });
  assert.equal(sentToken, "signed-firebase-id-token");
  assert.equal(session.data.user.id, "existing-profile");
  assert.equal(session.data.teams[0].id, "existing-team");
});
