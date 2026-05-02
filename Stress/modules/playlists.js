// =============================================================================
// modules/playlists.js — Group 7: Playlists
// YAML v1.12 endpoints covered:
//   GET    /playlists
//   GET    /playlists/{id}
//   POST   /playlists
//   PATCH  /playlists/{id}
//   PUT    /playlists/{id}/tracks    (replaces full track list — corrected from POST/DELETE)
//   GET    /playlists/{id}/embed
//   PATCH  /playlists/{id}/artwork   (multipart image upload)
//   DELETE /playlists/{id}
// NOTE: POST /playlists/{id}/tracks and DELETE /playlists/{id}/tracks/{trackId}
//       do NOT exist in v1.12 YAML. Track management is done via PUT (full replacement).
// =============================================================================
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import encoding from 'k6/encoding';
import { BASE_URL, TARGET_TRACK_ID, TARGET_PLAYLIST_ID } from '../config.js';

// Smallest valid 1×1 PNG for multipart upload tests
const TINY_PNG = encoding.b64decode(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'std', 'b'
);

export function playlistsModule(token) {
  const auth    = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const authOnly= { Authorization: `Bearer ${token}` };

  group('7 Playlists', () => {

    // 7.1 GET /playlists — browse public playlists
    const listRes = http.get(`${BASE_URL}/playlists?releaseType=playlist`, { headers: authOnly });
    check(listRes, { '[Playlists] list 200': (r) => r.status === 200 });
    sleep(0.3);

    // 7.2 GET /playlists/{id} — get seeded target playlist
    const getRes = http.get(`${BASE_URL}/playlists/${TARGET_PLAYLIST_ID}`, { headers: authOnly });
    check(getRes, {
      '[Playlists] getById 200':      (r) => r.status === 200,
      '[Playlists] getById has title':(r) => r.json('data.playlist.title') !== undefined,
    });
    sleep(0.3);

    // 7.3 POST /playlists — create a new playlist
    const createRes = http.post(`${BASE_URL}/playlists`,
      JSON.stringify({
        title:       `StressPlaylist_${Date.now()}`,
        description: 'k6 auto-generated',
        releaseType: 'playlist',
        genre:       'Electronic',
        isPrivate:   false,
        tracks:      [TARGET_TRACK_ID],
      }),
      { headers: auth });
    check(createRes, {
      '[Playlists] create 201':    (r) => r.status === 201,
      '[Playlists] create has _id':(r) => r.json('data.playlist._id') !== undefined,
    });

    let newId = null;
    if (createRes.status === 201) newId = createRes.json('data.playlist._id');
    sleep(0.3);

    if (newId) {
      // 7.4 PATCH /playlists/{id} — update metadata
      http.patch(`${BASE_URL}/playlists/${newId}`,
        JSON.stringify({ description: 'k6 updated' }), { headers: auth });
      sleep(0.3);

      // 7.5 PUT /playlists/{id}/tracks — replace full track list (add + reorder)
      const putTracksRes = http.put(`${BASE_URL}/playlists/${newId}/tracks`,
        JSON.stringify({ tracks: [TARGET_TRACK_ID] }),
        { headers: auth });
      check(putTracksRes, {
        '[Playlists] putTracks 200 or 403': (r) => r.status === 200 || r.status === 403,
      });
      sleep(0.3);

      // 7.6 PUT /playlists/{id}/tracks — remove track (send empty array)
      const clearTracksRes = http.put(`${BASE_URL}/playlists/${newId}/tracks`,
        JSON.stringify({ tracks: [] }),
        { headers: auth });
      check(clearTracksRes, {
        '[Playlists] clearTracks 200 or 403': (r) => r.status === 200 || r.status === 403,
      });
      sleep(0.3);

      // 7.7 GET /playlists/{id}/embed — get embed iframe code
      const embedRes = http.get(`${BASE_URL}/playlists/${newId}/embed`, { headers: authOnly });
      check(embedRes, {
        '[Playlists] embed 200 or 403': (r) => r.status === 200 || r.status === 403,
      });
      sleep(0.3);

      // 7.8 PATCH /playlists/{id}/artwork — multipart image upload (owned playlist)
      const artworkRes = http.patch(`${BASE_URL}/playlists/${newId}/artwork`, {
        artwork: http.file(TINY_PNG, 'artwork.png', 'image/png'),
      }, { headers: { Authorization: `Bearer ${token}` } });
      check(artworkRes, {
        '[Playlists] artwork 200 or 403': (r) => r.status === 200 || r.status === 403,
      });
      sleep(0.3);

      // 7.9 DELETE /playlists/{id} — cleanup
      const delRes = http.del(`${BASE_URL}/playlists/${newId}`, null, { headers: auth });
      check(delRes, {
        '[Playlists] delete 200 or 204': (r) => r.status === 200 || r.status === 204,
      });
    }

    sleep(1);
  });
}
