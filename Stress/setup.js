// =============================================================================
// setup.js — Shared Setup & Teardown Lifecycle Hooks
// =============================================================================
// Imported by BOTH runner files (stress_test_full.js & stress_test_quick.js).
// setup()    → runs once before any VU starts. Returns shared data for all VUs.
// teardown() → runs once after all VUs finish. Cleans up the session.
// =============================================================================

import http from "k6/http";
import { check } from "k6";
import {
  BASE_URL,
  TEST_EMAIL,
  TEST_PASSWORD,
  TEST_PERMALINK,
  TARGET_TRACK_ID,
  TARGET_TRACK_PERMALINK,
  TARGET_USER_ID,
  TARGET_PLAYLIST_ID,
  TARGET_CONVERSATION_ID,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from "./config.js";
import { parseJson, authHeaders } from "./helpers.js";

// ─── Setup ────────────────────────────────────────────────────────────────────
export function setup() {
  console.log(`[SETUP] Target API: ${BASE_URL}`);
  console.log(`[SETUP] Logging in as: ${TEST_EMAIL}`);

  // ── Standard User Login ───────────────────────────────────────────────────
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { "Content-Type": "application/json" } }
  );

  const loginOk = check(loginRes, {
    "[SETUP] Login status 200": (r) => r.status === 200,
    "[SETUP] Login success:true": (r) => {
      const b = parseJson(r);
      return b && b.success === true;
    },
  });

  if (!loginOk) {
    console.error(`[SETUP] LOGIN FAILED — status: ${loginRes.status}`);
    console.error(`[SETUP] Body: ${loginRes.body}`);
    console.error("[SETUP] HINT: Is the email verified? Is the server up?");
    return null;
  }

  const loginBody = parseJson(loginRes);

  // ── Extract Token ─────────────────────────────────────────────────────────
  // Try response body first (mobile-style), then fall back to Set-Cookie header.
  let token = loginBody?.data?.token || null;

  if (!token) {
    const cookies = loginRes.cookies["accessToken"];
    if (cookies && cookies.length > 0) {
      token = cookies[0].value;
      console.log("[SETUP] Token extracted from Set-Cookie header.");
    }
  } else {
    console.log("[SETUP] Token extracted from response body.");
  }

  if (!token) {
    console.error("[SETUP] Could not extract accessToken. Aborting.");
    return null;
  }

  const userId    = loginBody?.data?.user?._id       || null;
  const permalink = loginBody?.data?.user?.permalink || TEST_PERMALINK;

  // ── Admin Login (for Module 11 only) ──────────────────────────────────────
  let adminToken = null;
  const adminLoginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    { headers: { "Content-Type": "application/json" } }
  );

  if (adminLoginRes.status === 200) {
    const adminBody = parseJson(adminLoginRes);
    adminToken = adminBody?.data?.token
      || adminLoginRes.cookies["accessToken"]?.[0]?.value
      || null;
    console.log(adminToken
      ? "[SETUP] Admin token acquired."
      : "[SETUP] Admin login succeeded but token not found. Admin module will be skipped."
    );
  } else {
    console.warn(`[SETUP] Admin login failed (${adminLoginRes.status}). Admin module will be skipped.`);
  }

  console.log(`[SETUP] Setup complete. UserId: ${userId}, Permalink: ${permalink}`);

  // Everything returned here is passed as `data` to every VU's default() call.
  return {
    baseUrl:            BASE_URL,
    token,
    adminToken,
    userId,
    permalink,
    trackId:            TARGET_TRACK_ID,
    trackPermalink:     TARGET_TRACK_PERMALINK,
    targetUserId:       TARGET_USER_ID,
    playlistId:         TARGET_PLAYLIST_ID,
    conversationId:     TARGET_CONVERSATION_ID,
  };
}

// ─── Teardown ─────────────────────────────────────────────────────────────────
export function teardown(data) {
  if (!data?.token) {
    console.log("[TEARDOWN] No token — skipping logout.");
    return;
  }

  console.log("[TEARDOWN] Logging out test session...");
  const res = http.post(`${BASE_URL}/auth/logout`, null, authHeaders(data.token));

  check(res, {
    "[TEARDOWN] Logout status 200": (r) => r.status === 200,
  });

  console.log(`[TEARDOWN] Done. Logout status: ${res.status}`);
}
