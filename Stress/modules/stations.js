// =============================================================================
// modules/stations.js — Group 13: Stations (NEW — v1.12 only)
// Endpoints: GET /stations/liked,
//            POST /stations/{stationId}/like,
//            GET  /stations/{stationId}/like  (check liked status),
//            DELETE /stations/{stationId}/like (unlike — cleanup)
// Note: stationId is a string identifier like "genre_electronic", not a MongoId.
//       Like is paired with unlike to keep DB state clean per iteration.
// =============================================================================
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL } from '../config.js';

const STATION_ID = 'genre_electronic';

export function stationsModule(token) {
  const auth    = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const authOnly= { Authorization: `Bearer ${token}` };

  group('13 Stations', () => {

    // 13.1 GET /stations/liked  (lightweight — no hydration)
    const likedRes = http.get(
      `${BASE_URL}/stations/liked?page=1&limit=10&hydrate=false`,
      { headers: authOnly });
    check(likedRes, {
      '[Stations] liked 200':        (r) => r.status === 200,
      '[Stations] liked success':    (r) => r.json('success') === true,
      '[Stations] liked has stations':(r) =>
        Array.isArray(r.json('data.stations')),
    });
    sleep(0.3);

    // 13.2 GET /stations/{stationId}/like  (check status before acting)
    const checkRes = http.get(
      `${BASE_URL}/stations/${STATION_ID}/like`,
      { headers: authOnly });
    check(checkRes, {
      '[Stations] checkLiked 200':    (r) => r.status === 200,
      '[Stations] checkLiked boolean':(r) =>
        typeof r.json('data.liked') === 'boolean',
    });

    const alreadyLiked = checkRes.status === 200 && checkRes.json('data.liked') === true;
    sleep(0.3);

    // 13.3 POST /stations/{stationId}/like  (skip if already liked to avoid 400)
    if (!alreadyLiked) {
      const likeRes = http.post(
        `${BASE_URL}/stations/${STATION_ID}/like`,
        JSON.stringify({
          stationType: 'genre',
          stationTitle: 'Electronic',
          stationDescription: 'Top Electronic tracks based on your listening',
          genre: 'Electronic',
        }),
        { headers: auth });
      check(likeRes, {
        '[Stations] like 201 or 400': (r) => r.status === 201 || r.status === 400,
      });
      sleep(0.3);
    }

    // 13.4 DELETE /stations/{stationId}/like  (cleanup — unlike regardless)
    const unlikeRes = http.del(
      `${BASE_URL}/stations/${STATION_ID}/like`,
      null, { headers: auth });
    check(unlikeRes, {
      '[Stations] unlike 200 or 400': (r) => r.status === 200 || r.status === 400,
    });

    sleep(1);
  });
}
