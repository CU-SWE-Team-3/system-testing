// =============================================================================
// modules/discovery.js — Group 8: Discovery
// YAML v1.12 endpoints covered:
//   GET /discovery/trending
//   GET /discovery/recommended
//   GET /discovery/genre/{genre}
//   GET /discovery/artist/{artistId}
//   GET /discovery/liked-stations
//   GET /discovery/related/{trackId}
//   GET /discovery/collaborative/{trackId}
//   GET /discovery/more-like-liked
//   GET /discovery/mixed-for-you         (was /discovery/mixed — path corrected)
//   GET /discovery/curated
//   GET /feed                            (personalised activity feed — was /discovery/feed)
// =============================================================================
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, TARGET_TRACK_ID, TARGET_USER_ID } from '../config.js';

export function discoveryModule(token) {
  const auth   = { Authorization: `Bearer ${token}` };
  const noAuth = {};

  group('8 Discovery', () => {

    // 8.1 GET /discovery/trending
    const trendingRes = http.get(`${BASE_URL}/discovery/trending?limit=10`, { headers: noAuth });
    check(trendingRes, { '[Discovery] trending 200': (r) => r.status === 200 });
    sleep(0.3);

    // 8.2 GET /discovery/recommended
    const recRes = http.get(`${BASE_URL}/discovery/recommended`, { headers: auth });
    check(recRes, { '[Discovery] recommended 200': (r) => r.status === 200 });
    sleep(0.3);

    // 8.3 GET /discovery/genre/{genre}
    const genreRes = http.get(`${BASE_URL}/discovery/genre/Electronic`, { headers: noAuth });
    check(genreRes, { '[Discovery] genre 200': (r) => r.status === 200 });
    sleep(0.3);

    // 8.4 GET /discovery/artist/{artistId}
    const artistRes = http.get(`${BASE_URL}/discovery/artist/${TARGET_USER_ID}`, { headers: noAuth });
    check(artistRes, {
      '[Discovery] artist 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    sleep(0.3);

    // 8.5 GET /discovery/liked-stations
    const likedStationsRes = http.get(`${BASE_URL}/discovery/liked-stations`, { headers: auth });
    check(likedStationsRes, { '[Discovery] liked-stations 200': (r) => r.status === 200 });
    sleep(0.3);

    // 8.6 GET /discovery/related/{trackId}
    const relatedRes = http.get(`${BASE_URL}/discovery/related/${TARGET_TRACK_ID}`, { headers: noAuth });
    check(relatedRes, { '[Discovery] related 200': (r) => r.status === 200 });
    sleep(0.3);

    // 8.7 GET /discovery/collaborative/{trackId}
    const collabRes = http.get(`${BASE_URL}/discovery/collaborative/${TARGET_TRACK_ID}`, { headers: auth });
    check(collabRes, { '[Discovery] collaborative 200': (r) => r.status === 200 });
    sleep(0.3);

    // 8.8 GET /discovery/more-like-liked
    const moreLikedRes = http.get(`${BASE_URL}/discovery/more-like-liked`, { headers: auth });
    check(moreLikedRes, { '[Discovery] more-like-liked 200': (r) => r.status === 200 });
    sleep(0.3);

    // 8.9 GET /discovery/mixed-for-you  — corrected path (was /discovery/mixed)
    const mixedRes = http.get(`${BASE_URL}/discovery/mixed-for-you`, { headers: auth });
    check(mixedRes, { '[Discovery] mixed-for-you 200': (r) => r.status === 200 });
    sleep(0.3);

    // 8.10 GET /discovery/curated
    const curatedRes = http.get(`${BASE_URL}/discovery/curated`, { headers: auth });
    check(curatedRes, { '[Discovery] curated 200': (r) => r.status === 200 });
    sleep(0.3);

    // 8.11 GET /feed — personalised activity feed (was incorrectly /discovery/feed)
    const feedRes = http.get(`${BASE_URL}/feed?page=1&limit=10`, { headers: auth });
    check(feedRes, { '[Discovery] feed 200': (r) => r.status === 200 });

    sleep(1);
  });
}
