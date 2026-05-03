// =============================================================================
// stress_test_quick.js — Quick Sanity Check (Hottest 4 Modules Only)
// =============================================================================
// USE THIS FOR: After every backend deployment during Phase 3.
//               Fast CI gate — runs in ~3 minutes at low VU count.
//               Catches regressions on the highest-traffic endpoints fast.
//
// MODULES INCLUDED:
//   Auth      — Login must always work
//   Playback  — Stream URL + history (hottest endpoints)
//   Engagement — Like/Comment/Repost (most write-amplified)
//   Discovery — Feed + search (most read-heavy)
//
// HOW TO RUN:
//   k6 run stress_test_quick.js
// =============================================================================

import { QUICK_STAGES, THRESHOLDS } from "./config.js";
import { setup, teardown }          from "./setup.js";

import { authModule }       from "./modules/auth.js";
import { playbackModule }   from "./modules/playback.js";
import { engagementModule } from "./modules/engagement.js";
import { discoveryModule }  from "./modules/discovery.js";

export { setup, teardown };

export const options = {
  stages: QUICK_STAGES,
  thresholds: {
    // Tighter thresholds for the quick check — these are the most critical paths.
    // FIX: "http_req_duration{p(95)}" is not a valid metric name. Curly braces
    // in K6 metric names are for tag filters (e.g. {group:::1 Auth}), not
    // percentile selectors. The percentile goes inside the condition array.
    http_req_failed:                            ["rate<0.01"],
    "http_req_duration":                        ["p(95)<600"],
    "http_req_duration{group:::1 Auth}":        ["p(95)<500"],
    "http_req_duration{group:::5 Playback}":    ["p(95)<600"],
    "http_req_duration{group:::6 Engagement}":  ["p(95)<500"],
    "http_req_duration{group:::8 Discovery}":   ["p(95)<500"],
  },
};

export default function (data) {
  if (!data?.token) {
    console.error("[VU] Setup failed — no token. Skipping iteration.");
    return;
  }

  authModule(data);
  playbackModule(data);
  engagementModule(data);
  discoveryModule(data);
}
