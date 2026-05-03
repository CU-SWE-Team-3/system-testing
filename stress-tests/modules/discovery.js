// =============================================================================
// modules/discovery.js — Module 8: Feed, Search & Discovery
// =============================================================================
// Endpoints tested:
//   GET /discovery/trending    — Trending tracks chart (viralScore sorted)
//   GET /discovery/recommended — Personalised recommendations (no trailing 's')
//   GET /tracks/search?q=...   — Global search across tracks, users, playlists
//   GET /feed                  — Activity feed from followed artists (cursor-paginated)
//
// YAML FIXES APPLIED (v1.12):
//   ❌ /discovery/recommendations → ✅ /discovery/recommended
//   ❌ /network/feed              → ✅ /feed
//   ❌ /search                    → ✅ /tracks/search
//   ❌ page/limit on feed         → ✅ cursor-based pagination
// =============================================================================

import http from "k6/http";
import { check, group, sleep } from "k6";
import { authHeaders, parseJson, pick } from "../helpers.js";

const SEARCH_QUERIES = [
  "midnight",
  "chill",
  "electronic",
  "house",
  "beats",
  "cairo",
  "lo-fi",
  "deep",
];

export function discoveryModule(data) {
  group("8 Discovery", function () {

    // ── 8a. GET Trending Chart ────────────────────────────────────────────────
    // Read-only query sorted by viralScore. No auth required.
    // High-traffic endpoint — every app home screen loads this.
    const trendingRes = http.get(
      `${data.baseUrl}/discovery/trending?limit=20`,
      authHeaders(data.token)
    );
    check(trendingRes, {
      "Discovery | Trending: status 200":      (r) => r.status === 200,
      "Discovery | Trending: response < 500ms":(r) => r.timings.duration < 500,
    });
    sleep(1);

    // ── 8b. GET Recommendations ───────────────────────────────────────────────
    // FIX: /discovery/recommendations → /discovery/recommended (no trailing 's').
    // The old URL returned 404 every iteration — confirmed against YAML v1.12.
    // YAML response shape: { status: "success", results: N, data: { tracks: [...] } }
    const recsRes = http.get(
      `${data.baseUrl}/discovery/recommended`,
      authHeaders(data.token)
    );
    check(recsRes, {
      "Discovery | Recommendations: status 200":       (r) => r.status === 200,
      "Discovery | Recommendations: tracks array":     (r) =>
        Array.isArray(parseJson(r)?.data?.tracks),
      "Discovery | Recommendations: response < 700ms": (r) => r.timings.duration < 700,
    });
    sleep(1);

    // ── 8c. GET Global Search ─────────────────────────────────────────────────
    // FIX: /search → /tracks/search.
    // The old URL returned 404 every iteration — confirmed against YAML v1.12.
    // Randomised query to avoid result caching giving artificially fast responses.
    const query = pick(SEARCH_QUERIES);
    const searchRes = http.get(
      `${data.baseUrl}/tracks/search?q=${query}&page=1&limit=10`,
      authHeaders(data.token)
    );
    check(searchRes, {
      "Discovery | Search: status 200":       (r) => r.status === 200,
      "Discovery | Search: data returned":    (r) => !!parseJson(r)?.data,
      "Discovery | Search: response < 600ms": (r) => r.timings.duration < 600,
    });
    sleep(1);

    // ── 8d. GET Activity Feed ─────────────────────────────────────────────────
    // FIX: /network/feed → /feed (completely different base path).
    // FIX: Page/limit pagination → cursor-based. The /feed endpoint uses
    //      ?cursor=<ISO date> for pagination, not ?page=N&limit=N.
    // Omitting cursor on the first call returns the latest page (correct behaviour).
    // YAML response: { status: "success", data: { feed: [...], pagination: { nextCursor, hasMore } } }
    const feedRes = http.get(
      `${data.baseUrl}/feed?limit=20`,
      authHeaders(data.token)
    );
    check(feedRes, {
      "Discovery | Feed: status 200":        (r) => r.status === 200,
      "Discovery | Feed: feed array":        (r) =>
        Array.isArray(parseJson(r)?.data?.feed),
      "Discovery | Feed: response < 600ms":  (r) => r.timings.duration < 600,
    });
    sleep(2);
  });
}
