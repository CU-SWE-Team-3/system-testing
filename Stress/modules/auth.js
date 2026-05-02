// =============================================================================
// modules/auth.js — Group 1: Auth
// YAML v1.12 endpoints covered:
//   POST  /auth/login
//   POST  /auth/refresh
//   PATCH /auth/update-email          (requires auth — called before logout)
//   POST  /auth/logout
//   POST  /auth/resend-verification
//   POST  /auth/forgot-password
//   POST  /auth/register              (uses already-registered email → 409 expected)
//   POST  /auth/verify-email          (invalid token → 400 expected)
//   PATCH /auth/reset-password        (invalid token → 400 expected)
//   POST  /auth/confirm-email-update  (invalid token → 400 expected)
//   GET   /auth/google
//   GET   /auth/google/callback       (missing code → 400 expected)
//   POST  /auth/google/mobile         (invalid idToken → 400 expected)
// =============================================================================
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, TEST_EMAIL, TEST_PASSWORD } from '../config.js';

const J = { 'Content-Type': 'application/json' };

export function authModule() {
  group('1 Auth', () => {

    // 1.1 POST /auth/login
    let freshToken = null;
    const loginRes = http.post(`${BASE_URL}/auth/login`,
      JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
      { headers: J });
    check(loginRes, {
      '[Auth] login 200':             (r) => r.status === 200,
      '[Auth] login success true':    (r) => r.json('success') === true,
      '[Auth] login has user._id':    (r) => r.json('data.user._id') !== undefined,
      '[Auth] login sets cookie':     (r) => r.cookies.accessToken !== undefined,
    });
    if (loginRes.status === 200 && loginRes.cookies.accessToken)
      freshToken = loginRes.cookies.accessToken[0].value;
    sleep(0.4);

    if (freshToken) {
      // 1.2 POST /auth/refresh
      const refreshRes = http.post(`${BASE_URL}/auth/refresh`, null,
        { headers: { Authorization: `Bearer ${freshToken}` } });
      check(refreshRes, {
        '[Auth] refresh 200':        (r) => r.status === 200,
        '[Auth] refresh new cookie': (r) => r.cookies.accessToken !== undefined,
      });
      if (refreshRes.status === 200 && refreshRes.cookies.accessToken)
        freshToken = refreshRes.cookies.accessToken[0].value;
      sleep(0.3);

      // 1.3 PATCH /auth/update-email — requires auth; must be called before logout.
      // Uses a unique throwaway address so the server never finds a conflict.
      // The actual email address never changes because confirm-email-update is not called.
      const updateEmailRes = http.patch(`${BASE_URL}/auth/update-email`,
        JSON.stringify({ newEmail: `k6stress${Date.now()}@example.com` }),
        { headers: { Authorization: `Bearer ${freshToken}`, 'Content-Type': 'application/json' } });
      check(updateEmailRes, {
        '[Auth] update-email 200 or 409': (r) => r.status === 200 || r.status === 409,
      });
      sleep(0.3);

      // 1.4 POST /auth/logout
      const logoutRes = http.post(`${BASE_URL}/auth/logout`, null,
        { headers: { Authorization: `Bearer ${freshToken}` } });
      check(logoutRes, {
        '[Auth] logout 200': (r) => r.status === 200,
      });
      sleep(0.3);
    }

    // 1.5 POST /auth/resend-verification — always 200, safe no-op with fake email
    const resendRes = http.post(`${BASE_URL}/auth/resend-verification`,
      JSON.stringify({ email: 'noop-k6@nonexistent.local' }),
      { headers: J });
    check(resendRes, { '[Auth] resend-verification 200': (r) => r.status === 200 });
    sleep(0.3);

    // 1.6 POST /auth/forgot-password — always 200, safe no-op with fake email
    const forgotRes = http.post(`${BASE_URL}/auth/forgot-password`,
      JSON.stringify({ email: 'noop-k6@nonexistent.local' }),
      { headers: J });
    check(forgotRes, { '[Auth] forgot-password 200': (r) => r.status === 200 });
    sleep(0.3);

    // 1.7 POST /auth/register — already-registered email → 409 conflict expected
    const registerRes = http.post(`${BASE_URL}/auth/register`,
      JSON.stringify({
        email:        TEST_EMAIL,
        password:     'AnyPass1!',
        displayName:  'K6 Stress',
        captchaToken: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Google test token
      }),
      { headers: J });
    check(registerRes, {
      '[Auth] register 409 or 400': (r) => r.status === 409 || r.status === 400,
    });
    sleep(0.3);

    // 1.8 POST /auth/verify-email — invalid token → 400 expected
    const verifyRes = http.post(`${BASE_URL}/auth/verify-email`,
      JSON.stringify({ token: 'invalid-k6-stress-token-00000000000' }),
      { headers: J });
    check(verifyRes, {
      '[Auth] verify-email 400': (r) => r.status === 400,
    });
    sleep(0.3);

    // 1.9 PATCH /auth/reset-password — invalid token → 400 expected
    const resetRes = http.patch(`${BASE_URL}/auth/reset-password`,
      JSON.stringify({ token: 'invalid-k6-reset-token-0000000000000', newPassword: 'NewPass1!' }),
      { headers: J });
    check(resetRes, {
      '[Auth] reset-password 400': (r) => r.status === 400,
    });
    sleep(0.3);

    // 1.10 POST /auth/confirm-email-update — invalid token → 400 expected
    const confirmUpdateRes = http.post(`${BASE_URL}/auth/confirm-email-update`,
      JSON.stringify({ token: 'invalid-k6-email-update-token-000000' }),
      { headers: J });
    check(confirmUpdateRes, {
      '[Auth] confirm-email-update 400': (r) => r.status === 400,
    });
    sleep(0.3);

    // 1.11 GET /auth/google — returns OAuth URL without browser redirect
    const googleUrlRes = http.get(`${BASE_URL}/auth/google`);
    check(googleUrlRes, {
      '[Auth] google url 200':      (r) => r.status === 200,
      '[Auth] google url has data': (r) => r.json('data.url') !== undefined,
    });
    sleep(0.3);

    // 1.12 GET /auth/google/callback — missing code param → 400 expected
    const callbackRes = http.get(`${BASE_URL}/auth/google/callback`);
    check(callbackRes, {
      '[Auth] google/callback 400': (r) => r.status === 400,
    });
    sleep(0.3);

    // 1.13 POST /auth/google/mobile — invalid idToken → 400 expected
    const mobileRes = http.post(`${BASE_URL}/auth/google/mobile`,
      JSON.stringify({ idToken: 'invalid-google-id-token-for-k6-stress' }),
      { headers: J });
    check(mobileRes, {
      '[Auth] google/mobile 400': (r) => r.status === 400,
    });

    sleep(1);
  });
}
