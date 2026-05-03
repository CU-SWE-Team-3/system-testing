// =============================================================================
// modules/admin.js — Module 11: Moderation & Admin Dashboard
// =============================================================================
// Endpoints tested:
//   GET /admin/stats — Platform analytics dashboard
//
// IMPORTANT: All admin endpoints require role: "Admin".
// This module uses the separate adminToken from setup().
// If no admin account is configured, the module logs a warning and skips.
//
// The admin dashboard is a read-only aggregation query that runs across
// multiple collections (users, tracks, plays). Under load it reveals whether
// MongoDB can serve expensive analytics queries alongside user traffic.
// =============================================================================

import http from "k6/http";
import { check, group, sleep } from "k6";
import { authHeaders, parseJson } from "../helpers.js";

export function adminModule(data) {
  group("11 Admin", function () {

    // Skip gracefully if no admin token was acquired in setup().
    if (!data.adminToken) {
      console.warn("[Admin Module] No admin token — skipping. Configure ADMIN_EMAIL and ADMIN_PASSWORD in config.js.");
      sleep(1);
      return;
    }

    // ── 11a. GET Platform Analytics ───────────────────────────────────────────
    // Runs an aggregation across users, tracks, and play history.
    // This is intentionally the heaviest read query in the system.
    // If this endpoint degrades significantly during user load, it signals that
    // analytics queries need to be moved to a read replica or cached.
    const statsRes = http.get(
      `${data.baseUrl}/admin/stats`,
      authHeaders(data.adminToken)
    );
    check(statsRes, {
      "Admin | Stats: status 200":       (r) => r.status === 200,
      "Admin | Stats: success true":     (r) => parseJson(r)?.success === true,
      "Admin | Stats: response < 800ms": (r) => r.timings.duration < 800,
    });
    sleep(2);
  });
}
