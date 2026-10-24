import test from "node:test";
import assert from "node:assert/strict";
import { getFirebaseLoginErrorMessage } from "../src/services/authErrors.js";

test("explains Firebase invalid-credential responses without exposing request data", () => {
  assert.equal(
    getFirebaseLoginErrorMessage({
      code: "auth/invalid-credential",
      message: "Firebase: Error (auth/invalid-credential).",
    }),
    "Invalid email or password.",
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
