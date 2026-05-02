// =============================================================================
// modules/network.js — Group 3: Network
// YAML v1.12 endpoints covered:
//   POST   /network/{id}/follow
//   DELETE /network/{id}/follow
//   POST   /network/{userId}/block
//   DELETE /network/{userId}/block
//   GET    /network/{userId}/followers
//   GET    /network/{userId}/following
//   GET    /network/suggested
//   GET    /network/blocked-users
// NOTE: GET /network/feed does NOT exist in v1.12 YAML — removed.
//       The activity feed lives at GET /feed (tested in Discovery module).
// =============================================================================
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, TARGET_USER_ID } from '../config.js';

export function networkModule(token) {
  const auth    = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const authOnly= { Authorization: `Bearer ${token}` };

  group('3 Network', () => {

    // 3.1 POST /network/{id}/follow
    const followRes = http.post(`${BASE_URL}/network/${TARGET_USER_ID}/follow`,
      null, { headers: auth });
    check(followRes, {
      '[Network] follow 200 or 400': (r) => r.status === 200 || r.status === 400,
    });
    sleep(0.3);

    // 3.2 DELETE /network/{id}/follow (cleanup)
    const unfollowRes = http.del(`${BASE_URL}/network/${TARGET_USER_ID}/follow`,
      null, { headers: auth });
    check(unfollowRes, {
      '[Network] unfollow 200 or 400': (r) => r.status === 200 || r.status === 400,
    });
    sleep(0.3);

    // 3.3 GET /network/{userId}/followers
    const followersRes = http.get(
      `${BASE_URL}/network/${TARGET_USER_ID}/followers?page=1&limit=10`,
      { headers: authOnly });
    check(followersRes, {
      '[Network] followers 200':   (r) => r.status === 200,
      '[Network] followers array': (r) => Array.isArray(r.json('data')),
    });
    sleep(0.3);

    // 3.4 GET /network/{userId}/following
    const followingRes = http.get(
      `${BASE_URL}/network/${TARGET_USER_ID}/following?page=1&limit=10`,
      { headers: authOnly });
    check(followingRes, {
      '[Network] following 200':   (r) => r.status === 200,
      '[Network] following array': (r) => Array.isArray(r.json('data')),
    });
    sleep(0.3);

    // 3.5 GET /network/suggested
    const suggestedRes = http.get(
      `${BASE_URL}/network/suggested?page=1&limit=10`,
      { headers: authOnly });
    check(suggestedRes, {
      '[Network] suggested 200':    (r) => r.status === 200,
      '[Network] suggested success':(r) => r.json('success') === true,
    });
    sleep(0.3);

    // 3.6 GET /network/blocked-users
    const blockedRes = http.get(`${BASE_URL}/network/blocked-users`, { headers: authOnly });
    check(blockedRes, {
      '[Network] blocked-users 200':    (r) => r.status === 200,
      '[Network] blocked-users success':(r) => r.json('success') === true,
    });
    sleep(0.3);

    // 3.7 POST /network/{userId}/block (paired with unblock to keep state clean)
    const blockRes = http.post(`${BASE_URL}/network/${TARGET_USER_ID}/block`,
      null, { headers: auth });
    check(blockRes, {
      '[Network] block 200 or 400': (r) => r.status === 200 || r.status === 400,
    });
    sleep(0.3);

    // 3.8 DELETE /network/{userId}/block (cleanup)
    const unblockRes = http.del(`${BASE_URL}/network/${TARGET_USER_ID}/block`,
      null, { headers: auth });
    check(unblockRes, {
      '[Network] unblock 200 or 400': (r) => r.status === 200 || r.status === 400,
    });

    sleep(1);
  });
}
