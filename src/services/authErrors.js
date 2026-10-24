const FIREBASE_AUTH_ERRORS = {
  "auth/user-not-found": "No account found. Sign up first.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/email-already-in-use": "Email already registered. Sign in.",
  "auth/invalid-email": "Invalid email address.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
  "auth/operation-not-allowed":
    "Email/password sign-in is not enabled for this project. Please contact the admin.",
  "auth/network-request-failed":
    "Network error. Check your internet connection and try again.",
  "auth/invalid-api-key": "Firebase configuration is invalid. Please contact the admin.",
  "auth/unauthorized-domain": "This website is not authorized for Firebase sign-in. Please contact the admin.",
  "auth/weak-password": "Choose a password with at least 6 characters.",
  "auth/account-exists-with-different-credential": "An account already exists with a different sign-in method.",
};

export function getFirebaseLoginErrorMessage(error) {
  const code = error.code || error.response?.data?.code;
  if (error.response?.data?.error && error.response.status >= 400) {
    return error.response.data.error;
  }

  // Firebase Identity Toolkit REST errors may appear as HTTP 400 with a
  // server-side message like EMAIL_NOT_FOUND or OPERATION_NOT_ALLOWED.
  const firebaseCode = String(error.message || "").match(/(?:error|message)[^A-Z]*(INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND|INVALID_PASSWORD|USER_DISABLED|OPERATION_NOT_ALLOWED|TOO_MANY_ATTEMPTS_TRY_LATER|API_KEY_INVALID)/i)?.[1];
  const restCode = firebaseCode?.toUpperCase();
  if (restCode) {
    const restMessages = {
      EMAIL_NOT_FOUND: "No account found. Sign up first.",
      INVALID_PASSWORD: "Incorrect password.",
      INVALID_LOGIN_CREDENTIALS: "Invalid email or password.",
      USER_DISABLED: "This account has been disabled. Contact the admin.",
      OPERATION_NOT_ALLOWED: "Email/password sign-in is not enabled for this Firebase project.",
      TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Try again later.",
      API_KEY_INVALID: "Firebase configuration is invalid. Please contact the admin.",
    };
    return restMessages[restCode] || "Firebase sign-in failed. Check the Firebase error code in the browser console.";
  }

  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return "Cannot reach the server. This may be a network issue or a CORS configuration problem. Please try again later.";
  }

  if (error.response?.status === 503) {
    return error.response.data?.error ||
      "Server authentication is not configured. Please contact the admin.";
  }

  if (error.response?.status === 401) {
    return error.response.data?.error ||
      "Authentication failed. Please sign in again.";
  }

  return FIREBASE_AUTH_ERRORS[code] || error.message ||
    "Authentication failed. Please try again.";
}
