// =============================================================================
// modules/playback.js — Group 5: Playback
// YAML v1.12 endpoints covered:
//   GET    /player/{id}/stream              (path corrected — was /player/stream/{id})
//   GET    /player/state
//   PUT    /player/state
//   POST   /history/progress
//   GET    /history/recently-played
//   GET    /history/recently-played-playlists
//   GET    /history/recently-played-mixed
//   DELETE /history                         (clear all history — called last, after all reads)
// =============================================================================
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, TARGET_TRACK_ID } from '../config.js';

export function playbackModule(token) {
  const auth    = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const authOnly= { Authorization: `Bearer ${token}` };

  group('5 Playback', () => {

    // 5.1 GET /player/{id}/stream  — path corrected from /player/stream/{id}
    const streamRes = http.get(`${BASE_URL}/player/${TARGET_TRACK_ID}/stream`, { headers: authOnly });
    check(streamRes, {
      '[Playback] stream 200':     (r) => r.status === 200,
      '[Playback] stream has url': (r) => r.json('data.streamUrl') !== undefined,
    });
    sleep(0.3);

    // 5.2 GET /player/state
    const getStateRes = http.get(`${BASE_URL}/player/state`, { headers: authOnly });
    check(getStateRes, {
      '[Playback] getState 200':    (r) => r.status === 200,
      '[Playback] getState success':(r) => r.json('success') === true,
    });
    sleep(0.3);

    // 5.3 PUT /player/state
    const putStateRes = http.put(`${BASE_URL}/player/state`,
      JSON.stringify({
        currentTrack: TARGET_TRACK_ID,
        currentTime:  45.5,
        isPlaying:    true,
        queueContext: 'track',
        contextId:    TARGET_TRACK_ID,
      }),
      { headers: auth });
    check(putStateRes, {
      '[Playback] putState 200':    (r) => r.status === 200,
      '[Playback] putState success':(r) => r.json('success') === true,
    });
    sleep(0.3);

    // 5.4 POST /history/progress
    const progressRes = http.post(`${BASE_URL}/history/progress`,
      JSON.stringify({ trackId: TARGET_TRACK_ID, progress: 90.0 }),
      { headers: auth });
    check(progressRes, {
      '[Playback] progress 200 or 201': (r) => r.status === 200 || r.status === 201,
      '[Playback] progress success':    (r) => r.json('success') === true,
    });
    sleep(0.3);

    // 5.5 GET /history/recently-played
    const recentRes = http.get(
      `${BASE_URL}/history/recently-played?page=1&limit=10`,
      { headers: authOnly });
    check(recentRes, {
      '[Playback] recently-played 200':    (r) => r.status === 200,
      '[Playback] recently-played success':(r) => r.json('success') === true,
    });
    sleep(0.3);

    // 5.6 GET /history/recently-played-playlists
    const recentPlaylistsRes = http.get(
      `${BASE_URL}/history/recently-played-playlists?page=1&limit=10`,
      { headers: authOnly });
    check(recentPlaylistsRes, {
      '[Playback] recently-played-playlists 200': (r) => r.status === 200,
    });
    sleep(0.3);

    // 5.7 GET /history/recently-played-mixed
    const recentMixedRes = http.get(
      `${BASE_URL}/history/recently-played-mixed?page=1&limit=10`,
      { headers: authOnly });
    check(recentMixedRes, {
      '[Playback] recently-played-mixed 200': (r) => r.status === 200,
    });

    sleep(0.3);
    // 5.8 DELETE /history — clear all history (called after all read assertions)
    const clearHistoryRes = http.del(`${BASE_URL}/history`, null, { headers: auth });
    check(clearHistoryRes, {
      '[Playback] clearHistory 200': (r) => r.status === 200,
    });

    sleep(1);
  });
}
