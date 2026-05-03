// =============================================================================
// modules/auth.js — Module 1: Authentication
// =============================================================================
// Endpoints tested:
//   POST /auth/register  — Signup (CAPTCHA-aware)
//   POST /auth/login     — Login + token generation
//   POST /auth/refresh   — Token refresh
// =============================================================================

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate } from "k6/metrics";
import { authHeaders, parseJson, generateUniqueUser } from "../helpers.js";
import { TEST_EMAIL, TEST_PASSWORD, TEST_CAPTCHA_TOKEN } from "../config.js";

const loginSuccessRate = new Rate("biobeats_login_success_rate");

export function authModule(data) {
  group("1 Auth", function () {

    // ── 1a. Signup ──────────────────────────────────────────────────────────
    // Will return 400 (CAPTCHA fail) unless your server has SKIP_CAPTCHA=true.
    // The check accepts 201, 400, and 409 so the script never fails on this.
    const user = generateUniqueUser();
    const signupRes = http.post(
      `${data.baseUrl}/auth/register`,
      JSON.stringify({
        email:        user.email,
        password:     "StressTest1",
        displayName:  user.displayName,
        age:          22,
        gender:       "Prefer not to say",
        captchaToken: TEST_CAPTCHA_TOKEN,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    check(signupRes, {
      "Auth | Signup: status 201, 400, or 409": (r) =>
        [201, 400, 409].includes(r.status),
      "Auth | Signup: response < 800ms": (r) => r.timings.duration < 800,
    });
    sleep(1);

    // ── 1b. Login ───────────────────────────────────────────────────────────
    const loginRes = http.post(
      `${data.baseUrl}/auth/login`,
      JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
      { headers: { "Content-Type": "application/json" } }
    );
    const loginOk = check(loginRes, {
      "Auth | Login: status 200":       (r) => r.status === 200,
      "Auth | Login: success true":     (r) => parseJson(r)?.success === true,
      "Auth | Login: user object":      (r) => !!parseJson(r)?.data?.user,
      "Auth | Login: response < 600ms": (r) => r.timings.duration < 600,
    });
    loginSuccessRate.add(loginOk);
    sleep(1);

    // ── 1c. Token Refresh ────────────────────────────────────────────────────
    // Passes the current token in the body (mobile-client style).
    // 401 is acceptable — token may have expired mid-test.
    const refreshRes = http.post(
      `${data.baseUrl}/auth/refresh`,
      JSON.stringify({ refreshToken: data.token }),
      { headers: { "Content-Type": "application/json" } }
    );
    check(refreshRes, {
      "Auth | Refresh: status 200 or 401": (r) => [200, 401].includes(r.status),
      "Auth | Refresh: response < 500ms":  (r) => r.timings.duration < 500,
    });
    sleep(2);
  });
}
