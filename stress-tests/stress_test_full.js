// =============================================================================
// stress_test_full.js — Full BioBeats Stress Test (All 11 Modules)
// =============================================================================
// USE THIS FOR: Phase 4 freeze-period testing, pre-release sign-off.
// Duration: ~8 minutes | Peak load: 100 concurrent VUs
//
// HOW TO RUN:
//   k6 run stress_test_full.js
//
// WITH OVERRIDES:
//   k6 run -e BASE_URL=https://api.biobeats.com/api \
//           -e TARGET_TRACK_ID=507f... \
//           -e TARGET_USER_ID=507f... \
//           stress_test_full.js
//
// WITH LIVE DASHBOARD:
//   k6 run --out dashboard stress_test_full.js
// =============================================================================

import { STRESS_STAGES, THRESHOLDS } from "./config.js";
import { setup, teardown }           from "./setup.js";

import { authModule }          from "./modules/auth.js";
import { profileModule }       from "./modules/profile.js";
import { networkModule }       from "./modules/network.js";
import { tracksModule }        from "./modules/tracks.js";
import { playbackModule }      from "./modules/playback.js";
import { engagementModule }    from "./modules/engagement.js";
import { playlistsModule }     from "./modules/playlists.js";
import { discoveryModule }     from "./modules/discovery.js";
import { messagesModule }      from "./modules/messages.js";
import { notificationsModule } from "./modules/notifications.js";
import { adminModule }         from "./modules/admin.js";
import { authMiscModule }      from "./modules/auth_misc.js";

// Re-export lifecycle hooks so k6 picks them up.
export { setup, teardown };

export const options = {
  stages:     STRESS_STAGES,
  thresholds: {
    ...THRESHOLDS,
    "http_req_duration{group:::12 Auth Misc}": ["p(95)<900"],
  },
};

// Each VU runs all 12 modules sequentially on every iteration.
export default function (data) {
  if (!data?.token) {
    console.error("[VU] Setup failed — no token. Skipping iteration.");
    return;
  }

  authModule(data);
  profileModule(data);
  networkModule(data);
  tracksModule(data);
  playbackModule(data);
  engagementModule(data);
  playlistsModule(data);
  discoveryModule(data);
  messagesModule(data);
  notificationsModule(data);
  adminModule(data);
  authMiscModule(data);
}
