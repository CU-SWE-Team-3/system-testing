// =============================================================================
// config.js — BioBeats K6 Stress Test Configuration
// =============================================================================
// This is the ONLY file you need to edit before running any test.
// All other files import their settings from here.
// =============================================================================

// ─── Server ──────────────────────────────────────────────────────────────────
// Override via CLI: k6 run -e BASE_URL=https://api.biobeats.com/api stress_test_full.js
export const BASE_URL = __ENV.BASE_URL || "http://localhost:5000/api";

// ─── Test Account ─────────────────────────────────────────────────────────────
// Create this account manually in your DB once. Requirements:
//   • isEmailVerified: true      (login is blocked otherwise)
//   • role: Artist               (needed for track uploads)
//   • subscriptionPlan: Pro      (avoids 3-track upload limit)
export const TEST_EMAIL    = __ENV.TEST_EMAIL    || "soundcloud.testing.e2e@gmail.com";
export const TEST_PASSWORD = __ENV.TEST_PASSWORD || "TestPass2!";

// ─── Seeded Target IDs ────────────────────────────────────────────────────────
// You must create these in the DB before running. See README for instructions.

// Any existing user OTHER than the test account (for follow/unfollow tests)
export const TARGET_USER_ID = __ENV.TARGET_USER_ID || "69cefcfca47de9fd5a6da727";

// A public, fully-processed track (processingState:"Finished", isPublic:true, allowComments:true)
export const TARGET_TRACK_ID = __ENV.TARGET_TRACK_ID || "69cffa194d0969c445881a5d";

// A public playlist owned by ANY user (for playlist GET tests)
export const TARGET_PLAYLIST_ID = __ENV.TARGET_PLAYLIST_ID || "69e9d80755980692e64c9d40";

// A conversation that already exists between the test user and another user
// (for messaging read-receipt tests). Leave as-is if messages module creates one.
export const TARGET_CONVERSATION_ID = __ENV.TARGET_CONVERSATION_ID || "";

// An admin-role user account (ONLY needed for the admin module)
export const ADMIN_EMAIL    = __ENV.ADMIN_EMAIL    || "mohammed12hoss34@gmail.com";
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "Password123!";

// ─── CAPTCHA ─────────────────────────────────────────────────────────────────
// Google's public test key — works only if your server skips CAPTCHA in test mode.
// Ask your backend team to set SKIP_CAPTCHA=true or NODE_ENV=test in their .env.
export const TEST_CAPTCHA_TOKEN = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

// ─── Stress Test Stages ───────────────────────────────────────────────────────
// Used by stress_test_full.js (the full 8-minute stress run)
export const STRESS_STAGES = [
  { duration: "2m", target: 50  }, // Ramp up to 50 VUs
  { duration: "3m", target: 50  }, // Hold at 50 VUs (sustained stress)
  { duration: "2m", target: 100 }, // Spike to 100 VUs (breaking point)
  { duration: "1m", target: 0   }, // Ramp down (cooldown)
];

// Used by stress_test_quick.js (fast CI/sanity check — ~3 minutes)
export const QUICK_STAGES = [
  { duration: "1m", target: 20 }, // Ramp up
  { duration: "1m", target: 20 }, // Hold
  { duration: "1m", target: 0  }, // Ramp down
];

// ─── Global Thresholds ────────────────────────────────────────────────────────
// If any threshold is breached, k6 exits with a non-zero code (CI-friendly).
export const THRESHOLDS = {
  http_req_failed:                          ["rate<0.01"],   // <1% error rate
  "http_req_duration{p(95)}":              ["p(95)<800"],    // Global p95 < 800ms
  "http_req_duration{group:::1 Auth}":     ["p(95)<600"],
  "http_req_duration{group:::2 Profile}":  ["p(95)<500"],
  "http_req_duration{group:::3 Network}":  ["p(95)<600"],
  "http_req_duration{group:::4 Tracks}":   ["p(95)<1000"],
  "http_req_duration{group:::5 Playback}": ["p(95)<700"],
  "http_req_duration{group:::6 Engagement}":   ["p(95)<600"],
  "http_req_duration{group:::7 Playlists}":    ["p(95)<600"],
  "http_req_duration{group:::8 Discovery}":    ["p(95)<500"],
  "http_req_duration{group:::9 Messages}":     ["p(95)<700"],
  "http_req_duration{group:::10 Notifications}": ["p(95)<500"],
  "http_req_duration{group:::11 Admin}":       ["p(95)<800"],
};