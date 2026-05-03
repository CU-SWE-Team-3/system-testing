// =============================================================================
// modules/playback.js — Module 5: Playback & Streaming Engine
// =============================================================================
// Endpoints tested:
//   GET  /player/:id/stream   — Fetch HLS stream URL (hottest endpoint in any music app)
//   PUT  /player/state        — Save player state heartbeat
//   POST /history/progress    — Record playback progress (triggers play count logic)
//   GET  /history             — Fetch recently played list
// =============================================================================

import http from "k6/http";
import { check, group, sleep } from "k6";
import { authHeaders, parseJson, randInt } from "../helpers.js";

// Total duration of the seeded target track in seconds.
// Must match the actual track in your DB for the play-count logic to fire correctly.
const TRACK_DURATION_SECONDS = 210;

export function playbackModule(data) {
  group("5 Playback", function () {

    // ── 5a. GET Stream URL ────────────────────────────────────────────────────
    // Every "Play" button press hits this. Server checks: processingState,
    // user tier (Playable/Preview/Blocked), track visibility, release date.
    // This is the single highest-traffic endpoint in BioBeats.
    const streamRes = http.get(
      `${data.baseUrl}/player/${data.trackId}/stream`,
      authHeaders(data.token)
    );
    check(streamRes, {
      "Playback | GET Stream: status 200":           (r) => r.status === 200,
      "Playback | GET Stream: hlsUrl in response":   (r) =>
        typeof parseJson(r)?.data?.streamUrl === "string",
      "Playback | GET Stream: streamUrl has .m3u8":  (r) =>
        parseJson(r)?.data?.streamUrl?.includes("m3u8"),
      "Playback | GET Stream: response < 700ms":     (r) => r.timings.duration < 700,
    });
    sleep(1);

    // ── 5b. PUT Player State (Heartbeat) ──────────────────────────────────────
    // Clients send this every few seconds while audio is playing.
    // At 100 VUs, this = 100 concurrent MongoDB upserts — reveals write bottlenecks.
    const playerRes = http.put(
      `${data.baseUrl}/player/state`,
      JSON.stringify({
        currentTrack: data.trackId,
        currentTime:  randInt(1, TRACK_DURATION_SECONDS - 1),
        isPlaying:    true,
        queueContext: "feed",
        contextId:    null,
      }),
      authHeaders(data.token)
    );
    check(playerRes, {
      "Playback | PUT Player State: status 200":      (r) => r.status === 200,
      "Playback | PUT Player State: state saved":     (r) =>
        parseJson(r)?.status === "success" || parseJson(r)?.success === true,
      "Playback | PUT Player State: response < 500ms":(r) => r.timings.duration < 500,
    });
    sleep(1);

    // ── 5c. POST Playback Progress ────────────────────────────────────────────
    // Upserts a HistoryRecord. If progress >= 90% of duration, the server
    // increments playCount + viralScore on the Track document — a multi-doc write.
    // We vary progress to hit both the "counting" (>90%) and "not counting" paths.
    const progress = randInt(10, TRACK_DURATION_SECONDS);
    const historyRes = http.post(
      `${data.baseUrl}/history/progress`,
      JSON.stringify({
        trackId:  data.trackId,
        progress: progress,
        duration: TRACK_DURATION_SECONDS,
      }),
      authHeaders(data.token)
    );
    check(historyRes, {
      "Playback | POST Progress: status 200 or 201":  (r) => [200, 201].includes(r.status),
      "Playback | POST Progress: success true":       (r) => parseJson(r)?.success === true,
      "Playback | POST Progress: response < 600ms":   (r) => r.timings.duration < 600,
    });
    sleep(1);

    // ── 5d. GET Recently Played History ───────────────────────────────────────
    // FIX: /history → /history/recently-played.
    // GET /history is a DELETE-only route in the YAML spec (clear all history).
    // The paginated listening history endpoint is /history/recently-played.
    // YAML response: { success: true, results: N, page: N, data: { recentlyPlayed: [...] } }
    const historyFeedRes = http.get(
      `${data.baseUrl}/history/recently-played?page=1&limit=20`,
      authHeaders(data.token)
    );
    check(historyFeedRes, {
      "Playback | GET History: status 200":      (r) => r.status === 200,
      "Playback | GET History: response < 600ms":(r) => r.timings.duration < 600,
    });
    sleep(2);
  });
}
