// =============================================================================
// stress_test_auth_misc.js — Standalone Auth Misc Endpoint Test
// =============================================================================
// Tests the four auth endpoints that were previously untested and generating
// backend log noise:
//
//   POST  /auth/google/mobile       — Mobile Google ID-token login
//   POST  /auth/forgot-password     — Password reset request
//   POST  /auth/resend-verification — Re-send email verification link
//   PATCH /auth/reset-password      — Consume reset token + set new password
//
// USE THIS FOR:
//   • Isolating and verifying fixes for the Google token 500 errors.
//   • Running after any change to the auth service.
//   • Catching regressions on the password reset / email verification paths.
//
// EXPECTED RESULTS BEFORE BACKEND FIX:
//   ✗ Auth Misc | Google Mobile: status 200 or 400 — FAILS (gets 500)
//   ✗ Auth Misc | Google Mobile: not a 500         — FAILS
//   ✓ All other checks                             — PASS
//
// EXPECTED RESULTS AFTER BACKEND FIX (catches Firebase error → returns 400):
//   ✓ All checks                                   — PASS
//
// HOW TO RUN:
//   k6 run stress_test_auth_misc.js
//
// WITH OVERRIDES:
//   k6 run -e BASE_URL=http://localhost:5000/api \
//           -e TEST_EMAIL=soundcloud.testing.e2e@gmail.com \
//           stress_test_auth_misc.js
// =============================================================================

import { QUICK_STAGES, THRESHOLDS } from "./config.js";
import { setup, teardown }          from "./setup.js";
import { authMiscModule }           from "./modules/auth_misc.js";

export { setup, teardown };

export const options = {
  // Use QUICK_STAGES (3 min, max 20 VUs) — these endpoints involve email
  // delivery and Firebase verification, so keep load moderate.
  stages: QUICK_STAGES,
  thresholds: {
    http_req_failed:                              ["rate<0.05"],
    // Google mobile endpoint: 500 responses inflate this metric.
    // Once backend is fixed, tighten to rate<0.01.
    "http_req_duration{group:::12 Auth Misc}":    ["p(95)<900"],
    // Custom metric: tracks the pass rate of the google auth check.
    // Should be 0 (all fail with 500) before backend fix,
    // and close to 1 (all return 400) after.
    biobeats_google_auth_attempt_rate:            ["rate>0"],
  },
};

export default function (data) {
  if (!data?.token) {
    console.error("[VU] Setup failed — no token. Skipping iteration.");
    return;
  }

  authMiscModule(data);
}
