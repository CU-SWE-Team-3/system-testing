// =============================================================================
// modules/engagement.js — Module 6: Engagement & Social Interactions
// =============================================================================
// Endpoints tested:
//   POST   /tracks/:id/like      — Like a track
//   DELETE /tracks/:id/like      — Unlike a track (cleanup)
//   POST   /tracks/:id/comments  — Post a timestamped waveform comment
//   POST   /tracks/:id/repost    — Repost a track (triggers feed fanout)
//   GET    /tracks/:id/likers    — Get list of users who liked the track
// =============================================================================

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate } from "k6/metrics";
import { authHeaders, parseJson, pick, randInt } from "../helpers.js";

const likeSuccessRate    = new Rate("biobeats_like_success_rate");
const commentSuccessRate = new Rate("biobeats_comment_success_rate");

const COMMENT_TEXTS = [
  "This drop is insane 🔥",
  "The bass here is perfect",
  "Been on repeat all week",
  "Who produced this?!",
  "Peak right here",
  "This is exactly what I needed",
  "Massive track 🙌",
];

const COMMENT_TIMESTAMPS = [10, 30, 45, 60, 90, 120, 150, 180];

export function engagementModule(data) {
  group("6 Engagement", function () {

    // ── 6a. POST Like ─────────────────────────────────────────────────────────
    // Writes to Interaction collection, increments likeCount + viralScore on Track,
    // sends a LIKE notification to the track owner.
    // 400 = "already liked" — expected race condition between VUs. Not an error.
    const likeRes = http.post(
      `${data.baseUrl}/tracks/${data.trackId}/like`,
      JSON.stringify({ targetModel: "Track" }),
      authHeaders(data.token)
    );
    const likeOk = check(likeRes, {
      "Engagement | Like: status 200, 201, or 400": (r) =>
        [200, 201, 400].includes(r.status),
      "Engagement | Like: response < 500ms":        (r) => r.timings.duration < 500,
    });
    likeSuccessRate.add(likeRes.status === 200 || likeRes.status === 201);
    sleep(1);

    // ── 6b. POST Comment ──────────────────────────────────────────────────────
    // Creates a Comment document, increments commentCount + viralScore,
    // and sends a COMMENT notification to the track owner.
    const commentRes = http.post(
      `${data.baseUrl}/tracks/${data.trackId}/comments`,
      JSON.stringify({
        content:   pick(COMMENT_TEXTS),
        timestamp: pick(COMMENT_TIMESTAMPS),
      }),
      authHeaders(data.token)
    );
    const commentOk = check(commentRes, {
      "Engagement | Comment: status 201":          (r) => r.status === 201,
      "Engagement | Comment: comment in response": (r) =>
        !!parseJson(r)?.data?.comment,
      "Engagement | Comment: response < 600ms":    (r) => r.timings.duration < 600,
    });
    commentSuccessRate.add(commentOk);
    sleep(1);

    // ── 6c. POST Repost ───────────────────────────────────────────────────────
    // Heaviest engagement action: triggers RabbitMQ fan-out to all of the
    // reposter's followers' feeds AND a notification to the track owner.
    // 400 = "already reposted" — valid race condition across VUs.
    const repostRes = http.post(
      `${data.baseUrl}/tracks/${data.trackId}/repost`,
      null,
      authHeaders(data.token)
    );
    check(repostRes, {
      "Engagement | Repost: status 201 or 400": (r) => [201, 400].includes(r.status),
      "Engagement | Repost: response < 600ms":  (r) => r.timings.duration < 600,
    });
    sleep(1);

    // ── 6d. GET Likers List ───────────────────────────────────────────────────
    // Paginated query of users who liked the track. No auth required per spec.
    const likersRes = http.get(
      `${data.baseUrl}/tracks/${data.trackId}/likers?page=1&limit=20`,
      authHeaders(data.token)
    );
    check(likersRes, {
      "Engagement | GET Likers: status 200":      (r) => r.status === 200,
      "Engagement | GET Likers: response < 500ms":(r) => r.timings.duration < 500,
    });
    sleep(1);

    // ── 6e. DELETE Unlike ─────────────────────────────────────────────────────
    // FIX: Removed JSON body from DELETE request.
    // YAML spec: requestBody is `required: false` and `targetModel` defaults to
    // "Track" when omitted. Express does not reliably parse bodies on DELETE
    // requests, causing req.body to be undefined and crashing the handler with
    // "Cannot read properties of undefined (reading 'targetModel')".
    // Sending null body lets the backend use its default, which is "Track".
    const unlikeRes = http.del(
      `${data.baseUrl}/tracks/${data.trackId}/like`,
      null,
      authHeaders(data.token)
    );
    check(unlikeRes, {
      "Engagement | Unlike: status 200 or 400": (r) => [200, 400].includes(r.status),
      "Engagement | Unlike: response < 500ms":  (r) => r.timings.duration < 500,
    });
    sleep(2);
  });
}
