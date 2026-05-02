// =============================================================================
// stress_test_full.js — Full BioBeats Stress Test (All 13 Modules)
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
//           -e TARGET_TRACK_PERMALINK=my-track-slug \
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
import { subscriptionModule }  from "./modules/subscription.js";
import { stationsModule }      from "./modules/stations.js";

// Re-export lifecycle hooks so k6 picks them up.
export { setup, teardown };

export const options = {
  stages:     STRESS_STAGES,
  thresholds: THRESHOLDS,
};

// Each VU runs all 13 modules sequentially on every iteration.
export default function (data) {
  if (!data?.token) {
    console.error("[VU] Setup failed — no token. Skipping iteration.");
    return;
  }

  const { token, adminToken } = data;

  authModule();
  profileModule(token);
  networkModule(token);
  tracksModule(token);
  playbackModule(token);
  engagementModule(token);
  playlistsModule(token);
  discoveryModule(token);
  messagesModule(token);
  notificationsModule(token);
  if (adminToken) adminModule(adminToken);
  subscriptionModule(token);
  stationsModule(token);
}
