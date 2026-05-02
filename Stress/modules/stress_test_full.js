// =============================================================================
// modules/stress_test_full.js — Inline Full Stress Run (13 Modules)
// =============================================================================
import http from 'k6/http';
import { sleep } from 'k6';
import {
  BASE_URL, TEST_EMAIL, TEST_PASSWORD,
  ADMIN_EMAIL, ADMIN_PASSWORD,
  STRESS_STAGES, THRESHOLDS,
} from './config.js';

import { authModule }          from './modules/auth.js';
import { profileModule }       from './modules/profile.js';
import { networkModule }       from './modules/network.js';
import { tracksModule }        from './modules/tracks.js';
import { playbackModule }      from './modules/playback.js';
import { engagementModule }    from './modules/engagement.js';
import { playlistsModule }     from './modules/playlists.js';
import { discoveryModule }     from './modules/discovery.js';
import { messagesModule }      from './modules/messages.js';
import { notificationsModule } from './modules/notifications.js';
import { adminModule }         from './modules/admin.js';
import { subscriptionModule }  from './modules/subscription.js';
import { stationsModule }      from './modules/stations.js';

export const options = { stages: STRESS_STAGES, thresholds: THRESHOLDS };

export function setup() {
  const H = { headers: { 'Content-Type': 'application/json' } };

  const loginRes = http.post(`${BASE_URL}/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }), H);
  if (loginRes.status !== 200)
    throw new Error(`[setup] Test user login FAILED (${loginRes.status}): ${loginRes.body}`);

  const token = loginRes.cookies.accessToken?.[0]?.value;
  if (!token) throw new Error('[setup] accessToken cookie missing');

  const adminRes = http.post(`${BASE_URL}/auth/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }), H);
  if (adminRes.status !== 200)
    throw new Error(`[setup] Admin login FAILED (${adminRes.status}): ${adminRes.body}`);

  const adminToken = adminRes.cookies.accessToken?.[0]?.value;
  if (!adminToken) throw new Error('[setup] Admin accessToken cookie missing');

  console.log('[setup] Both logins successful — starting stress run...');
  return { token, adminToken };
}

export default function (data) {
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
  adminModule(adminToken);
  subscriptionModule(token);
  stationsModule(token);

  sleep(1);
}

export function teardown() {
  console.log('[teardown] Full stress run complete.');
}
