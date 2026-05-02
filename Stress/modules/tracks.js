// =============================================================================
// modules/tracks.js — Group 4: Tracks
// YAML v1.12 endpoints covered:
//   GET    /tracks/{permalink}           (lookup by permalink slug, not raw ID)
//   GET    /tracks/my-tracks
//   GET    /tracks/autocomplete
//   GET    /tracks/search
//   PATCH  /tracks/{id}/metadata        (was /tracks/{id} — path corrected)
//   PATCH  /tracks/{id}/visibility
//   POST   /tracks/upload               (step 1 of upload pipeline)
//   PATCH  /tracks/{id}/confirm         (step 2 — trigger processing after SAS PUT)
//   GET    /tracks/{id}/download
//   PATCH  /tracks/{id}/artwork         (multipart image upload)
//   DELETE /tracks/{id}
// =============================================================================
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import encoding from 'k6/encoding';
import { BASE_URL, TARGET_TRACK_ID, TARGET_TRACK_PERMALINK } from '../config.js';

// Smallest valid 1×1 PNG for multipart upload tests
const TINY_PNG = encoding.b64decode(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'std', 'b'
);

export function tracksModule(token) {
  const auth    = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const authOnly= { Authorization: `Bearer ${token}` };

  group('4 Tracks', () => {

    // 4.1 GET /tracks/{permalink}  — fetch by permalink slug
    const getRes = http.get(`${BASE_URL}/tracks/${TARGET_TRACK_PERMALINK}`, { headers: authOnly });
    check(getRes, {
      '[Tracks] getByPermalink 200':          (r) => r.status === 200,
      '[Tracks] getByPermalink Finished':     (r) => r.json('data.track.processingState') === 'Finished',
      '[Tracks] getByPermalink isPublic true':(r) => r.json('data.track.isPublic') === true,
    });
    sleep(0.3);

    // 4.2 GET /tracks/my-tracks
    const myTracksRes = http.get(`${BASE_URL}/tracks/my-tracks`, { headers: authOnly });
    check(myTracksRes, {
      '[Tracks] myTracks 200':       (r) => r.status === 200,
      '[Tracks] myTracks success':   (r) => r.json('success') === true,
    });
    sleep(0.3);

    // 4.3 GET /tracks/autocomplete
    const autoRes = http.get(`${BASE_URL}/tracks/autocomplete?q=ele`);
    check(autoRes, { '[Tracks] autocomplete 200': (r) => r.status === 200 });
    sleep(0.3);

    // 4.4 GET /tracks/search
    const searchRes = http.get(`${BASE_URL}/tracks/search?q=electronic&page=1&limit=10`);
    check(searchRes, {
      '[Tracks] search 200':       (r) => r.status === 200,
      '[Tracks] search has tracks':(r) => Array.isArray(r.json('data.tracks')),
    });
    sleep(0.3);

    // 4.5 PATCH /tracks/{id}/metadata  — corrected path (was /tracks/{id})
    const patchRes = http.patch(`${BASE_URL}/tracks/${TARGET_TRACK_ID}/metadata`,
      JSON.stringify({ description: 'k6 stress update', tags: ['stress', 'test'], allowComments: true }),
      { headers: auth });
    check(patchRes, {
      '[Tracks] metadata 200 or 403': (r) => r.status === 200 || r.status === 403,
    });
    sleep(0.3);

    // 4.6 PATCH /tracks/{id}/visibility
    const visRes = http.patch(`${BASE_URL}/tracks/${TARGET_TRACK_ID}/visibility`,
      JSON.stringify({ isPublic: true }), { headers: auth });
    check(visRes, {
      '[Tracks] visibility 200 or 403': (r) => r.status === 200 || r.status === 403,
    });
    sleep(0.3);

    // 4.7 POST /tracks/upload  — step 1: initiate upload, get SAS URL
    const uploadInitRes = http.post(`${BASE_URL}/tracks/upload`,
      JSON.stringify({
        title:    `StressTrack_${Date.now()}`,
        format:   'audio/mpeg',
        size:     5242880,   // 5 MB
        duration: 180,       // 3 min estimate
      }),
      { headers: auth });

    let pendingTrackId = null;
    check(uploadInitRes, {
      '[Tracks] uploadInit 201':           (r) => r.status === 201,
      '[Tracks] uploadInit has trackId':   (r) =>
        r.json('data.trackId') !== undefined || r.json('data.track._id') !== undefined,
      '[Tracks] uploadInit has uploadUrl': (r) =>
        r.json('data.uploadUrl') !== undefined || r.json('data.sasUrl') !== undefined,
    });
    if (uploadInitRes.status === 201)
      pendingTrackId = uploadInitRes.json('data.trackId') || uploadInitRes.json('data.track._id');
    sleep(0.5);

    // 4.8 PATCH /tracks/{id}/confirm  — step 2: signal processing start
    // In stress tests we call confirm immediately (without uploading a real file).
    // The server may return 400/422 if the SAS upload was not completed — that is expected.
    if (pendingTrackId) {
      const confirmRes = http.patch(`${BASE_URL}/tracks/${pendingTrackId}/confirm`,
        null, { headers: auth });
      check(confirmRes, {
        '[Tracks] confirm 200 or 400 or 422': (r) =>
          r.status === 200 || r.status === 400 || r.status === 422,
      });
      sleep(0.3);
    }

    // 4.9 GET /tracks/{id}/download  — Premium only; test user is Pro
    const downloadRes = http.get(`${BASE_URL}/tracks/${TARGET_TRACK_ID}/download`,
      { headers: authOnly });
    check(downloadRes, {
      '[Tracks] download 200 or 403': (r) => r.status === 200 || r.status === 403,
    });
    sleep(0.3);

    // 4.10 PATCH /tracks/{id}/artwork — multipart image upload
    // Prefers the newly created pending track (owned); falls back to TARGET_TRACK_ID.
    const artworkTargetId = pendingTrackId || TARGET_TRACK_ID;
    const artworkRes = http.patch(`${BASE_URL}/tracks/${artworkTargetId}/artwork`, {
      artwork: http.file(TINY_PNG, 'artwork.png', 'image/png'),
    }, { headers: { Authorization: `Bearer ${token}` } });
    check(artworkRes, {
      '[Tracks] artwork 200 or 403': (r) => r.status === 200 || r.status === 403,
    });
    sleep(0.3);

    // 4.11 DELETE pending upload (cleanup)
    if (pendingTrackId) {
      const delRes = http.del(`${BASE_URL}/tracks/${pendingTrackId}`, null, { headers: auth });
      check(delRes, {
        '[Tracks] deleteUpload 200 or 204': (r) => r.status === 200 || r.status === 204,
      });
    }

    sleep(1);
  });
}
