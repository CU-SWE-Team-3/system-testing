// =============================================================================
// modules/tracks.js — Module 4: Audio Upload & Track Management
// =============================================================================
// Endpoints tested:
//   POST  /tracks/upload        — Step 1: Initiate upload, get SAS URL
//   GET   /tracks/:permalink    — Fetch track metadata by permalink
//   PATCH /tracks/:id/visibility — Toggle track visibility
//
// NOTE: We do NOT test Step 2 (PUT to Azure SAS URL) or Step 3
// (PATCH /tracks/:id/confirm) because:
//   a) It would cost real Azure bandwidth/money.
//   b) It requires a real binary file upload outside k6's scope.
// These steps should be tested separately with a dedicated upload tool.
// =============================================================================

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate } from "k6/metrics";
import { authHeaders, parseJson, pick, randInt } from "../helpers.js";

const uploadInitRate = new Rate("biobeats_track_upload_init_rate");

const FORMATS = ["audio/mpeg", "audio/wav"];

export function tracksModule(data) {
  group("4 Tracks", function () {

    // ── 4a. POST Upload Initiation ────────────────────────────────────────────
    // Stresses: track document creation, upload limit checking, SAS URL generation.
    // 403 = upload limit hit (expected for Free-tier accounts — use a Pro account).
    const uploadRes = http.post(
      `${data.baseUrl}/tracks/upload`,
      JSON.stringify({
        title:    `Stress Track ${Date.now()}`,
        format:   pick(FORMATS),
        size:     randInt(500_000, 10_000_000), // 500 KB – 10 MB
        duration: randInt(30, 330),             // 30 sec – 5.5 min
      }),
      authHeaders(data.token)
    );
    const uploadOk = check(uploadRes, {
      "Tracks | Upload Init: status 201 or 403":  (r) => [201, 403].includes(r.status),
      "Tracks | Upload Init: response < 1000ms":  (r) => r.timings.duration < 1000,
    });
    uploadInitRate.add(uploadOk);

    // If the upload was created, verify the response shape then immediately
    // DELETE the orphaned track document.
    //
    // FIX: Without this cleanup, every upload-init call leaves a Track document
    // in MongoDB with processingState: "Processing" and queues an audio worker
    // ticket. The worker then fails with "The specified blob does not exist"
    // because no file was ever uploaded to Azure — generating noise in every
    // stress run.
    //
    // YAML: DELETE /tracks/{id} returns 200 and gracefully handles a missing
    // Azure blob ("If the Azure deletion fails, the error is logged but the
    // MongoDB document is still deleted").
    if (uploadRes.status === 201) {
      const body = parseJson(uploadRes);
      check(body, {
        "Tracks | Upload Init: trackId returned":  (b) =>
          typeof b?.data?.trackId === "string" && b.data.trackId.length === 24,
        "Tracks | Upload Init: uploadUrl returned": (b) =>
          typeof b?.data?.uploadUrl === "string",
      });

      const newTrackId = body?.data?.trackId;
      if (newTrackId) {
        const deleteRes = http.del(
          `${data.baseUrl}/tracks/${newTrackId}`,
          null,
          authHeaders(data.token)
        );
        check(deleteRes, {
          "Tracks | Upload Cleanup: status 200 or 404": (r) =>
            [200, 404].includes(r.status),
        });
      }
    }
    sleep(2);

    // ── 4b. GET Track by Permalink ────────────────────────────────────────────
    // Uses the seeded target track. Stresses the track read path including
    // visibility checking, stats display logic, and artist population.
    const trackRes = http.get(
      `${data.baseUrl}/tracks/${data.trackId}`,
      authHeaders(data.token)
    );
    check(trackRes, {
      "Tracks | GET Track: status 200":               (r) => r.status === 200,
      "Tracks | GET Track: track object returned":    (r) => !!parseJson(r)?.data?.track,
      "Tracks | GET Track: processingState Finished": (r) =>
        parseJson(r)?.data?.track?.processingState === "Finished",
      "Tracks | GET Track: response < 500ms":         (r) => r.timings.duration < 500,
    });
    sleep(2);
  });
}
