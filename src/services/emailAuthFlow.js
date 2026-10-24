/** Thin, testable wrappers around the shared Firebase Auth instance. */
export async function signUpWithEmail(auth, email, password, createUser, sendVerification) {
  const result = await createUser(auth, email, password);
  await sendVerification(result.user);
  return result.user;
}

export async function signInWithEmail(auth, email, password, signIn) {
  const result = await signIn(auth, email, password);
  return result.user;
}

export async function exchangeFirebaseUserForSession(user, firebaseLogin) {
  if (!user || typeof user.getIdToken !== "function") {
    throw new TypeError("Firebase authenticated user is required");
  }
  const idToken = await user.getIdToken();
  if (!idToken) throw new Error("Firebase did not return an ID token");
  return firebaseLogin(idToken);
}
