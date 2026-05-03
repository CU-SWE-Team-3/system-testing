// =============================================================================
// modules/profile.js — Module 2: User Profile
// =============================================================================
// Endpoints tested:
//   GET   /profile/:permalink   — Fetch public profile
//   PATCH /profile/update       — Update bio, location, genres
//   PATCH /profile/social-links — Replace social links array
// =============================================================================

import http from "k6/http";
import { check, group, sleep } from "k6";
import { authHeaders, parseJson, pick } from "../helpers.js";

const BIOS = [
  "Producer from Cairo 🎧",
  "Electronic music enthusiast",
  "Late night DJ sessions",
  "Beats, bass and beyond",
  "Creating sounds since 2020",
];

export function profileModule(data) {
  group("2 Profile", function () {

    // ── 2a. GET Public Profile ───────────────────────────────────────────────
    const getRes = http.get(
      `${data.baseUrl}/profile/${data.permalink}`,
      authHeaders(data.token)
    );
    check(getRes, {
      "Profile | GET: status 200":            (r) => r.status === 200,
      "Profile | GET: user object returned":  (r) => !!parseJson(r)?.data?.user,
      "Profile | GET: permalink matches":     (r) =>
        parseJson(r)?.data?.user?.permalink === data.permalink,
      "Profile | GET: response < 400ms":      (r) => r.timings.duration < 400,
    });
    sleep(1);

    // ── 2b. PATCH Update Profile ─────────────────────────────────────────────
    // Randomised bio so every request is distinct (avoids server-side no-op optimisations).
    const updateRes = http.patch(
      `${data.baseUrl}/profile/update`,
      JSON.stringify({
        bio:     pick(BIOS),
        country: "Egypt",
        city:    "Cairo",
        genres:  ["Electronic", "House", "Techno"],
      }),
      authHeaders(data.token)
    );
    check(updateRes, {
      "Profile | Update: status 200":       (r) => r.status === 200,
      "Profile | Update: success true":     (r) => parseJson(r)?.success === true,
      "Profile | Update: response < 500ms": (r) => r.timings.duration < 500,
    });
    sleep(1);

    // ── 2c. PATCH Social Links ────────────────────────────────────────────────
    // 400 is valid here — the API returns 400 when the new set equals the existing set.
    const linksRes = http.patch(
      `${data.baseUrl}/profile/social-links`,
      JSON.stringify({
        socialLinks: [
          { platform: "Instagram", url: "https://instagram.com/biobeats-stress" },
          { platform: "SoundCloud", url: "https://soundcloud.com/biobeats-stress" },
        ],
      }),
      authHeaders(data.token)
    );
    check(linksRes, {
      "Profile | Social Links: status 200 or 400": (r) =>
        [200, 400].includes(r.status),
      "Profile | Social Links: response < 500ms":  (r) => r.timings.duration < 500,
    });
    sleep(2);
  });
}
