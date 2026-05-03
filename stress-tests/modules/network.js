// =============================================================================
// modules/network.js — Module 3: Network / Social Graph
// =============================================================================
// Endpoints tested:
//   GET    /network/:userId/followers — Paginated followers list
//   GET    /network/:userId/following — Paginated following list
//   POST   /network/:id/follow        — Follow a user
//   DELETE /network/:id/follow        — Unfollow a user
// =============================================================================

import http from "k6/http";
import { check, group, sleep } from "k6";
import { authHeaders, parseJson } from "../helpers.js";

export function networkModule(data) {
  group("3 Network", function () {

    // ── 3a. GET Followers List ────────────────────────────────────────────────
    // No auth required per spec, but we send the token to simulate a logged-in user.
    const followersRes = http.get(
      `${data.baseUrl}/network/${data.targetUserId}/followers?page=1&limit=20`,
      authHeaders(data.token)
    );
    check(followersRes, {
      "Network | GET Followers: status 200":      (r) => r.status === 200,
      "Network | GET Followers: data is array":   (r) =>
        Array.isArray(parseJson(r)?.data),
      "Network | GET Followers: response < 500ms":(r) => r.timings.duration < 500,
    });
    sleep(1);

    // ── 3b. GET Following List ────────────────────────────────────────────────
    const followingRes = http.get(
      `${data.baseUrl}/network/${data.targetUserId}/following?page=1&limit=20`,
      authHeaders(data.token)
    );
    check(followingRes, {
      "Network | GET Following: status 200":       (r) => r.status === 200,
      "Network | GET Following: response < 500ms": (r) => r.timings.duration < 500,
    });
    sleep(1);

    // ── 3c. POST Follow ───────────────────────────────────────────────────────
    // 400 = "already following" — expected when multiple VUs race on the same target.
    // This is not an error; it's a valid idempotency scenario.
    const followRes = http.post(
      `${data.baseUrl}/network/${data.targetUserId}/follow`,
      null,
      authHeaders(data.token)
    );
    check(followRes, {
      "Network | Follow: status 200 or 400":   (r) => [200, 400].includes(r.status),
      "Network | Follow: response < 600ms":    (r) => r.timings.duration < 600,
    });
    sleep(1);

    // ── 3d. DELETE Unfollow ───────────────────────────────────────────────────
    // Immediately unfollow to keep state clean across iterations.
    // 400 = "not following" — expected if the follow above returned 400.
    const unfollowRes = http.del(
      `${data.baseUrl}/network/${data.targetUserId}/follow`,
      null,
      authHeaders(data.token)
    );
    check(unfollowRes, {
      "Network | Unfollow: status 200 or 400": (r) => [200, 400].includes(r.status),
      "Network | Unfollow: response < 600ms":  (r) => r.timings.duration < 600,
    });
    sleep(2);
  });
}
