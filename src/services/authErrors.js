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
};

export function getFirebaseLoginErrorMessage(error) {
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

  return FIREBASE_AUTH_ERRORS[error.code] || error.message ||
    "Authentication failed. Please try again.";
}
