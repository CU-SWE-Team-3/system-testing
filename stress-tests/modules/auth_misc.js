// =============================================================================
// modules/auth_misc.js — Module 12: Miscellaneous Auth Flows
// =============================================================================
// Covers the four auth endpoints NOT tested by modules/auth.js:
//
//   POST  /auth/google/mobile       — Mobile Google ID-token login
//   POST  /auth/forgot-password     — Password reset request
//   POST  /auth/resend-verification — Re-send email verification link
//   PATCH /auth/reset-password      — Consume reset token + set new password
//
// WHY THIS MODULE EXISTS:
//   Before this module was added, these endpoints were being called by an
//   external tool (Postman / another script) using placeholder values:
//
//   • /auth/google/mobile with idToken: "invalid-google-id-token-for-k6-stress"
//     → Backend's verifyIdToken() threw an unhandled error → 500 log noise.
//
//   • /auth/forgot-password with non-existent emails
//     → Backend logged "[forgotPassword] silent error: No user found" on
//       every call, even though the HTTP response was the correct 200.
//
//   YAML REFERENCE (v1.12):
//   • /auth/google/mobile  → 200 on valid token, 400 on invalid/missing token.
//     A 500 here means the backend is not catching Firebase's token-parse
//     error — it should return 400 per spec. K6 checks for [200, 400] so
//     a 500 will correctly show as a K6 check failure until the backend is
//     fixed to catch that specific error.
//
//   • /auth/forgot-password → ALWAYS 200 (user enumeration protection).
//     The "silent error" log is internal backend behaviour — the HTTP
//     response is correct. Using TEST_EMAIL (which exists) avoids the
//     "No user found" log entry entirely.
//
//   • /auth/resend-verification → ALWAYS 200 (same enumeration protection).
//
//   • /auth/reset-password with a bogus token → 400 (token invalid/expired).
//     We never use a real token in K6 — the check verifies the error path
//     works correctly without crashing the server.
// =============================================================================

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate } from "k6/metrics";
import { parseJson } from "../helpers.js";
import { TEST_EMAIL } from "../config.js";

const googleAuthAttemptRate = new Rate("biobeats_google_auth_attempt_rate");

// ─── Placeholder Google ID Token ──────────────────────────────────────────────
// We cannot obtain a real Google ID token inside K6 — the Google Sign-In SDK
// requires a browser / native UI interaction.
//
// Per YAML: sending an invalid token should return 400 ("idToken missing or invalid").
// If the backend returns 500 instead, the K6 check will FAIL — this is correct
// behaviour because 500 means the backend is not handling the Firebase parse
// error gracefully (it should catch it and return 400).
//
// DO NOT add 500 to the accepted statuses below. The 500 is a real backend bug
// that should be fixed (add a try/catch around verifyIdToken and return 400).
const FAKE_GOOGLE_ID_TOKEN = "invalid-google-id-token-for-k6-stress";

// ─── Bogus Reset Token ────────────────────────────────────────────────────────
// A deliberately invalid reset token. Per YAML, the server must return 400
// ("Invalid or expired password reset token.") — NOT 500.
// This verifies the error path is handled gracefully under load.
const BOGUS_RESET_TOKEN = "00000000000000000000000000000000";

export function authMiscModule(data) {
  group("12 Auth Misc", function () {

    // ── 12a. POST Google Mobile Auth ────────────────────────────────────────────
    // Sends a fake Google ID token.
    // YAML valid responses: 200 (real token) or 400 (invalid token).
    // Expected result with fake token: 400.
    // If result is 500 → backend is crashing instead of returning 400. K6 will
    // flag this as a check failure, which is correct.
    const googleRes = http.post(
      `${data.baseUrl}/auth/google/mobile`,
      JSON.stringify({ idToken: FAKE_GOOGLE_ID_TOKEN }),
      { headers: { "Content-Type": "application/json" } }
    );
    const googleOk = check(googleRes, {
      "Auth Misc | Google Mobile: status 200 or 400": (r) =>
        [200, 400].includes(r.status),
      "Auth Misc | Google Mobile: not a 500":         (r) => r.status !== 500,
      "Auth Misc | Google Mobile: response < 600ms":  (r) => r.timings.duration < 600,
    });
    googleAuthAttemptRate.add(googleOk);
    sleep(1);

    // ── 12b. POST Forgot Password ───────────────────────────────────────────────
    // Uses TEST_EMAIL — a real account that exists in the database.
    //
    // YAML: "Always returns 200 to prevent user enumeration."
    // Using TEST_EMAIL avoids the "[forgotPassword] silent error: No user found"
    // log entry that appeared when the previous external script sent random
    // or non-existent emails. The HTTP response is always 200 either way,
    // but using a known email keeps the backend logs clean.
    //
    // NOTE: This will send a real reset email each iteration. If email delivery
    // cost or rate limits are a concern, set SKIP_EMAIL=true in your .env and
    // ensure the backend respects it in test mode.
    const forgotRes = http.post(
      `${data.baseUrl}/auth/forgot-password`,
      JSON.stringify({ email: TEST_EMAIL }),
      { headers: { "Content-Type": "application/json" } }
    );
    check(forgotRes, {
      "Auth Misc | Forgot Password: status 200":      (r) => r.status === 200,
      "Auth Misc | Forgot Password: success true":    (r) =>
        parseJson(r)?.success === true,
      "Auth Misc | Forgot Password: response < 800ms":(r) => r.timings.duration < 800,
    });
    sleep(1);

    // ── 12c. POST Resend Verification ───────────────────────────────────────────
    // Sends to TEST_EMAIL. Like forgot-password, always returns 200 per YAML.
    // Stresses the email queueing path and token generation under concurrent load.
    const resendRes = http.post(
      `${data.baseUrl}/auth/resend-verification`,
      JSON.stringify({ email: TEST_EMAIL }),
      { headers: { "Content-Type": "application/json" } }
    );
    check(resendRes, {
      "Auth Misc | Resend Verification: status 200":      (r) => r.status === 200,
      "Auth Misc | Resend Verification: success true":    (r) =>
        parseJson(r)?.success === true,
      "Auth Misc | Resend Verification: response < 800ms":(r) => r.timings.duration < 800,
    });
    sleep(1);

    // ── 12d. PATCH Reset Password (invalid token path) ──────────────────────────
    // Sends a deliberately bogus reset token. This is the only path K6 can
    // test without a real emailed token.
    //
    // YAML valid response: 400 ("Invalid or expired password reset token.")
    // If result is 500 → the error handler is broken. K6 will flag it.
    //
    // This test verifies the error path is resilient under concurrent load:
    // 100 VUs simultaneously sending bad tokens should not crash the server.
    const resetRes = http.patch(
      `${data.baseUrl}/auth/reset-password`,
      JSON.stringify({
        token:       BOGUS_RESET_TOKEN,
        newPassword: "NewSecure1!",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    check(resetRes, {
      "Auth Misc | Reset Password: status 400":      (r) => r.status === 400,
      "Auth Misc | Reset Password: not a 500":       (r) => r.status !== 500,
      "Auth Misc | Reset Password: response < 600ms":(r) => r.timings.duration < 600,
    });
    sleep(2);
  });
}
