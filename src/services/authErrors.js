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
  "INVALID_LOGIN_CREDENTIALS": "Invalid email or password.",
  "EMAIL_NOT_FOUND": "No account found. Sign up first.",
  "INVALID_PASSWORD": "Incorrect password.",
  "OPERATION_NOT_ALLOWED": "Email/password sign-in is not enabled for this Firebase project.",
  "API_KEY_INVALID": "Firebase configuration is invalid. Please contact the admin.",
  "USER_DISABLED": "This account has been disabled. Contact the admin.",
  "TOO_MANY_ATTEMPTS_TRY_LATER": "Too many attempts. Try again later.",
};

export function getFirebaseAuthErrorCode(error) {
  const restError = error?.response?.data?.error;
  const candidates = [typeof restError === "object" ? restError?.message : restError,
    error?.response?.data?.message,
    error?.customData?._tokenResponse?.error?.message,
    error?.code,
    error?.message];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const known = candidate.match(/(INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND|INVALID_PASSWORD|OPERATION_NOT_ALLOWED|API_KEY_INVALID|USER_DISABLED|TOO_MANY_ATTEMPTS_TRY_LATER|auth\/[a-z0-9-]+)/i);
    if (known) return known[1].toUpperCase().startsWith("AUTH/") ? known[1].toLowerCase() : known[1].toUpperCase();
    if (/^[A-Z][A-Z0-9_]{2,}$/.test(candidate)) return candidate;
    if (/^auth\/[a-z0-9-]+$/i.test(candidate)) return candidate.toLowerCase();
  }
  return null;
}

export function getFirebaseLoginErrorMessage(error) {
  // Axios errors from Flask are kept separate from Firebase password errors.
  if (error.response?.data?.error && error.response.status >= 400) {
    return error.response.data.error;
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

  const code = getFirebaseAuthErrorCode(error);
  if (code && FIREBASE_AUTH_ERRORS[code]) return FIREBASE_AUTH_ERRORS[code];
  if (code) return `Firebase authentication failed (${code}). Please contact the admin.`;
  return "Authentication failed. Please try again.";
}
