import test from "node:test";
import assert from "node:assert/strict";
import { getApiBaseUrl } from "../src/services/apiConfig.js";

test("uses the configured production API origin and adds the API prefix", () => {
  assert.equal(
    getApiBaseUrl("https://teamx-backend.onrender.com", false),
    "https://teamx-backend.onrender.com/api",
  );
});

test("accepts a configured API prefix without duplicating it", () => {
  assert.equal(
    getApiBaseUrl("https://api.example.com/api/", false),
    "https://api.example.com/api",
  );
});

test("uses localhost only as the development fallback", () => {
  assert.equal(getApiBaseUrl(undefined, true), "http://localhost:5000/api");
  assert.equal(
    getApiBaseUrl(undefined, false),
    "https://teamx-backend.onrender.com/api",
  );
});
