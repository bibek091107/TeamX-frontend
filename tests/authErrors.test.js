import test from "node:test";
import assert from "node:assert/strict";
import { getFirebaseAuthErrorCode, getFirebaseLoginErrorMessage } from "../src/services/authErrors.js";

test("explains Firebase invalid-credential responses without exposing request data", () => {
  assert.equal(
    getFirebaseLoginErrorMessage({
      code: "auth/invalid-credential",
      message: "Firebase: Error (auth/invalid-credential).",
    }),
    "Invalid email or password.",
  );
});

test("reports an incorrect Firebase password separately from backend failures", () => {
  assert.equal(
    getFirebaseLoginErrorMessage({ code: "auth/wrong-password" }),
    "Incorrect password.",
  );
});

test("reports when Firebase Email/Password sign-in is disabled", () => {
  assert.match(
    getFirebaseLoginErrorMessage({ code: "auth/operation-not-allowed" }),
    /Email\/password sign-in is not enabled/,
  );
});

test("surfaces backend configuration errors and network failures", () => {
  assert.equal(
    getFirebaseLoginErrorMessage({ response: { status: 503, data: { error: "Server auth unavailable" } } }),
    "Server auth unavailable",
  );
  assert.match(
    getFirebaseLoginErrorMessage({ code: "ERR_NETWORK", message: "Network Error" }),
    /network issue or a CORS configuration problem/,
  );
});

test("maps Firebase HTTP 400 sign-in codes to actionable safe messages", () => {
  assert.match(
    getFirebaseLoginErrorMessage({ message: '{"error":{"message":"OPERATION_NOT_ALLOWED"}}' }),
    /Email\/password sign-in is not enabled/,
  );
  assert.equal(
    getFirebaseLoginErrorMessage({ message: '{"error":{"message":"INVALID_LOGIN_CREDENTIALS"}}' }),
    "Invalid email or password.",
  );
});

test("distinguishes Firebase password errors from Flask token exchange errors", () => {
  for (const [code, message] of [
    ["INVALID_LOGIN_CREDENTIALS", "Invalid email or password."],
    ["EMAIL_NOT_FOUND", "No account found. Sign up first."],
    ["INVALID_PASSWORD", "Incorrect password."],
    ["OPERATION_NOT_ALLOWED", "Email/password sign-in is not enabled for this Firebase project."],
    ["API_KEY_INVALID", "Firebase configuration is invalid. Please contact the admin."],
  ]) {
    assert.equal(getFirebaseAuthErrorCode({ response: { data: { error: { message: code } } } }), code);
    assert.equal(getFirebaseLoginErrorMessage({ response: { data: { error: { message: code } } } }), message);
  }
  assert.equal(getFirebaseLoginErrorMessage({ response: { status: 503, data: { code: "firebase_not_configured", error: "Backend auth unavailable" } } }), "Backend auth unavailable");
  assert.equal(
    getFirebaseLoginErrorMessage({ response: { data: { error: { message: "TENANT_ID_MISMATCH" } } } }),
    "Firebase authentication failed (TENANT_ID_MISMATCH). Please contact the admin.",
  );
});
